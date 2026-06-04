export const PRODUCTION_HOST = 'ngat.ds.northgrum.com';
export const PRODUCTION_APP_ORIGIN = `https://${PRODUCTION_HOST}`;

export const KNOWN_DEVELOPMENT_HOSTS = Object.freeze([
    'ngat-temp-dev.ds.northgrum.com',
    'ngat-temp-stg.ds.northgrum.com'
]);

export const PRODUCTION_SCHEMA = 'dbo';
export const DEVELOPMENT_SCHEMA = 'ngat_dev';

export const normalizeEnvironmentHost = (value) => String(value || '')
    .split(',')[0]
    .trim()
    .replace(/:\d+$/, '')
    .toLowerCase();

export const getEnvironmentModeForHost = (host) => {
    const normalizedHost = normalizeEnvironmentHost(host);
    return normalizedHost === PRODUCTION_HOST ? 'prod' : 'dev';
};

export const getDatabaseSchemaForHost = (host) => {
    return getEnvironmentModeForHost(host) === 'prod'
        ? PRODUCTION_SCHEMA
        : DEVELOPMENT_SCHEMA;
};

export const isDevelopmentEnvironmentHost = (host) => {
    return getEnvironmentModeForHost(host) !== 'prod';
};

export const getProductionAppUrlForPath = (path = '/', search = '') => {
    const normalizedPath = `/${String(path || '/').replace(/^\/+/, '')}`.replace(/\/{2,}/g, '/');
    const normalizedSearch = String(search || '');
    return `${PRODUCTION_APP_ORIGIN}/#${normalizedPath}${normalizedSearch}`;
};
