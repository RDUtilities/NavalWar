import { readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const outputPath = path.join(rootDir, "pwa-assets.json");

const assetRoots = [
  "assets/cards/play/Modern",
  "assets/cards/ships/Modern",
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

const assets = [];

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
