import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { macToolchainEnvironment } from './mac_toolchain.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const build = path.join(root, 'macos/build');
const preview = process.argv.includes('--preview');
const appName = preview ? 'Naval War Preview' : 'Naval War';
const archiveName = `${appName}-development.zip`;
const app = path.join(build, `${appName}.app`);
const archive = path.join(build, archiveName);
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'naval-war-package-'));
const env = macToolchainEnvironment();
const run = (command, args) => execFileSync(command, args, { cwd: root, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
try {
  run('codesign', ['--verify', '--deep', '--strict', app]);
  const architectures = run('lipo', ['-archs', path.join(app, 'Contents/MacOS/NavalWar')]);
  run('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', app, path.join(temporary, archiveName)]);
  const extracted = path.join(temporary, 'extracted');
  run('ditto', ['-x', '-k', path.join(temporary, archiveName), extracted]);
  run('codesign', ['--verify', '--deep', '--strict', path.join(extracted, `${appName}.app`)]);
  const binary = `${appName}.app/Contents/MacOS/NavalWar`;
  const digest = data => createHash('sha256').update(data).digest('hex');
  if (digest(await fs.readFile(path.join(build, binary))) !== digest(await fs.readFile(path.join(extracted, binary)))) {
    throw new Error('Extracted application does not match the built application.');
  }
  await fs.copyFile(path.join(temporary, archiveName), archive);
  const data = await fs.readFile(archive);
  const report = { archive: path.basename(archive), bytes: data.length, sha256: digest(data), architectures,
    minimumMacOS: '14.0', signature: 'local ad hoc development signature', notarized: false,
    extractionSignatureVerified: true, extractedExecutableMatches: true, timestamp: new Date().toISOString() };
  await fs.writeFile(path.join(build, preview ? 'preview-package-verification.json' : 'package-verification.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`Packaged ${archive} (${(data.length / 1048576).toFixed(1)} MB; ${architectures}).`);
  console.log('Extracted app signature and executable verified. Development build; not notarized for public distribution.');
} finally { await fs.rm(temporary, { recursive: true, force: true }); }
