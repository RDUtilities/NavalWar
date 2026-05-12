import { readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const outputPath = path.join(rootDir, "pwa-assets.json");

const assetRoots = [
  "assets/optimized/cards",
  "assets/sound",
  "prototype/rules-art"
];

const allowedExtensions = new Set([
  ".avif",
  ".gif",
  ".html",
  ".jpeg",
  ".jpg",
  ".json",
  ".mp3",
  ".ogg",
  ".png",
  ".svg",
  ".wav",
  ".webmanifest",
  ".webp"
]);

async function walk(relativeDir, assets) {
  const absoluteDir = path.join(rootDir, relativeDir);
  let entries;

  try {
    entries = await readdir(absoluteDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      return;
    }
    throw error;
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const relativePath = path.join(relativeDir, entry.name);

    if (entry.isDirectory()) {
      await walk(relativePath, assets);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (!allowedExtensions.has(extension)) {
      continue;
    }

    const fileStat = await stat(path.join(rootDir, relativePath));
    assets.push({
      url: `/${relativePath.split(path.sep).join("/")}`,
      bytes: fileStat.size
    });
  }
}

async function listSourceCardPngs(relativeDir) {
  const absoluteDir = path.join(rootDir, relativeDir);
  const entries = await readdir(absoluteDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".png"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function optimizedCardPath(kind, tier, sourceFileName) {
  return path.join(
    rootDir,
    "assets",
    "optimized",
    "cards",
    kind,
    tier,
    `${path.basename(sourceFileName, path.extname(sourceFileName))}.webp`
  );
}

async function validateOptimizedCards() {
  const missing = [];
  const sourceSets = [
    { kind: "play", dir: "assets/cards/play/Modern" },
    { kind: "ships", dir: "assets/cards/ships/Modern" }
  ];

  for (const sourceSet of sourceSets) {
    const sourceFiles = await listSourceCardPngs(sourceSet.dir);
    for (const sourceFile of sourceFiles) {
      for (const tier of ["table", "zoom"]) {
        try {
          await stat(optimizedCardPath(sourceSet.kind, tier, sourceFile));
        } catch (error) {
          if (error.code === "ENOENT") {
            missing.push(`${sourceSet.kind}/${tier}/${sourceFile}`);
            continue;
          }
          throw error;
        }
      }
    }
  }

  if (missing.length) {
    throw new Error(
      `Missing optimized card assets. Run npm run optimize:assets. Missing: ${missing.slice(0, 12).join(", ")}${
        missing.length > 12 ? `, and ${missing.length - 12} more` : ""
      }`
    );
  }
}

const assets = [];

await validateOptimizedCards();

for (const assetRoot of assetRoots) {
  await walk(assetRoot, assets);
}

assets.sort((a, b) => a.url.localeCompare(b.url));

const payload = {
  generatedAt: new Date().toISOString(),
  assetCount: assets.length,
  totalBytes: assets.reduce((sum, asset) => sum + asset.bytes, 0),
  assets
};

await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);

console.log(
  `Wrote ${path.relative(rootDir, outputPath)} with ${payload.assetCount} assets (${payload.totalBytes} bytes).`
);
