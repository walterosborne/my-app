import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..');
const pidFile = path.join(appRoot, '.mssqlserver.pid');
const BACKEND_PORT = 3001;
const WINDOWS_TASK_NAME = 'NGAT_MSSQL_Backend';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const killPid = (pid) => {
  if (!pid || Number.isNaN(Number(pid))) {
    return false;
  }

  const normalizedPid = Number(pid);

  try {
    process.kill(normalizedPid, 'SIGTERM');
    return true;
  } catch (error) {
    if (error.code !== 'ESRCH') {
      console.warn(`Failed to stop PID ${normalizedPid}: ${error.message}`);
    }
    return false;
  }
};

const getListeningPidsForPort = (port) => {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`cmd /c netstat -ano | findstr :${port}`, {
        cwd: appRoot,
        stdio: ['ignore', 'pipe', 'ignore']
      }).toString();

      return [...new Set(
        output
          .split(/\r?\n/)
          .filter((line) => /\bLISTENING\b/i.test(line))
          .map((line) => line.trim().split(/\s+/).pop())
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0)
      )];
    }

    const output = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, {
      cwd: appRoot,
      stdio: ['ignore', 'pipe', 'ignore']
    }).toString();

    return [...new Set(
      output
        .split(/\r?\n/)
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isInteger(value) && value > 0)
    )];
  } catch {
    return [];
  }
};

const endWindowsScheduledTask = () => {
  if (process.platform !== 'win32') {
    return false;
  }

  try {
    execFileSync('schtasks.exe', ['/End', '/TN', WINDOWS_TASK_NAME], {
      cwd: appRoot,
      stdio: ['ignore', 'ignore', 'ignore'],
      timeout: 15000,
      windowsHide: true
    });
    return true;
  } catch {
    return false;
  }
};

const stopServer = async () => {
  const endedScheduledTask = endWindowsScheduledTask();
  if (endedScheduledTask) {
    await sleep(500);
  }

  const pids = new Set();

  if (fs.existsSync(pidFile)) {
    const storedPid = Number(fs.readFileSync(pidFile, 'utf8').trim());
    if (Number.isInteger(storedPid) && storedPid > 0) {
      pids.add(storedPid);
    }
  }

  getListeningPidsForPort(BACKEND_PORT).forEach((pid) => pids.add(pid));

  if (pids.size === 0) {
    if (fs.existsSync(pidFile)) {
      fs.rmSync(pidFile, { force: true });
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
        execSync(`taskkill /PID ${pid} /T /F`, {
          cwd: appRoot,
          stdio: ['ignore', 'ignore', 'ignore']
        });
        stoppedAny = true;
      } catch {
        // Ignore if already stopped.
      }
    }
  }

  if (fs.existsSync(pidFile)) {
    fs.rmSync(pidFile, { force: true });
  }

  console.log(stoppedAny ? 'Stopped existing MSSQL backend.' : 'No running MSSQL backend found.');
};

await stopServer();
