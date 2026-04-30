import React from 'react';
import './Headers.css';
import { getHeaderDiagnostics } from './assets/data/apiData';

const DiagnosticsBlock = ({ title, value, defaultOpen = false }) => (
    <details className="headers-block" open={defaultOpen}>
        <summary>{title}</summary>
        <pre>{JSON.stringify(value, null, 2)}</pre>
    </details>
);

function Headers() {
    const [payload, setPayload] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');

    const loadDiagnostics = React.useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const data = await getHeaderDiagnostics();
            setPayload(data);
        } catch (err) {
            console.error('Error loading header diagnostics:', err);
            setPayload(null);
            setError(err?.message || 'Failed to load diagnostics.');
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        loadDiagnostics();
    }, [loadDiagnostics]);

    const diagnostics = payload?.diagnostics ?? {};
    const request = diagnostics.request ?? {};
    const authCandidates = diagnostics.authCandidates ?? {};
    const networkIdPreview = diagnostics.networkIdPreview ?? {};
    const processInfo = payload?.process ?? {};
    const dbHealth = payload?.dbHealth ?? {};

    return (
        <div className="headers-page">
            <div className="headers-shell">
                <div className="headers-hero">
                    <div>
                        <h1>Header Diagnostics</h1>
                        <p>
                            This page pulls the backend diagnostics payload from
                            <code> /api/testheaders?format=json</code> and renders it inside the app.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="headers-refresh-button"
                        onClick={loadDiagnostics}
                        disabled={loading}
                    >
                        {loading ? 'Refreshing...' : 'Refresh Diagnostics'}
                    </button>
                </div>

                {error ? (
                    <div className="headers-error-panel">
                        <h2>Request Failed</h2>
                        <p>{error}</p>
                    </div>
                ) : null}

                <div className="headers-summary-grid">
                    <div className="headers-summary-card">
                        <span className="headers-summary-label">Selected Network ID</span>
                        <strong>{networkIdPreview.selectedByCurrentCode || 'None'}</strong>
                    </div>
                    <div className="headers-summary-card">
                        <span className="headers-summary-label">Generated At</span>
                        <strong>{payload?.generatedAt || 'Not loaded'}</strong>
                    </div>
                    <div className="headers-summary-card">
                        <span className="headers-summary-label">Backend PID</span>
                        <strong>{processInfo.pid || 'Unknown'}</strong>
                    </div>
                    <div className="headers-summary-card">
                        <span className="headers-summary-label">Request Path</span>
                        <strong>{request.originalUrl || 'Unknown'}</strong>
                    </div>
                </div>

                <div className="headers-sections">
                    <DiagnosticsBlock title="Auth Candidates" value={authCandidates} defaultOpen />
                    <DiagnosticsBlock title="Network ID Preview" value={networkIdPreview} defaultOpen />
                    <DiagnosticsBlock title="Request Details" value={request} />
                    <DiagnosticsBlock title="Socket Details" value={diagnostics.socket ?? {}} />
                    <DiagnosticsBlock title="Database Health" value={dbHealth} />
                    <DiagnosticsBlock title="Process Info" value={processInfo} />
                    <DiagnosticsBlock title="All Request Headers" value={diagnostics.headers ?? {}} />
                    <DiagnosticsBlock title="Environment" value={payload?.env ?? {}} />
                    <DiagnosticsBlock title="Full Diagnostics Payload" value={payload ?? {}} />
                </div>
            </div>
        </div>
    );
}

export default Headers;
