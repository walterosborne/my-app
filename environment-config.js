// NGAT_ENV alone chooses the audit schema; neither Host nor NODE_ENV does.
export const PRODUCTION_HOST = 'ngat.ds.northgrum.com';
export const PRODUCTION_APP_ORIGIN = (typeof process !== 'undefined'
    ? process.env?.NGAT_PUBLIC_ORIGIN
    : import.meta.env?.VITE_NGAT_PUBLIC_ORIGIN) || `https://${PRODUCTION_HOST}`;

export const PRODUCTION_SCHEMA = 'dbo';
export const STAGING_SCHEMA = 'stag';
export const DEVELOPMENT_SCHEMA = 'dev';

export const normalizeEnvironmentHost = (value) => String(value || '')
    .split(',')[0]
    .trim()
    .replace(/:\d+$/, '')
    .toLowerCase();

export const getEnvironmentModeForHost = (_host) => {
    // The host argument is retained for existing callers but is never used.
    const mode = typeof process !== 'undefined' ? process.env.NGAT_ENV : undefined;
    switch (String(mode ?? '').trim().toLowerCase()) {
        case 'prod':
        case 'production':
            return 'prod';
        case 'stg':
        case 'staging':
            return 'stg';
        case 'dev':
        case 'development':
            return 'dev';
        case '':
            if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') return 'dev';
            break;
        default:
            break;
    }
    throw new Error('NGAT_ENV must be dev or prod (or stg for legacy staging). The audit schema never depends on the hostname or NODE_ENV.');
};

export const getDatabaseSchemaForHost = (_host) => {
    const mode = getEnvironmentModeForHost();
    if (mode === 'prod') return PRODUCTION_SCHEMA;
    if (mode === 'stg') return STAGING_SCHEMA;
    return DEVELOPMENT_SCHEMA;
};

export const isDevelopmentEnvironmentHost = (_host) => getEnvironmentModeForHost() !== 'prod';

export const getProductionAppUrlForPath = (path = '/', search = '') => {
    const normalizedPath = `/${String(path || '/').replace(/^\/+/, '')}`.replace(/\/{2,}/g, '/');
    const normalizedSearch = String(search || '');
    return `${PRODUCTION_APP_ORIGIN}/#${normalizedPath}${normalizedSearch}`;
};
