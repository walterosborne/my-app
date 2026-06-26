export const PRODUCTION_HOST = 'ngat.ds.northgrum.com';
export const PRODUCTION_APP_ORIGIN = `https://${PRODUCTION_HOST}`;
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
    const normalizedHost = normalizeEnvironmentHost(host);
    if (normalizedHost === PRODUCTION_HOST) {
        return 'prod';
    }
    if (normalizedHost === STAGING_HOST) {
        return 'stg';
    }
    return 'dev';
};

export const getDatabaseSchemaForHost = (host) => {
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
