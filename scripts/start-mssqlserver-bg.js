import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..');
const pidFile = path.join(appRoot, '.mssqlserver.pid');
const logFile = path.join(appRoot, 'mssqlserver.log');
const errorLogFile = path.join(appRoot, 'mssqlserver.error.log');
const stopScriptPath = path.join(__dirname, 'stop-mssqlserver-bg.js');
const windowsTaskScript = path.join(appRoot, '.mssqlserver-task.ps1');
const windowsTaskName = 'NGAT_MSSQL_Backend';
const azureProcessLookupEnv = 'VSTS_PROCESS_LOOKUP_ID';
const backendEnvNames = [
  'auditserver',
  'auditdb',
  'server',
  'database',
  'user',
  'password',
  'NODE_ENV'
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

const quotePowerShellLiteral = (value) => {
  const normalized = String(value).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return `@'\n${normalized}\n'@`;
};

const startDetachedBackend = () => {
  const outFd = fs.openSync(logFile, 'a');
  const errFd = fs.openSync(errorLogFile, 'a');

  try {
    const child = spawn(process.execPath, ['mssqlserver.js'], {
      cwd: appRoot,
      detached: true,
      env: detachedEnv,
      stdio: ['ignore', outFd, errFd],
      windowsHide: true
    });

    child.unref();
    return child.pid;
  } finally {
    fs.closeSync(outFd);
    fs.closeSync(errFd);
  }
};

const getPastStartTime = () => {
  const date = new Date(Date.now() - 60_000);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const runWindowsCommand = (file, args) => {
  try {
    return execFileSync(file, args, {
      cwd: appRoot,
      env: detachedEnv,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 15000,
      windowsHide: true
    });
  } catch (error) {
    const stderr = error.stderr?.toString().trim();
    const stdout = error.stdout?.toString().trim();
    const details = [stderr, stdout].filter(Boolean).join('\n');
    throw new Error(`${file} failed${details ? `:\n${details}` : ''}`);
  }
};

const writeWindowsTaskScript = () => {
  const envLines = backendEnvNames
    .filter((name) => process.env[name] !== undefined)
    .map((name) => `$env:${name} = ${quotePowerShellLiteral(process.env[name])}`);

  const contents = [
    '$ErrorActionPreference = \'Stop\'',
    `Set-Location -LiteralPath ${quotePowerShellLiteral(appRoot)}`,
    `Remove-Item Env:${azureProcessLookupEnv} -ErrorAction SilentlyContinue`,
    ...envLines,
    `$nodePath = ${quotePowerShellLiteral(process.execPath)}`,
    `$serverPath = ${quotePowerShellLiteral(path.join(appRoot, 'mssqlserver.js'))}`,
    `$stdoutLog = ${quotePowerShellLiteral(logFile)}`,
    `$stderrLog = ${quotePowerShellLiteral(errorLogFile)}`,
    '"{0} Starting NGAT MSSQL backend from scheduled task." -f (Get-Date -Format o) | Out-File -FilePath $stdoutLog -Append',
    '& $nodePath $serverPath >> $stdoutLog 2>> $stderrLog'
  ].join('\r\n');

  fs.writeFileSync(windowsTaskScript, `${contents}\r\n`, 'utf8');
};

const getWindowsBackendPid = () => {
  const command = [
    '$process = Get-CimInstance Win32_Process -Filter "Name = \'node.exe\'"',
    '| Where-Object { $_.CommandLine -like \'*mssqlserver.js*\' }',
    '| Sort-Object CreationDate -Descending',
    '| Select-Object -First 1;',
    'if ($process) { [Console]::Out.Write($process.ProcessId) }'
  ].join(' ');

  try {
    const output = runWindowsCommand('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-Command',
      command
    ]).trim();
    const pid = Number(output);
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
};

const waitForWindowsBackendPid = async () => {
  const deadline = Date.now() + 10000;

  while (Date.now() < deadline) {
    const pid = getWindowsBackendPid();
    if (pid) return pid;
    await sleep(500);
  }

  return null;
};

const startWindowsScheduledTaskBackend = async () => {
  writeWindowsTaskScript();

  const taskCommand = `"${process.env.SystemRoot || 'C:\\Windows'}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File "${windowsTaskScript}"`;

  runWindowsCommand('schtasks.exe', [
    '/Create',
    '/TN', windowsTaskName,
    '/TR', taskCommand,
    '/SC', 'ONCE',
    '/ST', getPastStartTime(),
    '/F'
  ]);

  runWindowsCommand('schtasks.exe', ['/Run', '/TN', windowsTaskName]);

  return waitForWindowsBackendPid();
};

const pid = process.platform === 'win32'
  ? await startWindowsScheduledTaskBackend()
  : startDetachedBackend();

if (!Number.isInteger(pid) || pid <= 0) {
  throw new Error(`Failed to start mssqlserver.js in the background. Check ${logFile} and ${errorLogFile}.`);
}

fs.writeFileSync(pidFile, `${pid}\n`, 'utf8');

console.log(`Started mssqlserver.js in background (PID ${pid}).`);
console.log(`Stdout log: ${logFile}`);
console.log(`Stderr log: ${errorLogFile}`);
