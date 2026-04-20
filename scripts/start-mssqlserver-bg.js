import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..');
const pidFile = path.join(appRoot, '.mssqlserver.pid');
const logFile = path.join(appRoot, 'mssqlserver.log');

const stopScriptPath = path.join(__dirname, 'stop-mssqlserver-bg.js');
spawnSync(process.execPath, [stopScriptPath], {
  cwd: appRoot,
  stdio: 'inherit'
});

const logFd = fs.openSync(logFile, 'a');
const child = spawn(process.execPath, ['mssqlserver.js'], {
  cwd: appRoot,
  detached: true,
  stdio: ['ignore', logFd, logFd],
  env: process.env
});

child.unref();
fs.closeSync(logFd);
fs.writeFileSync(pidFile, `${child.pid}\n`, 'utf8');

console.log(`Started mssqlserver.js in background (PID ${child.pid}).`);
console.log(`Logs: ${logFile}`);
