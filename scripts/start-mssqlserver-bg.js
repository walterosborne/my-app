import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..');
const pidFile = path.join(appRoot, '.mssqlserver.pid');
const logFile = path.join(appRoot, 'mssqlserver.log');
const errorLogFile = path.join(appRoot, 'mssqlserver.error.log');
const stopScriptPath = path.join(__dirname, 'stop-mssqlserver-bg.js');

spawnSync(process.execPath, [stopScriptPath], {
  cwd: appRoot,
  stdio: 'inherit'
});

const quotePowerShell = (value) => String(value).replace(/'/g, "''");
const quotePosix = (value) => `'${String(value).replace(/'/g, `'\\''`)}'`;

const startOnWindows = () => {
  const command = [
    `$proc = Start-Process -FilePath '${quotePowerShell(process.execPath)}'`,
    `-ArgumentList 'mssqlserver.js'`,
    `-WorkingDirectory '${quotePowerShell(appRoot)}'`,
    `-RedirectStandardOutput '${quotePowerShell(logFile)}'`,
    `-RedirectStandardError '${quotePowerShell(errorLogFile)}'`,
    `-WindowStyle Hidden`,
    `-PassThru;`,
    `[Console]::Out.Write($proc.Id)`
  ].join(' ');

  const pid = execFileSync('powershell.exe', [
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-Command',
    command
  ], {
    cwd: appRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit']
  }).trim();

  return Number(pid);
};

const startOnPosix = () => {
  const command = [
    'nohup',
    quotePosix(process.execPath),
    quotePosix(path.join(appRoot, 'mssqlserver.js')),
    '>>',
    quotePosix(logFile),
    '2>>',
    quotePosix(errorLogFile),
    '< /dev/null & echo $!'
  ].join(' ');

  const pid = execFileSync('sh', ['-c', command], {
    cwd: appRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit']
  }).trim();

  return Number(pid);
};

const pid = process.platform === 'win32'
  ? startOnWindows()
  : startOnPosix();

if (!Number.isInteger(pid) || pid <= 0) {
  throw new Error('Failed to start mssqlserver.js in the background.');
}

fs.writeFileSync(pidFile, `${pid}\n`, 'utf8');

console.log(`Started mssqlserver.js in background (PID ${pid}).`);
console.log(`Stdout log: ${logFile}`);
console.log(`Stderr log: ${errorLogFile}`);
