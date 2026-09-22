import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {macToolchainEnvironment} from './mac_toolchain.mjs';
const resources = process.argv[2] ?? 'macos/build/Naval War.app/Contents/Resources';

const web = await fs.readFile('prototype/app.js','utf8');
const files = [...new Set([...web.matchAll(/new Audio\("\.\.\/assets\/sound\/([^"/]+)"\)/g)].map(match=>match[1]))];
assert.equal(files.length,16);
for (const file of files) {
  const samples = path => execFileSync('ffmpeg',['-nostdin','-v','error','-i',path,'-vn','-f','s16le','-c:a','pcm_s16le','-'],{maxBuffer:64*1024*1024});
  assert(samples(`assets/sound/${file}`).equals(samples(`${resources}/Audio/${file}`)), `Bundled audio samples differ: ${file}`);
}
console.log(`PASS: all ${files.length} web sound files bundled with matching decoded PCM samples.`);

await fs.writeFile('macos/build/web-sound-manifest.json',JSON.stringify(files.map(file=>file.replace('.wav',''))));
execFileSync('xcrun',['swiftc','-parse-as-library','macos/Sources/GameAudio.swift','macos/Sources/Models.swift','macos/Tests/AudioAssetTests.swift','-framework','AppKit','-framework','AVFoundation','-o','macos/build/AudioAssetTests'],{stdio:'inherit',env:macToolchainEnvironment()});
execFileSync('macos/build/AudioAssetTests',[resources,'macos/build/web-sound-manifest.json'],{stdio:'inherit'});
