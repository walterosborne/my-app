const IIS_AUTH_ENDPOINT = '/iis-auth.aspx';
const CLIENT_AUTH_USER_HEADER = 'X-Client-Auth-User';
const CLIENT_AUTH_TYPE_HEADER = 'X-Client-Auth-Type';

let cachedIisAuthPromise = null;
let fetchShimInstalled = false;

const normalizeString = (value) => {
    if (value === undefined || value === null) {
        return null;
    }

    const text = String(value).trim();
    return text || null;
};

const getLikelyIdentityUser = (payload) => {
    const identity = payload?.identity ?? {};
    return (
        normalizeString(identity.logonUser)
        || normalizeString(identity.authUser)
        || normalizeString(identity.remoteUser)
        || normalizeString(identity.userIdentityName)
        || null
    );
};

const getLikelyIdentityType = (payload) => {
    const identity = payload?.identity ?? {};
    return normalizeString(identity.authType);
};

export async function getIisAuthPayload({ skipCache = false } = {}) {
    if (!skipCache && cachedIisAuthPromise) {
        return cachedIisAuthPromise;
    }

    cachedIisAuthPromise = fetch(IIS_AUTH_ENDPOINT, {
        cache: 'no-store',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json'
        }
    }).then(async (response) => {
        if (!response.ok) {
            throw new Error(`IIS auth endpoint failed with status ${response.status}`);
        }
        return await response.json();
    }).catch((error) => {
        cachedIisAuthPromise = null;
        throw error;
    });

    return cachedIisAuthPromise;
}

export async function getIisAuthUser(options) {
    const payload = await getIisAuthPayload(options);
    return getLikelyIdentityUser(payload);
}

const shouldAttachClientAuth = (requestUrl) => {
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        const url = new URL(requestUrl, window.location.href);
        return url.origin === window.location.origin && url.pathname.startsWith('/api/');
    } catch {
        return false;
    }
};

export function installIisAuthFetchShim() {
    if (fetchShimInstalled || typeof window === 'undefined' || typeof window.fetch !== 'function') {
        return;
    }

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input, init) => {
        const request = new Request(input, init);

        if (!shouldAttachClientAuth(request.url)) {
            return originalFetch(request);
        }

        const headers = new Headers(request.headers);
        if (headers.has(CLIENT_AUTH_USER_HEADER) || headers.has(CLIENT_AUTH_TYPE_HEADER)) {
            return originalFetch(request);
        }

        try {
            const payload = await getIisAuthPayload();
            const authUser = getLikelyIdentityUser(payload);
            const authType = getLikelyIdentityType(payload);

            if (authUser) {
                headers.set(CLIENT_AUTH_USER_HEADER, authUser);
            }
            if (authType) {
                headers.set(CLIENT_AUTH_TYPE_HEADER, authType);
            }
        } catch (error) {
            console.warn('NGAT failed to load IIS auth identity fallback:', error);
        }

        return originalFetch(new Request(request, { headers }));
    };

    fetchShimInstalled = true;
}
