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
const debugLogFile = path.join(appRoot, 'ngat-prod-debug.log');
const stopScriptPath = path.join(__dirname, 'stop-mssqlserver-bg.js');
const windowsTaskScript = path.join(appRoot, '.mssqlserver-task.ps1');
const windowsTaskName = 'NGAT_MSSQL_Backend';
const azureProcessLookupEnv = 'VSTS_PROCESS_LOOKUP_ID';
const backendPort = 3001;
const currentRunId = `${Date.now()}-${process.pid}`;
const verboseConsoleLogging = String(process.env.NGAT_VERBOSE_STARTUP_LOGS || '').toLowerCase() === 'true';
const useWindowsDirectDetached = String(process.env.NGAT_USE_WINDOWS_DIRECT_DETACHED || '').toLowerCase() === 'true';
const backendEnvNames = [
  'auditserver',
  'auditdb',
  'server',
  'database',
  'user',
  'password',
  'NODE_ENV'
];
const startedAt = Date.now();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const info = (message) => {
  console.log(`[NGAT START] ${message}`);
};
const warn = (message) => {
  console.warn(`[NGAT START] ${message}`);
};
const debug = (message) => {
  const line = `[NGAT START DEBUG ${new Date().toISOString()} pid=${process.pid} ppid=${process.ppid}] ${message}`;
  if (verboseConsoleLogging) {
    console.log(line);
  }
  fs.appendFileSync(debugLogFile, `${line}\n`, 'utf8');
};

const encodePowerShellString = (value) => Buffer.from(String(value), 'utf8').toString('base64');

const decodePowerShellString = (value) => (
  `[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${encodePowerShellString(value)}'))`
);

const logFileTail = (filePath, label) => {
  try {
    if (!fs.existsSync(filePath)) {
      debug(`${label} does not exist: ${filePath}`);
      warn(`${label} does not exist: ${filePath}`);
      return;
    }

    const contents = fs.readFileSync(filePath, 'utf8');
    const tail = contents.slice(-4000).trim();
    debug(`${label} tail from ${filePath}:${tail ? `\n${tail}` : ' <empty>'}`);
    info(`${label} tail from ${filePath}:${tail ? `\n${tail}` : ' <empty>'}`);
  } catch (error) {
    debug(`Failed to read ${label} from ${filePath}: ${error.message}`);
    warn(`Failed to read ${label} from ${filePath}: ${error.message}`);
  }
};

const resetBackendLogs = () => {
  const resetLine = `[NGAT START RUN ${currentRunId}] log reset ${new Date().toISOString()}\n`;
  debug(`Resetting backend logs for runId=${currentRunId}.`);
  fs.writeFileSync(logFile, resetLine, 'utf8');
  fs.writeFileSync(errorLogFile, resetLine, 'utf8');
};

const backendLogIndicatesServerStarted = () => {
  try {
    if (!fs.existsSync(logFile)) {
      return false;
    }

    const contents = fs.readFileSync(logFile, 'utf8');
    if (!contents.includes(`[NGAT START RUN ${currentRunId}]`)) {
      debug(`Stdout log does not contain current run marker ${currentRunId}.`);
      return false;
    }

    const startupPatterns = [
      new RegExp(`\\[NGAT MSSQL READY\\]\\s+host=\\S+\\s+port=${backendPort}\\b`),
      new RegExp(`Server running on http://[^\\s]+:${backendPort}\\b`),
      new RegExp(`Binding host/port = [^\\r\\n]+\\s${backendPort}\\b`)
    ];

    return startupPatterns.some((pattern) => pattern.test(contents));
  } catch (error) {
    debug(`Could not inspect backend stdout log for startup marker: ${error.message}`);
    return false;
  }
};

process.on('beforeExit', (code) => {
  debug(`PROCESS beforeExit code=${code} elapsedMs=${Date.now() - startedAt}`);
});

process.on('exit', (code) => {
  debug(`PROCESS exit code=${code} elapsedMs=${Date.now() - startedAt}`);
});

const stopExistingBackend = () => {
  debug(`Running stop helper: ${stopScriptPath}`);
  const stopResult = spawnSync(process.execPath, [stopScriptPath], {
    cwd: appRoot,
    stdio: 'inherit',
    timeout: 15000
  });
  debug(`Stop helper returned status=${stopResult.status} signal=${stopResult.signal ?? 'none'} error=${stopResult.error?.message ?? 'none'}`);

  if (stopResult.error) {
    throw new Error(`Failed to stop the existing MSSQL backend: ${stopResult.error.message}`);
  }

  if (stopResult.status !== 0) {
    throw new Error(`Failed to stop the existing MSSQL backend. Exit code: ${stopResult.status}`);
  }
};

