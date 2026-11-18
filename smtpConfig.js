import nodemailer from 'nodemailer';

// Read the OpenShift key/value group "smtp"; accept uppercase names for local use.
// secure=false is normal for SMTP on port 25/587. When tls=false is explicitly
// configured, NGAT must not opportunistically upgrade the connection with STARTTLS.
const env = (key, fallback = '') => process.env[key] ?? process.env[key.toUpperCase()] ?? fallback;

const tlsSetting = () => String(env('tls', '')).trim();
const isTlsExplicitlyDisabled = () => tlsSetting().toLowerCase() === 'false';

function tlsOptions() {
  const value = tlsSetting();
  if (!value || value.toLowerCase() === 'false') return undefined;

  if (value.toLowerCase() === 'true') return {};
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  } catch {
    // Report invalid config rather than silently changing transport security.
  }
  throw new Error('smtp.tls must be true, false, or a JSON object of Node TLS options.');
}

// mssqlserver.js creates the Nodemailer transport directly. Preserve that call
// site while making the existing smtp.tls=false setting mean what it says:
// do not issue STARTTLS even when the relay advertises it. This is scoped to
// NGAT's configured SMTP transport and does not disable Node TLS validation.
const originalCreateTransport = nodemailer.createTransport.bind(nodemailer);
nodemailer.createTransport = (options, ...args) => {
  if (
    isTlsExplicitlyDisabled()
    && options
    && typeof options === 'object'
    && String(options.host || '') === String(env('host') || '')
  ) {
    return originalCreateTransport({ ...options, ignoreTLS: true }, ...args);
  }
  return originalCreateTransport(options, ...args);
};

const smtpConfig = {
  get from() { return env('from'); },
  get host() { return env('host'); },
  get port() { return Number(env('port', '25')); },
  get secure() { return String(env('secure', 'false')).toLowerCase() === 'true'; },
  // Exposed explicitly so the transport config remains self-describing if the
  // Nodemailer construction is centralized here later.
  get ignoreTLS() { return isTlsExplicitlyDisabled(); },
  get tls() { return tlsOptions(); }
};

export default smtpConfig;