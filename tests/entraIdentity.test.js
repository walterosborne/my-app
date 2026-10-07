import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildIdentityCandidates, getEntraIdentity, IdentityError
} from '../entraIdentity.js';

const profile = {
  id: 'object-123', displayName: 'Auditor Name',
  onPremisesSamAccountName: 'N12345', employeeId: '12345',
  mail: 'auditor@ngc.com', userPrincipalName: 'auditor@ngc.com'
};
const request = token => ({
  get: name => name === 'X-Forwarded-Access-Token' ? token : null
});
const withEnv = async (values, run) => {
  const names = ['NODE_ENV', 'NGAT_ENV', 'NGAT_DEV_EMPLOYEE_ID'];
  const prior = Object.fromEntries(names.map(name => [name, process.env[name]]));
  try {
    for (const name of names) {
      if (values[name] === undefined) delete process.env[name];
      else process.env[name] = values[name];
    }
    await run();
  } finally {
    for (const name of names) {
      if (prior[name] === undefined) delete process.env[name];
      else process.env[name] = prior[name];
    }
  }
};

test('without a token or fallback, authentication fails closed', async () => {
  await withEnv({NODE_ENV:'development', NGAT_ENV:'dev'}, async () => {
    await assert.rejects(getEntraIdentity(request(null)),
      error => error instanceof IdentityError && error.status === 401);
  });
});

test('Graph profile prioritizes roster identifiers', () => {
  const candidates = buildIdentityCandidates(profile);
  assert.deepEqual(candidates.slice(0,2), [
    {column:'networkid',value:'N12345'},
    {column:'myid',value:'12345'}
  ]);
  assert(candidates.some(candidate => candidate.column === 'email' && candidate.value === 'auditor@ngc.com'));
});

test('valid Graph result wins over configured local employee ID', async () => {
  await withEnv({NODE_ENV:'development',NGAT_ENV:'dev',NGAT_DEV_EMPLOYEE_ID:'D4567'}, async () => {
    const identity = await getEntraIdentity(request('fake-token-A'), {
      fetchImpl: async (url, options) => {
        assert(url.startsWith('https://graph.microsoft.us/'));
        assert.equal(options.headers.Authorization, 'Bearer fake-token-A');
        return {ok:true,status:200,json:async()=>profile};
      }
    });
    assert.equal(identity.source,'entra-graph');
    assert(!JSON.stringify(identity).includes('fake-token-A'));
  });
});

test('missing Entra token falls back only to local employee MyID', async () => {
  await withEnv({NODE_ENV:'development',NGAT_ENV:'dev',NGAT_DEV_EMPLOYEE_ID:'D4567'}, async () => {
    const identity = await getEntraIdentity(request(null));
    assert.equal(identity.source, 'local-dev-employee-id');
    assert.deepEqual(identity.candidates, [{column:'myid',value:'D4567'}]);
  });
});

test('Graph rejection falls back to local employee MyID', async () => {
  await withEnv({NODE_ENV:'development',NGAT_ENV:'dev',NGAT_DEV_EMPLOYEE_ID:'D4567'}, async () => {
    const identity = await getEntraIdentity(request('fake-token-B'), {
      fetchImpl: async()=>({ok:false,status:401})
    });
    assert.equal(identity.source,'local-dev-employee-id');
    assert.deepEqual(identity.candidates, [{column:'myid',value:'D4567'}]);
  });
});

test('production NODE_ENV forbids fallback even if employee ID is accidentally supplied', async () => {
  await withEnv({NODE_ENV:'production',NGAT_ENV:'dev',NGAT_DEV_EMPLOYEE_ID:'D4567'}, async () => {
    await assert.rejects(getEntraIdentity(request(null)),error=>error.status===401);
    await assert.rejects(getEntraIdentity(request('fake-token-C'),{
      fetchImpl:async()=>({ok:false,status:401})
    }),error=>error.status===401);
  });
});

test('non-dev NGAT_ENV forbids fallback', async () => {
  await withEnv({NODE_ENV:'development',NGAT_ENV:'prod',NGAT_DEV_EMPLOYEE_ID:'D4567'}, async () => {
    await assert.rejects(getEntraIdentity(request(null)),error=>error.status===401);
  });
});

test('missing employee ID forbids fallback on Graph rejection', async () => {
  await withEnv({NODE_ENV:'development',NGAT_ENV:'dev'}, async () => {
    await assert.rejects(getEntraIdentity(request('fake-token-D'),{
      fetchImpl:async()=>({ok:false,status:401})
    }),error=>error.status===401);
  });
});