const detachedEnv = { ...process.env };

// Azure Pipelines tracks and cleans up children with this env var; do not let
// the long-running backend inherit it.
delete detachedEnv[azureProcessLookupEnv];

const quotePowerShellLiteral = (value) => {
  const normalized = String(value).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return `@'\n${normalized}\n'@`;
};

const startDetachedBackend = () => {
  debug(`Detached spawn path selected for platform=${process.platform}.`);
  debug(`Opening log files stdout=${logFile} stderr=${errorLogFile}`);
  const outFd = fs.openSync(logFile, 'a');
  const errFd = fs.openSync(errorLogFile, 'a');

  try {
    debug(`Spawning ${process.execPath} mssqlserver.js with detached=true and file-only stdio.`);
    const child = spawn(process.execPath, ['mssqlserver.js'], {
      cwd: appRoot,
      detached: true,
      env: detachedEnv,
      stdio: ['ignore', outFd, errFd],
      windowsHide: true
    });

    child.unref();
    debug(`Detached child spawned pid=${child.pid}; child.unref() called.`);
    return child.pid;
  } finally {
    fs.closeSync(outFd);
    fs.closeSync(errFd);
    debug('Closed parent log file descriptors after spawn.');
  }
};

const getPastStartTime = () => {
  const date = new Date(Date.now() - 60_000);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const runWindowsCommand = (file, args) => {
  debug(`Windows command START: ${file} ${args.join(' ')}`);
  try {
    const output = execFileSync(file, args, {
      cwd: appRoot,
      env: detachedEnv,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 15000,
      windowsHide: true
    });
    debug(`Windows command END: ${file}; stdout=${JSON.stringify(output.trim())}`);
    return output;
  } catch (error) {
    const stderr = error.stderr?.toString().trim();
    const stdout = error.stdout?.toString().trim();
    const details = [stderr, stdout].filter(Boolean).join('\n');
    debug(`Windows command FAILED: ${file}; stderr=${JSON.stringify(stderr || '')}; stdout=${JSON.stringify(stdout || '')}; error=${error.message}`);
    throw new Error(`${file} failed${details ? `:\n${details}` : ''}`);
  }
};

const writeWindowsTaskScript = () => {
  debug(`Writing scheduled task launcher script: ${windowsTaskScript}`);
  const taskEnv = {
    ...detachedEnv,
    NODE_ENV: detachedEnv.NODE_ENV || 'production'
  };
  delete taskEnv[azureProcessLookupEnv];

  const envLines = Object.entries(taskEnv)
    .filter(([name, value]) => name && value !== undefined && value !== null)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => (
      `[Environment]::SetEnvironmentVariable(${decodePowerShellString(name)}, ${decodePowerShellString(value)}, 'Process')`
    ));

  const contents = [
    '$ErrorActionPreference = \'Stop\'',
    `Set-Location -LiteralPath ${quotePowerShellLiteral(appRoot)}`,
    `Remove-Item Env:${azureProcessLookupEnv} -ErrorAction SilentlyContinue`,
    ...envLines,
    `$nodePath = ${quotePowerShellLiteral(process.execPath)}`,
    `$serverPath = ${quotePowerShellLiteral(path.join(appRoot, 'mssqlserver.js'))}`,
    `$stdoutLog = ${quotePowerShellLiteral(logFile)}`,
    `$stderrLog = ${quotePowerShellLiteral(errorLogFile)}`,
    `'"{0} Starting NGAT MSSQL backend from scheduled task. runId=${currentRunId}" -f (Get-Date -Format o) | Out-File -FilePath $stdoutLog -Append`,
    '& $nodePath $serverPath >> $stdoutLog 2>> $stderrLog'
  ].join('\r\n');

  fs.writeFileSync(windowsTaskScript, `${contents}\r\n`, 'utf8');
  debug(`Scheduled task launcher written. envLines=${envLines.length}`);
  debug(`Scheduled task launcher copied backend env present=${backendEnvNames.map((name) => `${name}:${taskEnv[name] === undefined ? 'no' : 'yes'}`).join(', ')}`);
};

