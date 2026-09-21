// Restore the original ignored links or set the VITE_FOE_* values at build time.
export default {
  metrics: { label: 'FOE Metrics', url: import.meta.env.VITE_FOE_METRICS_URL || '', external: true },
  audits: { label: 'FOE Audits', iframeSrc: import.meta.env.VITE_FOE_AUDITS_URL || '' },
  download: { label: 'FOE Download Audit Info', iframeSrc: import.meta.env.VITE_FOE_DOWNLOAD_URL || '' },
  admin: { label: 'FOE Admin Menu', iframeSrc: '' }
};
