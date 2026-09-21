export const PRODUCTION_HOST = 'ngat.ds.northgrum.com';
export const PRODUCTION_APP_ORIGIN = (typeof process !== 'undefined' ? process.env?.NGAT_PUBLIC_ORIGIN : import.meta.env?.VITE_NGAT_PUBLIC_ORIGIN) || `https://${PRODUCTION_HOST}`;
export const STAGING_HOST = 'ngat-temp-stg.ds.northgrum.com';
export const DEVELOPMENT_HOST = 'ngat-temp-dev.ds.northgrum.com';

export const KNOWN_DEVELOPMENT_HOSTS = Object.freeze([
    DEVELOPMENT_HOST,
    STAGING_HOST
]);

export const PRODUCTION_SCHEMA = 'dbo';
export const STAGING_SCHEMA = 'stag';
export const DEVELOPMENT_SCHEMA = 'dev';

export const normalizeEnvironmentHost = (value) => String(value || '')
    .split(',')[0]
    .trim()
    .replace(/:\d+$/, '')
    .toLowerCase();

export const getEnvironmentModeForHost = (host) => {
    // Do not derive a production database schema from browser-supplied Host/Origin.
    const explicitMode = typeof process !== 'undefined' ? process.env?.NGAT_ENV : import.meta.env?.VITE_NGAT_ENV;
    if (['production', 'prod'].includes(explicitMode)) return 'prod';
    if (['staging', 'stg'].includes(explicitMode)) return 'stg';
    if (['development', 'dev'].includes(explicitMode)) return 'dev';
    const normalizedHost = normalizeEnvironmentHost(host);
    if (normalizedHost === PRODUCTION_HOST) {
        return 'prod';
    }
    if (normalizedHost === STAGING_HOST) {
        return 'stg';
    }
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') return 'prod';
    if (import.meta.env?.MODE === 'production') return 'prod';
    return 'dev';
};

export const getDatabaseSchemaForHost = (host) => {
    const explicitSchema = typeof process !== 'undefined' ? process.env?.AUDIT_SCHEMA : undefined;
    if (explicitSchema) {
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(explicitSchema)) throw new Error('Invalid AUDIT_SCHEMA identifier.');
        return explicitSchema;
    }
    const environmentMode = getEnvironmentModeForHost(host);
    if (environmentMode === 'prod') {
        return PRODUCTION_SCHEMA;
    }
    if (environmentMode === 'stg') {
        return STAGING_SCHEMA;
    }
    return DEVELOPMENT_SCHEMA;
};

export const isDevelopmentEnvironmentHost = (host) => {
    return getEnvironmentModeForHost(host) !== 'prod';
};

export const getProductionAppUrlForPath = (path = '/', search = '') => {
    const normalizedPath = `/${String(path || '/').replace(/^\/+/, '')}`.replace(/\/{2,}/g, '/');
    const normalizedSearch = String(search || '');
    return `${PRODUCTION_APP_ORIGIN}/#${normalizedPath}${normalizedSearch}`;
};
