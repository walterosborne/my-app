import { useCallback, useEffect, useRef, useState } from 'react';
import './BackendAvailability.css';

const POLL_INTERVAL_MS = 15000;
const REQUEST_TIMEOUT_MS = 7000;

/**
 * Keep an already-open form mounted during an outage: remounting/reloading could
 * discard unsaved answers. The health endpoint verifies the backend AND its
 * audit/roster databases. It never reads or writes audit records.
 */
const BackendAvailability = ({ children }) => {
  const [status, setStatus] = useState('checking');
  const failures = useRef(0);
  const hadConnection = useRef(false);
  const checking = useRef(false);

  const checkConnection = useCallback(async () => {
    if (checking.current) return;
    checking.current = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch('/api/health', {
        cache: 'no-store',
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      const result = await response.json();
      if (!response.ok || result?.ok !== true || result?.service !== 'ngat') {
        throw new Error('NGAT service unavailable');
      }
      failures.current = 0;
      const wasPreviouslyAvailable = hadConnection.current;
      hadConnection.current = true;
      setStatus((previous) => {
        if (previous === 'restored') return 'restored';
        return previous === 'offline' && wasPreviouslyAvailable ? 'restored' : 'online';
      });
    } catch {
      failures.current += 1;
      // Ignore one transient failure after the app has loaded; do not flicker.
      setStatus((previous) =>
        previous === 'checking' || failures.current >= 2 ? 'offline' : previous
      );
    } finally {
      clearTimeout(timeout);
      checking.current = false;
    }
  }, []);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkConnection]);

  // Do not mount app pages when they would interpret failed API calls as empty data.
  if (!hadConnection.current && status !== 'online') {
    return (
      <main className="ngat-service-screen" role={status === 'offline' ? 'alert' : 'status'}>
        <div className="ngat-service-panel">
          <h1>{status === 'checking' ? 'Connecting to NGAT…' : 'NGAT is temporarily unavailable'}</h1>
          {status === 'offline' ? (
            <>
              <p>We can’t reach NGAT or one of its required services right now. Please try again shortly.</p>
              <p>If you were saving when the connection dropped, check whether that save completed before submitting it again.</p>
              <button type="button" onClick={checkConnection}>Try connection again</button>
              <p className="ngat-service-note">We’ll also check automatically.</p>
            </>
          ) : (
            <p>Checking the application connection.</p>
          )}
        </div>
      </main>
    );
  }

  return (
    <>
      {status === 'offline' && (
        <div className="ngat-service-banner ngat-service-banner--offline" role="alert">
          <div>
            <strong>NGAT connection unavailable.</strong>{' '}
            The information shown may be out of date. Don’t submit until it returns; if you were saving,
            verify whether the save completed before trying again. Your open form will stay on screen.
          </div>
          <button type="button" onClick={checkConnection}>Try again</button>
        </div>
      )}
      {status === 'restored' && (
        <div className="ngat-service-banner ngat-service-banner--restored" role="status">
          <div>
            <strong>NGAT connection restored.</strong>{' '}
            Existing pages may still show older data. Reload when convenient, but copy any unsaved answers first.
          </div>
          <div className="ngat-service-actions">
            <button type="button" onClick={() => window.location.reload()}>Reload page</button>
            <button type="button" onClick={() => setStatus('online')}>Dismiss</button>
          </div>
        </div>
      )}
      {children}
    </>
  );
};

export default BackendAvailability;
