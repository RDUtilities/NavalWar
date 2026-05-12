import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const rootDir = process.cwd();
const cwebpBin = process.env.CWEBP_BIN || "cwebp";
const tableWidth = 768;
const tableHeight = 512;
const tableQuality = 82;
const zoomQuality = 88;

const cardSets = [
  {
    label: "play",
    sourceDir: "assets/cards/play/Modern",
    outputDir: "assets/optimized/cards/play"
  },
  {
    label: "ships",
    sourceDir: "assets/cards/ships/Modern",
    outputDir: "assets/optimized/cards/ships"
  }
];

function webpName(fileName) {
  return `${path.basename(fileName, path.extname(fileName))}.webp`;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} exited ${code}: ${stderr.trim()}`));
    });
  });
}

async function convertCard(inputPath, outputPath, args) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await run(cwebpBin, [...args, inputPath, "-o", outputPath]);
}

async function getPngFiles(relativeDir) {
  const absoluteDir = path.join(rootDir, relativeDir);
  const entries = await readdir(absoluteDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".png"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

async function fileRecord(relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  const fileStat = await stat(absolutePath);
  return {
    url: `/${relativePath.split(path.sep).join("/")}`,
    bytes: fileStat.size
  };
}

const manifest = {
  generatedAt: new Date().toISOString(),
  sourceFormat: "png",
  runtimeFormat: "webp",
  tiers: {
    table: {
      width: tableWidth,
      height: tableHeight,
      quality: tableQuality
    },
    zoom: {
      width: 1536,
      height: 1024,
      quality: zoomQuality
    }
  },
  sets: {}
};

for (const cardSet of cardSets) {
  const files = await getPngFiles(cardSet.sourceDir);
  const records = [];

  for (const fileName of files) {
    const inputPath = path.join(rootDir, cardSet.sourceDir, fileName);
    const tableRelativePath = path.join(cardSet.outputDir, "table", webpName(fileName));
    const zoomRelativePath = path.join(cardSet.outputDir, "zoom", webpName(fileName));

    await convertCard(inputPath, path.join(rootDir, tableRelativePath), [
      "-quiet",
      "-q",
      String(tableQuality),
      "-resize",
      String(tableWidth),
      String(tableHeight)
    ]);

    await convertCard(inputPath, path.join(rootDir, zoomRelativePath), [
      "-quiet",
      "-q",
      String(zoomQuality)
    ]);

    records.push({
      source: await fileRecord(path.join(cardSet.sourceDir, fileName)),
      table: await fileRecord(tableRelativePath),
      zoom: await fileRecord(zoomRelativePath)
    });
  }

  const originalBytes = records.reduce((sum, record) => sum + record.source.bytes, 0);
  const runtimeBytes = records.reduce((sum, record) => sum + record.table.bytes + record.zoom.bytes, 0);
  manifest.sets[cardSet.label] = {
    cardCount: records.length,
    originalBytes,
    runtimeBytes,
    savingsRatio: Number((1 - runtimeBytes / originalBytes).toFixed(4)),
    cards: records
  };
}

const manifestPath = path.join(rootDir, "assets/optimized/cards/manifest.json");
await mkdir(path.dirname(manifestPath), { recursive: true });
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const totals = Object.values(manifest.sets).reduce(
  (summary, set) => ({
    cardCount: summary.cardCount + set.cardCount,
    originalBytes: summary.originalBytes + set.originalBytes,
    runtimeBytes: summary.runtimeBytes + set.runtimeBytes
  }),
  { cardCount: 0, originalBytes: 0, runtimeBytes: 0 }
);

console.log(
  `Optimized ${totals.cardCount} cards: ${totals.originalBytes} source bytes -> ${totals.runtimeBytes} WebP bytes.`
);