const logWindowsScheduledTaskState = () => {
  try {
    const output = runWindowsCommand('schtasks.exe', [
      '/Query',
      '/TN', windowsTaskName,
      '/V',
      '/FO', 'LIST'
    ]);
    debug(`Scheduled task query output:\n${output.trim()}`);
    info(`Scheduled task query output:\n${output.trim()}`);
  } catch (error) {
    debug(`Scheduled task query failed: ${error.message}`);
    warn(`Scheduled task query failed: ${error.message}`);
  }
};

const getWindowsListeningPidForPort = () => {
  debug(`Checking for Windows listening PID on port ${backendPort}.`);

  try {
    const output = runWindowsCommand('cmd.exe', [
      '/d',
      '/s',
      '/c',
      `netstat -ano | findstr :${backendPort}`
    ]);

    const pids = [...new Set(
      output
        .split(/\r?\n/)
        .filter((line) => /\bLISTENING\b/i.test(line))
        .map((line) => line.trim().split(/\s+/).pop())
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0)
    )];

    debug(`Windows netstat port ${backendPort} listening PIDs=${pids.length ? pids.join(', ') : 'none'}`);
    return pids[0] || null;
  } catch (error) {
    debug(`Windows netstat PID lookup failed or found no listeners: ${error.message}`);
    return null;
  }
};

const getWindowsBackendPid = () => {
  debug('Checking for Windows node.exe process whose command line contains mssqlserver.js.');
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
    debug(`Windows backend PID query output=${JSON.stringify(output)} parsed=${pid || 'none'}`);
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch (error) {
    debug(`Windows backend PID query failed but will retry/continue: ${error.message}`);
    return null;
  }
};

const isWindowsPidRunning = (pid) => {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }

  debug(`Checking whether Windows PID ${pid} is still running.`);

  try {
    const output = runWindowsCommand('cmd.exe', [
      '/d',
      '/s',
      '/c',
      `tasklist /FI "PID eq ${pid}" /FO CSV /NH`
    ]).trim();

    const isRunning = Boolean(output) && !/^INFO:/i.test(output);
    debug(`tasklist for PID ${pid} returned ${JSON.stringify(output)} running=${isRunning}`);
    return isRunning;
  } catch (error) {
    debug(`tasklist lookup for PID ${pid} failed: ${error.message}`);
    return false;
  }
};

const waitForWindowsBackendReady = async (initialPid = null) => {
  const deadline = Date.now() + 30000;
  let attempt = 0;
  let candidatePid = initialPid;

  while (Date.now() < deadline) {
    attempt += 1;
    debug(`Waiting for Windows backend readiness attempt=${attempt} candidatePid=${candidatePid ?? 'none'}`);

    const listeningPid = getWindowsListeningPidForPort();
    if (listeningPid) {
      debug(`Windows backend readiness confirmed by listening PID ${listeningPid}.`);
      return listeningPid;
    }

    if (backendLogIndicatesServerStarted()) {
      const resolvedPid = getWindowsBackendPid() || candidatePid;
      debug(`Windows backend readiness confirmed by stdout log marker. pid=${resolvedPid ?? 'unavailable'}`);
      return resolvedPid ?? initialPid ?? null;
    }

    const discoveredPid = getWindowsBackendPid();
    if (discoveredPid) {
      candidatePid = discoveredPid;
    }

    if (candidatePid && !isWindowsPidRunning(candidatePid) && attempt >= 3) {
      debug(`Candidate PID ${candidatePid} is no longer running before readiness confirmation.`);
      return null;
    }

    await sleep(500);
  }

  debug('Windows backend readiness was not confirmed before the 30s deadline.');
  return null;
};

const waitForWindowsBackendPid = async () => {
  return waitForWindowsBackendReady(null);
};

