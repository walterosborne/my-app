// Read the OpenShift key/value group "smtp"; accept uppercase names for local use.
// secure=false is normal for SMTP on port 25/587. When tls=false is explicitly
// configured, NGAT must not opportunistically upgrade the connection with STARTTLS.
const env = (key, fallback = '') => process.env[key] ?? process.env[key.toUpperCase()] ?? fallback;

const tlsSetting = () => String(env('tls', '')).trim();

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

const smtpConfig = {
  get from() { return env('from'); },
  get host() { return env('host'); },
  get port() { return Number(env('port', '25')); },
  get secure() { return String(env('secure', 'false')).toLowerCase() === 'true'; },
  // Nodemailer upgrades secure=false SMTP connections with STARTTLS whenever
  // the server advertises it unless ignoreTLS is set. Our smtp.tls=false value
  // means exactly that: keep the SMTP connection plaintext and skip STARTTLS.
  get ignoreTLS() { return tlsSetting().toLowerCase() === 'false'; },
  get tls() { return tlsOptions(); }
};

export default smtpConfig;