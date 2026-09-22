import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { loadRuntimeEnv } from '../runtime-env.js';

const trackedKeys = ['NODE_ENV', 'NGAT_ENV', 'NGAT_DEV_EMPLOYEE_ID', 'auditdb'];
const snapshot = () => Object.fromEntries(trackedKeys.map(key => [key, process.env[key]]));
const restore = previous => {
  for (const key of trackedKeys) {
    if (previous[key] === undefined) delete process.env[key];
    else process.env[key] = previous[key];
  }
};

test('local .env overrides inherited OS env, .env.local and mode-specific files', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ngat-env-test-'));
  const previous = snapshot();
  try {
    process.env.NODE_ENV = 'production'; // inherited Windows setting
    process.env.NGAT_ENV = 'prod';
    process.env.NGAT_DEV_EMPLOYEE_ID = 'WRONG_ID';
    process.env.auditdb = 'WRONG_DB';
    fs.writeFileSync(path.join(dir, '.env.local'), 'NGAT_ENV=stg\\n');
    fs.writeFileSync(path.join(dir, '.env.development'), 'NGAT_ENV=stg\\n');
    fs.writeFileSync(path.join(dir, '.env'), [
      'NODE_ENV=development',
      'NGAT_ENV=dev',
      'NGAT_DEV_EMPLOYEE_ID=LOCAL_ID',
      'auditdb=LOCAL_DB'
    ].join('\\n'));
    const result = loadRuntimeEnv({
      appRoot: dir, mode: 'development', overrideProcessEnv: true, envFileLast: true
    });
    assert(result.loadedFiles.includes('.env'));
    assert.equal(process.env.NODE_ENV, 'development');
    assert.equal(process.env.NGAT_ENV, 'dev');
    assert.equal(process.env.NGAT_DEV_EMPLOYEE_ID, 'LOCAL_ID');
    assert.equal(process.env.auditdb, 'LOCAL_DB');
  } finally {
    restore(previous);
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('Kubernetes mode never reads .env or overwrites Deployment vars', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ngat-kube-env-test-'));
  const previous = snapshot();
  try {
    fs.writeFileSync(path.join(dir, '.env'), 'NODE_ENV=development\\nNGAT_ENV=dev\\nNGAT_DEV_EMPLOYEE_ID=WRONG\\n');
    process.env.NODE_ENV = 'production';
    process.env.NGAT_ENV = 'prod';
    delete process.env.NGAT_DEV_EMPLOYEE_ID;
    const result = loadRuntimeEnv({
      appRoot: dir, mode: 'production', loadFiles: false
    });
    assert.deepEqual(result.loadedFiles, []);
    assert.equal(process.env.NODE_ENV, 'production');
    assert.equal(process.env.NGAT_ENV, 'prod');
    assert.equal(process.env.NGAT_DEV_EMPLOYEE_ID, undefined);
  } finally {
    restore(previous);
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
