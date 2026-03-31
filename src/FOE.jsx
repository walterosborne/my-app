import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Entry.css';
import foeLinks from './config/foeLinks.js';
import { getCurrentUser } from './assets/data/apiData';

const FOE = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get('type');
  const [currentUser, setCurrentUser] = useState({ myId: '', name: '' });

  useEffect(() => {
    async function loadCurrentUser() {
      const user = await getCurrentUser();
      setCurrentUser({
        myId: user?.myId || '',
        name: user?.name || ''
      });
    }
    loadCurrentUser();
  }, []);

  const appendUserContext = (url) => {
    if (!url || !currentUser.myId) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}usermyid=${encodeURIComponent(currentUser.myId)}&username=${encodeURIComponent(currentUser.name || currentUser.myId)}`;
  };

  const getIframeConfig = (value) => {
    const config = foeLinks[value];
    if (!config || config.external) {
      return null;
    }
    return {
      iframeSrc: appendUserContext(config.iframeSrc)
    };
  };

  const handleMetrics = () => {
    window.open(foeLinks.metrics.url, '_blank', 'noopener,noreferrer');
  };

  const iframeConfig = useMemo(() => getIframeConfig(type), [type, currentUser.myId]);

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
        className="foe-iframe"
        style={{
          width: '100%',
          border: 'none',
          backgroundColor: 'white'
        }}
      />
    );
  };

  return (
    <div className="entry-page">
      <div className={`entry-container ${iframeConfig ? 'foe-container--embed' : ''}`}>
        {renderContent()}
      </div>
    </div>
  );
};

export default FOE;
