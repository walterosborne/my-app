import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..');
const pidFile = path.join(appRoot, '.mssqlserver.pid');
const debugLogFile = path.join(appRoot, 'ngat-prod-debug.log');
const BACKEND_PORT = 3001;
const WINDOWS_TASK_NAME = 'NGAT_MSSQL_Backend';
const verboseConsoleLogging = String(process.env.NGAT_VERBOSE_STARTUP_LOGS || '').toLowerCase() === 'true';

const startedAt = Date.now();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const debug = (message) => {
  const line = `[NGAT STOP DEBUG ${new Date().toISOString()} pid=${process.pid} ppid=${process.ppid}] ${message}`;
  if (verboseConsoleLogging) {
    console.log(line);
  }
  fs.appendFileSync(debugLogFile, `${line}\n`, 'utf8');
};

process.on('beforeExit', (code) => {
  debug(`PROCESS beforeExit code=${code} elapsedMs=${Date.now() - startedAt}`);
});

process.on('exit', (code) => {
  debug(`PROCESS exit code=${code} elapsedMs=${Date.now() - startedAt}`);
});

debug('stop-mssqlserver-bg.js entered.');
debug(`platform=${process.platform} node=${process.version} cwd=${process.cwd()} appRoot=${appRoot}`);

const killPid = (pid) => {
  if (!pid || Number.isNaN(Number(pid))) {
    return false;
  }

  const normalizedPid = Number(pid);
  debug(`Attempting SIGTERM for PID ${normalizedPid}`);

  try {
    process.kill(normalizedPid, 'SIGTERM');
    debug(`SIGTERM sent to PID ${normalizedPid}`);
    return true;
  } catch (error) {
    if (error.code !== 'ESRCH') {
      console.warn(`Failed to stop PID ${normalizedPid}: ${error.message}`);
    }
    return false;
  }
};

const getListeningPidsForPort = (port) => {
  debug(`Looking for listening PIDs on port ${port}.`);
  try {
    if (process.platform === 'win32') {
      const output = execSync(`cmd /c netstat -ano | findstr :${port}`, {
        cwd: appRoot,
        stdio: ['ignore', 'pipe', 'ignore']
      }).toString();

      const pids = [...new Set(
        output
          .split(/\r?\n/)
          .filter((line) => /\bLISTENING\b/i.test(line))
          .map((line) => line.trim().split(/\s+/).pop())
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0)
      )];
      debug(`Windows netstat found PIDs: ${pids.length ? pids.join(', ') : 'none'}`);
      return pids;
    }

    const output = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, {
      cwd: appRoot,
      stdio: ['ignore', 'pipe', 'ignore']
    }).toString();

    const pids = [...new Set(
      output
        .split(/\r?\n/)
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isInteger(value) && value > 0)
    )];
    debug(`lsof found PIDs: ${pids.length ? pids.join(', ') : 'none'}`);
    return pids;
  } catch (error) {
    debug(`Port lookup found no PIDs or failed: ${error.message}`);
    return [];
  }
};

const endWindowsScheduledTask = () => {
  if (process.platform !== 'win32') {
    debug('Not Windows; skipping scheduled task end.');
    return false;
  }

  try {
    debug(`Ending Windows scheduled task ${WINDOWS_TASK_NAME}.`);
    execFileSync('schtasks.exe', ['/End', '/TN', WINDOWS_TASK_NAME], {
      cwd: appRoot,
      stdio: ['ignore', 'ignore', 'ignore'],
      timeout: 15000,
      windowsHide: true
    });
    debug(`schtasks /End returned success for ${WINDOWS_TASK_NAME}.`);
    return true;
  } catch (error) {
    debug(`schtasks /End did not end task: ${error.message}`);
    return false;
  }
};

const stopServer = async () => {
  debug('stopServer starting.');
  const endedScheduledTask = endWindowsScheduledTask();
  if (endedScheduledTask) {
    await sleep(500);
  }

  const pids = new Set();

  if (fs.existsSync(pidFile)) {
    debug(`PID file exists: ${pidFile}`);
    const storedPid = Number(fs.readFileSync(pidFile, 'utf8').trim());
    if (Number.isInteger(storedPid) && storedPid > 0) {
      pids.add(storedPid);
      debug(`PID file added stored PID ${storedPid}.`);
    }
  } else {
    debug(`PID file does not exist: ${pidFile}`);
  }

  getListeningPidsForPort(BACKEND_PORT).forEach((pid) => pids.add(pid));
  debug(`Total candidate PIDs to stop: ${pids.size ? [...pids].join(', ') : 'none'}`);

  if (pids.size === 0) {
    if (fs.existsSync(pidFile)) {
      fs.rmSync(pidFile, { force: true });
      debug(`Removed stale PID file: ${pidFile}`);
    }
    console.log(endedScheduledTask ? 'Stopped existing MSSQL backend.' : 'No running MSSQL backend found.');
    return;
  }

  let stoppedAny = endedScheduledTask;
  for (const pid of pids) {
    if (pid === process.pid) continue;
    stoppedAny = killPid(pid) || stoppedAny;
  }

  await sleep(300);

  const remainingPids = getListeningPidsForPort(BACKEND_PORT).filter((pid) => pid !== process.pid);
  if (remainingPids.length > 0 && process.platform === 'win32') {
    for (const pid of remainingPids) {
      try {
        debug(`Force killing remaining Windows PID ${pid}.`);
        execSync(`taskkill /PID ${pid} /T /F`, {
          cwd: appRoot,
          stdio: ['ignore', 'ignore', 'ignore']
        });
        stoppedAny = true;
      } catch (error) {
        debug(`taskkill failed or PID already stopped: ${error.message}`);
      }
    }
  }

  if (fs.existsSync(pidFile)) {
    fs.rmSync(pidFile, { force: true });
    debug(`Removed PID file: ${pidFile}`);
  }

  console.log(stoppedAny ? 'Stopped existing MSSQL backend.' : 'No running MSSQL backend found.');
  debug('stopServer finished.');
};

await stopServer();
debug('stop-mssqlserver-bg.js reached final line before explicit process.exit(0).');
process.exit(0);
