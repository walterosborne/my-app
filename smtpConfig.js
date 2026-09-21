// Original private IIS config is untracked. Resolve values after runtime-env loads.
const smtpConfig = {
  get host() { return process.env.SMTP_HOST || ''; },
  get port() { return Number(process.env.SMTP_PORT || 25); },
  get from() { return process.env.SMTP_FROM || ''; },
  get secure() { return process.env.SMTP_SECURE === 'true'; },
  get tls() { return { rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false' }; }
};
export default smtpConfig;
