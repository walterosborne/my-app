// Read the OpenShift key/value group "smtp"; accept uppercase names for local use.
// secure=false is normal for SMTP with optional STARTTLS (e.g. port 25/587).
const env = (key, fallback = '') => process.env[key] ?? process.env[key.toUpperCase()] ?? fallback;

const isDevEnvironment = () => String(env('NGAT_ENV', '')).trim().toLowerCase() === 'dev';

function tlsOptions() {
  const value = String(env('tls', '')).trim();
  if (!value) return undefined;

  if (value.toLowerCase() === 'false') {
    // The corporate SMTP relay presents a certificate chain that is not trusted
    // by the OpenShift container. In NGAT dev only, keep STARTTLS encryption but
    // allow that internal certificate so email can be tested from Kubernetes.
    // Production remains fail-closed and continues normal certificate validation.
    return isDevEnvironment() ? { rejectUnauthorized: false } : undefined;
  }

  if (value.toLowerCase() === 'true') return {};
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  } catch {
    // Report invalid config rather than silently disabling transport security.
  }
  throw new Error('smtp.tls must be true, false, or a JSON object of Node TLS options.');
}

const smtpConfig = {
  get from() { return env('from'); },
  get host() { return env('host'); },
  get port() { return Number(env('port', '25')); },
  get secure() { return String(env('secure', 'false')).toLowerCase() === 'true'; },
  get tls() { return tlsOptions(); }
};

export default smtpConfig;
