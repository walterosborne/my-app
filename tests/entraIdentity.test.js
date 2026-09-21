import assert from 'node:assert/strict';
import test from 'node:test';
import { buildIdentityCandidates, getEntraIdentity, IdentityError } from '../entraIdentity.js';
const profile = { id:'object-123', displayName:'Auditor Name', onPremisesSamAccountName:'N12345',
  employeeId:'12345', mail:'auditor@ngc.com', userPrincipalName:'auditor@ngc.com' };
const request = token => ({get: name => name === 'X-Forwarded-Access-Token' ? token : null});
test('fails closed without delegated token', async () => {
  await assert.rejects(getEntraIdentity(request(null)), err => err instanceof IdentityError && err.status === 401);
});
test('prioritizes roster identifiers and exact Graph email', () => {
  const c = buildIdentityCandidates(profile);
  assert.deepEqual(c.slice(0,2), [{column:'networkid',value:'N12345'},{column:'myid',value:'12345'}]);
  assert(c.some(v => v.column === 'email' && v.value === 'auditor@ngc.com'));
});
test('Graph US Gov validation never returns access token', async () => {
  const identity = await getEntraIdentity(request('fake-token-A'), {fetchImpl: async (url,options) => {
    assert(url.startsWith('https://graph.microsoft.us/'));
    assert.equal(options.headers.Authorization,'Bearer fake-token-A');
    return {ok:true,status:200,json:async()=>profile};
  }});
  assert.equal(identity.source,'entra-graph');
  assert(!JSON.stringify(identity).includes('fake-token-A'));
});
test('Graph 401 denies authentication', async () => {
  await assert.rejects(getEntraIdentity(request('fake-token-B'), {
    fetchImpl: async()=>({ok:false,status:401})
  }), err=>err.status===401);
});
