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
const azureProcessLookupEnv = 'VSTS_PROCESS_LOOKUP_ID';

const stopResult = spawnSync(process.execPath, [stopScriptPath], {
  cwd: appRoot,
  stdio: 'inherit',
  timeout: 15000
});

if (stopResult.error) {
  throw new Error(`Failed to stop the existing MSSQL backend: ${stopResult.error.message}`);
}

if (stopResult.status !== 0) {
  throw new Error(`Failed to stop the existing MSSQL backend. Exit code: ${stopResult.status}`);
}

const detachedEnv = { ...process.env };

// Azure Pipelines tracks and cleans up children with this env var; do not let
// the long-running backend inherit it.
delete detachedEnv[azureProcessLookupEnv];

const quotePowerShell = (value) => String(value).replace(/'/g, "''");
const quotePosix = (value) => `'${String(value).replace(/'/g, `'\\''`)}'`;

const startOnWindows = () => {
  const command = [
    `$ErrorActionPreference = 'Stop';`,
    `Remove-Item Env:${azureProcessLookupEnv} -ErrorAction SilentlyContinue;`,
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
    env: detachedEnv,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit']
  }).trim();

  return Number(pid);
};

const startOnPosix = () => {
  const command = [
    'env',
    '-u',
    azureProcessLookupEnv,
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
    env: detachedEnv,
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
