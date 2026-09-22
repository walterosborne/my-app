import assert from 'node:assert/strict';
import test from 'node:test';
import { getEnvironmentModeForHost, getDatabaseSchemaForHost } from '../environment-config.js';

const withEnv = (env, callback) => {
  const previous = { NGAT_ENV: process.env.NGAT_ENV, NODE_ENV: process.env.NODE_ENV, AUDIT_SCHEMA: process.env.AUDIT_SCHEMA };
  try {
    for (const [key, value] of Object.entries(env)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    callback();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
};

test('dev schema even with production hostname/NODE_ENV/AUDIT_SCHEMA', () => {
  withEnv({ NGAT_ENV: 'dev', NODE_ENV: 'production', AUDIT_SCHEMA: 'dbo' }, () => {
    assert.equal(getEnvironmentModeForHost('ngat.northgrum.com'), 'dev');
    assert.equal(getDatabaseSchemaForHost('ngat.northgrum.com'), 'dev');
  });
});
test('prod schema even on a development hostname', () => {
  withEnv({ NGAT_ENV: 'prod', NODE_ENV: 'development' }, () => {
    assert.equal(getEnvironmentModeForHost('ngat-temp-dev.ds.northgrum.com'), 'prod');
    assert.equal(getDatabaseSchemaForHost('ngat-temp-dev.ds.northgrum.com'), 'dbo');
  });
});
test('legacy staging is explicit', () => {
  withEnv({ NGAT_ENV: 'stg' }, () => assert.equal(getDatabaseSchemaForHost('anything'), 'stag'));
});
test('production mode without explicit NGAT_ENV fails closed', () => {
  withEnv({ NGAT_ENV: undefined, NODE_ENV: 'production' }, () => {
    assert.throws(() => getDatabaseSchemaForHost('ngat.northgrum.com'), /NGAT_ENV/);
  });
});
test('invalid mode fails closed instead of inferring from URL', () => {
  withEnv({ NGAT_ENV: 'pord', NODE_ENV: 'production' }, () => {
    assert.throws(() => getEnvironmentModeForHost('ngat.northgrum.com'), /NGAT_ENV/);
  });
});
test('local non-production defaults to dev', () => {
  withEnv({ NGAT_ENV: undefined, NODE_ENV: 'development' }, () => {
    assert.equal(getDatabaseSchemaForHost(), 'dev');
  });
});
