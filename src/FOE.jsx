import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Entry.css';
import foeLinks from './config/foeLinks.js';
import { getCurrentUser } from './assets/data/apiData';

const FOE = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get('type');
  const [networkId, setNetworkId] = useState('');

  useEffect(() => {
    async function loadCurrentUser() {
      const user = await getCurrentUser();
      setNetworkId(user?.networkId || '');
    }
    loadCurrentUser();
  }, []);

  const appendNetworkId = (url) => {
    if (!url || !networkId) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}networkId=${encodeURIComponent(networkId)}`;
  };

  const getIframeConfig = (value) => {
    const config = foeLinks[value];
    if (!config || config.external) {
      return null;
    }
    return {
      iframeSrc: appendNetworkId(config.iframeSrc)
    };
  };

  const handleMetrics = () => {
    window.open(foeLinks.metrics.url, '_blank', 'noopener,noreferrer');
  };

  const iframeConfig = useMemo(() => getIframeConfig(type), [type, networkId]);

  const renderContent = () => {
    if (!type) {
      return (
        <div className="entry-message">
          <h2>Select a FOE Option</h2>
          <div style={{ display: 'flex', gap: '15px', marginTop: '20px', flexWrap: 'wrap', justifyContent: 'space-evenly' }}>
            <button
              onClick={handleMetrics}
              className="button"
              style={{ backgroundColor: '#0066cc', width: '200px' }}
            >
              {foeLinks.metrics.label}
            </button>
            <button
              onClick={() => navigate('/foe?type=audits')}
              className="button"
              style={{ backgroundColor: '#0066cc', width: '200px' }}
            >
              {foeLinks.audits.label}
            </button>
            <button
              onClick={() => navigate('/foe?type=download')}
              className="button"
              style={{ backgroundColor: '#0066cc', width: '200px' }}
            >
              {foeLinks.download.label}
            </button>
            <button
              onClick={() => navigate('/foe?type=admin')}
              className="button"
              style={{ backgroundColor: '#0066cc', width: '200px' }}
            >
              {foeLinks.admin.label}
            </button>
          </div>
        </div>
      );
    }

    if (!iframeConfig) {
      return (
        <div className="entry-message">
          <h2>Select a FOE Option</h2>
          <p>Choose an option from the FOE menu above.</p>
        </div>
      );
    }

    return (
      <iframe
        title="FOE Content"
        src={iframeConfig.iframeSrc}
        style={{
          width: '100%',
          height: '75vh',
          border: 'none',
          borderRadius: '12px',
          backgroundColor: 'white'
        }}
      />
    );
  };

  return (
    <div className="entry-page">
      <div className="entry-container">
        {renderContent()}
      </div>
    </div>
  );
};

export default FOE;
