import { spawnSync } from 'node:child_process';
export function macToolchainEnvironment() {
    const current = spawnSync('xcrun', ['swift', '--version'], { env: process.env, encoding: 'utf8' });
    if (current.status === 0) return process.env;
    const commandLine = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' };
    const alternative = spawnSync('xcrun', ['swift', '--version'], { env: commandLine, encoding: 'utf8' });
    if (alternative.status === 0) {
        console.log('Using the installed Apple Command Line Tools for this build.');
        return commandLine;
    }
    throw new Error(current.stderr || alternative.stderr || 'Apple Swift toolchain is unavailable.');
}