const startWindowsScheduledTaskBackend = async () => {
  debug('Windows scheduled task path selected.');
  info(`Starting MSSQL backend scheduled task. runId=${currentRunId}`);
  writeWindowsTaskScript();

  const taskCommand = `"${process.env.SystemRoot || 'C:\\Windows'}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File "${windowsTaskScript}"`;
  debug(`Task name=${windowsTaskName}`);
  debug(`Task command=${taskCommand}`);

  runWindowsCommand('schtasks.exe', [
    '/Create',
    '/TN', windowsTaskName,
    '/TR', taskCommand,
    '/SC', 'ONCE',
    '/ST', getPastStartTime(),
    '/F'
  ]);

  runWindowsCommand('schtasks.exe', ['/Run', '/TN', windowsTaskName]);
  debug('Scheduled task run command returned. Now waiting for backend PID.');

  const pid = await waitForWindowsBackendPid();
  if (!pid) {
    warn(`Backend PID was not detected within 30 seconds for runId=${currentRunId}. Dumping diagnostics.`);
    logWindowsScheduledTaskState();
    logFileTail(logFile, 'mssqlserver stdout log');
    logFileTail(errorLogFile, 'mssqlserver stderr log');
  }

  return pid;
};

const startWindowsDetachedBackend = async () => {
  debug('Windows detached backend path selected.');
  info(`Starting MSSQL backend via detached node process. runId=${currentRunId}`);
  const spawnedPid = startDetachedBackend();
  debug(`Detached Windows child spawn returned pid=${spawnedPid ?? 'none'}`);

  const pid = await waitForWindowsBackendReady(spawnedPid || null);
  if (!pid) {
    warn(`Detached Windows backend did not confirm readiness within 30 seconds for runId=${currentRunId}. Dumping diagnostics.`);
    logFileTail(logFile, 'mssqlserver stdout log');
    logFileTail(errorLogFile, 'mssqlserver stderr log');
  }

  return pid;
};

const startBackend = async () => {
  if (process.platform !== 'win32') {
    return startDetachedBackend();
  }

  if (useWindowsDirectDetached) {
    info(`Using Windows detached startup path because NGAT_USE_WINDOWS_DIRECT_DETACHED=${process.env.NGAT_USE_WINDOWS_DIRECT_DETACHED}.`);
    return startWindowsDetachedBackend();
  }

  info('Using Windows scheduled task startup path by default. Set NGAT_USE_WINDOWS_DIRECT_DETACHED=true to use direct detached startup.');
  return startWindowsScheduledTaskBackend();
};

const main = async () => {
  debug('start-mssqlserver-bg.js entered.');
  debug(`platform=${process.platform} node=${process.version} cwd=${process.cwd()} appRoot=${appRoot}`);
  debug(`VSTS_PROCESS_LOOKUP_ID present=${process.env[azureProcessLookupEnv] ? 'yes' : 'no'}`);
  debug(`backend env present=${backendEnvNames.map((name) => `${name}:${process.env[name] === undefined ? 'no' : 'yes'}`).join(', ')}`);
  debug(`Detached env VSTS_PROCESS_LOOKUP_ID present=${detachedEnv[azureProcessLookupEnv] ? 'yes' : 'no'}`);

  stopExistingBackend();
  resetBackendLogs();

  const pid = await startBackend();

  if (!Number.isInteger(pid) || pid <= 0) {
    if (process.platform === 'win32' && backendLogIndicatesServerStarted()) {
      debug('Backend PID was not detected, but stdout log confirms the server started. Treating startup as successful.');
      console.log('Started mssqlserver.js in background (PID unavailable; verified by stdout log).');
      console.log(`Stdout log: ${logFile}`);
      console.log(`Stderr log: ${errorLogFile}`);
      debug('start-mssqlserver-bg.js reached final line before explicit process.exit(0).');
      process.exit(0);
    }

    warn(`Failed to confirm backend startup for runId=${currentRunId}.`);
    info(`Stdout log path: ${logFile}`);
    info(`Stderr log path: ${errorLogFile}`);
    throw new Error(`Failed to start mssqlserver.js in the background. Check ${logFile} and ${errorLogFile}.`);
  }

  fs.writeFileSync(pidFile, `${pid}\n`, 'utf8');
  debug(`PID file written: ${pidFile}`);

  console.log(`Started mssqlserver.js in background (PID ${pid}).`);
  console.log(`Stdout log: ${logFile}`);
  console.log(`Stderr log: ${errorLogFile}`);
  debug('start-mssqlserver-bg.js reached final line before explicit process.exit(0).');
  process.exit(0);
};

try {
  await main();
} catch (error) {
  warn(`Launcher failed for runId=${currentRunId}: ${error.message}`);
  logFileTail(logFile, 'mssqlserver stdout log');
  logFileTail(errorLogFile, 'mssqlserver stderr log');
  logFileTail(debugLogFile, 'ngat startup debug log');
  console.error(error.stack || error.message);
  process.exit(1);
}
