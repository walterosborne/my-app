// NGAT identity: require delegated Graph User.Read, not client-supplied identity headers.
import { createHash } from 'node:crypto';

const GRAPH_URL = 'https://graph.microsoft.us/v1.0/me?$select=id,displayName,mail,userPrincipalName,employeeId,onPremisesSamAccountName';
const requestCache = new WeakMap();
const tokenCache = new Map();
const MAX_ENTRIES = 500;
const CACHE_TTL_MS = 45000;

export class IdentityError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.name = 'IdentityError';
    this.status = status;
  }
}

export function getForwardedAccessToken(req) {
  const value = String(req.get?.('X-Forwarded-Access-Token')
    || req.get?.('X-Auth-Request-Access-Token')
    || req.headers?.['x-forwarded-access-token']
    || req.headers?.['x-auth-request-access-token']
    || '').trim();
  return value.replace(/^Bearer\s+/i, '');
}

const clean = (value) => String(value ?? '').trim();
const networkId = (value) => clean(value).split('\\').pop().split('@')[0];
export function buildIdentityCandidates(profile = {}) {
  const candidates = [];
  const seen = new Set();
  const add = (column, source) => {
    const value = column === 'networkid' ? networkId(source) : clean(source);
    const key = column + ':' + value.toLowerCase();
    if (!value || seen.has(key)) return;
    seen.add(key);
    candidates.push({ column, value });
  };
  add('networkid', profile.onPremisesSamAccountName);
  add('myid', profile.employeeId);
  add('networkid', profile.employeeId);
  add('myid', profile.onPremisesSamAccountName);
  add('email', profile.mail);
  add('email', profile.userPrincipalName);
  add('networkid', profile.userPrincipalName);
  return candidates;
}

export async function getEntraIdentity(req, { fetchImpl = fetch } = {}) {
  if (requestCache.has(req)) return requestCache.get(req);
  const promise = (async () => {
    const token = getForwardedAccessToken(req);
    if (!token) {
      if (process.env.NODE_ENV !== 'production'
          && process.env.ALLOW_HARDCODED_IDENTITY_FALLBACK === 'true'
          && process.env.NGAT_DEV_NETWORK_ID) {
        return { source: 'local-dev', candidates: [
          { column: 'networkid', value: process.env.NGAT_DEV_NETWORK_ID }
        ] };
      }
      throw new IdentityError('Sign-in is required; no Entra access token was forwarded.', 401);
    }
    const key = createHash('sha256').update(token).digest('hex');
    const cached = tokenCache.get(key);
    if (cached && cached.expires > Date.now()) return cached.identity;

    let response;
    try {
      response = await fetchImpl(GRAPH_URL, {
        redirect: 'error',
        signal: AbortSignal.timeout(10000),
        headers: { Authorization: 'Bearer ' + token }
      });
    } catch {
      throw new IdentityError('Microsoft Graph is temporarily unavailable.', 502);
    }
    if (response.status === 401) throw new IdentityError('Your sign-in session has expired.', 401);
    if (!response.ok) throw new IdentityError('Microsoft Graph could not validate your identity.', 502);

    const profile = await response.json().catch(() => ({}));
    const identity = {
      source: 'entra-graph',
      entraObjectId: clean(profile.id),
      displayName: clean(profile.displayName),
      email: clean(profile.mail || profile.userPrincipalName),
      candidates: buildIdentityCandidates(profile)
    };
    if (!identity.entraObjectId || !identity.candidates.length) {
      throw new IdentityError('Entra profile has no usable roster identifier.', 403);
    }
    if (tokenCache.size >= MAX_ENTRIES) tokenCache.delete(tokenCache.keys().next().value);
    tokenCache.set(key, { identity, expires: Date.now() + CACHE_TTL_MS });
    return identity;
  })();
  requestCache.set(req, promise);
  try { return await promise; } catch (error) { requestCache.delete(req); throw error; }
}
