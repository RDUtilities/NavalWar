import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { macToolchainEnvironment } from './mac_toolchain.mjs';
const toolchain = macToolchainEnvironment();
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const build = path.join(root, 'macos/build');
const app = path.join(build, 'Naval War.app');
const stage = path.join(build, 'Naval War.staging.app');
// Preflight before changing the last successful application bundle.
execFileSync('xcrun', ['swift', '--version'], { stdio: 'inherit', env: toolchain });
execFileSync('node', ['scripts/bundle_mac_engine.mjs'], { cwd: root, stdio: 'inherit' });
await fs.rm(stage, { recursive: true, force: true });
const contents = path.join(stage, 'Contents');
const resources = path.join(contents, 'Resources');
await fs.mkdir(path.join(contents, 'MacOS'), { recursive: true });
await fs.mkdir(path.join(resources, 'Cards'), { recursive: true });
await fs.mkdir(path.join(resources, 'CardDetails'), { recursive: true });
await fs.mkdir(path.join(resources, 'Audio'), { recursive: true });
const map = {};
for (const [set, back] of [['play', 'playBack'], ['ships', 'shipBack']]) {
    const manifest = JSON.parse(await fs.readFile(path.join(root, `assets/cards/${set}/Modern/manifest.json`), 'utf8'));
    for (const card of manifest.cards) {
        const filename = path.basename(card.file, path.extname(card.file)) + '.webp';
        const destination = `Cards/${set}-${filename}`;
        await fs.copyFile(path.join(root, `assets/optimized/cards/${set}/table`, filename), path.join(resources, destination));
        const key = set === 'ships' ? `ship-${card.id}` : card.kind === 'salvo' ? `play:salvo:${card.gunCaliber}:${card.hits}` : ['minefield', 'additional_damage'].includes(card.kind) ? `play:${card.kind}:${card.hits}` : `play:${card.kind}`;
        map[key] = destination;
        const detail = `CardDetails/${set}-${filename}`;
        await fs.copyFile(path.join(root, `assets/optimized/cards/${set}/zoom`, filename), path.join(resources, detail));
        map[`zoom:${key}`] = detail;
    }
    const filename = path.basename(Object.values(manifest.sharedArt)[0], '.png') + '.webp';
    const destination = `Cards/${set}-${filename}`;
    await fs.copyFile(path.join(root, `assets/optimized/cards/${set}/table`, filename), path.join(resources, destination));
    map[back] = destination;
    const detail = `CardDetails/${set}-${filename}`;
    await fs.copyFile(path.join(root, `assets/optimized/cards/${set}/zoom`, filename), path.join(resources, detail));
    map[`zoom:${back}`] = detail;
}
for (const [key, file] of [['logo', 'navalWarLogo-Transparent.png'], ['table', 'War-Table.png']]) {
    await fs.copyFile(path.join(root, 'assets', file), path.join(resources, file)); map[key] = file;
}
await fs.writeFile(path.join(resources, 'artwork.json'), JSON.stringify(map, null, 2));
for (const file of await fs.readdir(path.join(root, 'assets/sound'))) if (file.endsWith('.wav'))
    await fs.copyFile(path.join(root, 'assets/sound', file), path.join(resources, 'Audio', file));
await fs.copyFile(path.join(root, 'macos/Resources/naval-engine.js'), path.join(resources, 'naval-engine.js'));
const iconset = path.join(build, 'NavalWar.iconset');
await fs.mkdir(iconset, { recursive: true });
for (const size of [16, 32, 128, 256, 512]) {
    execFileSync('sips', ['-z', String(size), String(size), path.join(root,'assets/icons/icon-512.png'), '--out', path.join(iconset, `icon_${size}x${size}.png`)], {stdio:'ignore'});
    if (size < 512) execFileSync('sips', ['-z', String(size*2), String(size*2), path.join(root,'assets/icons/icon-512.png'), '--out', path.join(iconset, `icon_${size}x${size}@2x.png`)], {stdio:'ignore'});
}
execFileSync('iconutil', ['-c','icns',iconset,'-o',path.join(resources,'NavalWar.icns')]);
await fs.writeFile(path.join(contents, 'Info.plist'), `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleExecutable</key><string>NavalWar</string>
<key>CFBundleIdentifier</key><string>local.navalwar.mac</string>
<key>CFBundleIconFile</key><string>NavalWar</string>
<key>CFBundleName</key><string>Naval War</string>
<key>CFBundleDisplayName</key><string>Naval War</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>0.1.0</string>
<key>CFBundleVersion</key><string>1</string>
<key>LSMinimumSystemVersion</key><string>14.0</string>
<key>NSHighResolutionCapable</key><true/>
<key>NSSupportsAutomaticTermination</key><false/>
</dict></plist>`);
const sources = (await fs.readdir(path.join(root, 'macos/Sources'))).filter(file => file.endsWith('.swift')).map(file => path.join(root, 'macos/Sources', file));
const arch = process.arch === 'arm64' ? 'arm64' : 'x86_64';
execFileSync('xcrun', ['swiftc', '-swift-version', '5', '-parse-as-library', '-O', '-target', `${arch}-apple-macosx14.0`, ...sources, '-o', path.join(contents, 'MacOS/NavalWar'), '-framework', 'SwiftUI', '-framework', 'SpriteKit', '-framework', 'JavaScriptCore', '-framework', 'AppKit'], { cwd: root, stdio: 'inherit', env: toolchain });
execFileSync('codesign', ['--force', '--deep', '--sign', '-', stage], { stdio: 'inherit' });
execFileSync('codesign', ['--verify', '--deep', '--strict', stage], { stdio: 'inherit' });
const previous = path.join(build, 'Naval War.previous.app');
await fs.rm(previous, { recursive: true, force: true });
try { await fs.rename(app, previous); } catch (error) { if (error.code !== 'ENOENT') throw error; }
await fs.rename(stage, app);
console.log(`Built ${app}`);
console.log(`Bundled ${Object.keys(map).length} artwork entries. Local development signature; not notarized for distribution.`);
