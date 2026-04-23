import { spawnSync } from 'node:child_process';

const startedAt = Date.now();

const timestamp = () => new Date().toISOString();

const log = (message) => {
  console.log(`[NGAT PROD DEBUG ${timestamp()} pid=${process.pid} ppid=${process.ppid}] ${message}`);
};

const runStep = (name, command, args) => {
  log(`STEP START: ${name}`);
  log(`COMMAND: ${command} ${args.join(' ')}`);

  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    windowsHide: true
  });

  log(`STEP END: ${name}`);
  log(`RESULT: status=${result.status} signal=${result.signal ?? 'none'} error=${result.error?.message ?? 'none'}`);

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    throw new Error(`${name} failed with exit code ${process.exitCode}`);
  }
};

process.on('beforeExit', (code) => {
  log(`PROCESS beforeExit code=${code} elapsedMs=${Date.now() - startedAt}`);
});

process.on('exit', (code) => {
  log(`PROCESS exit code=${code} elapsedMs=${Date.now() - startedAt}`);
});

try {
  log('npm run prod debug wrapper entered.');
  log(`platform=${process.platform} node=${process.version} cwd=${process.cwd()}`);
  log(`VSTS_PROCESS_LOOKUP_ID present=${process.env.VSTS_PROCESS_LOOKUP_ID ? 'yes' : 'no'}`);
  log(`SystemRoot=${process.env.SystemRoot || 'unset'}`);

  runStep('clean dist', 'npm', ['run', 'clean']);
  runStep('vite production build', 'npm', ['run', 'build']);
  runStep('start MSSQL backend', 'npm', ['run', 'start:mssqlserver:bg']);

  log('All prod steps completed. Forcing explicit successful process exit now.');
  process.exit(0);
} catch (error) {
  log(`FATAL: ${error.stack || error.message}`);
  process.exit(process.exitCode || 1);
}
