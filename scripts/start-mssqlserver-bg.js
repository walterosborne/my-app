import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
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

const pid = startDetachedBackend();

if (!Number.isInteger(pid) || pid <= 0) {
  throw new Error('Failed to start mssqlserver.js in the background.');
}

fs.writeFileSync(pidFile, `${pid}\n`, 'utf8');

console.log(`Started mssqlserver.js in background (PID ${pid}).`);
console.log(`Stdout log: ${logFile}`);
console.log(`Stderr log: ${errorLogFile}`);
