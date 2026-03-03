import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Entry.css';

const FOE = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get('type');

  const getIframeConfig = (value) => {
    switch (value) {
      case 'audits':
        return {
          iframeSrc: 'https://example.com/?foe=audits',
          targetUrl: 'https://www.google.com/images'
        };
      case 'download':
        return {
          iframeSrc: 'https://example.com/?foe=download',
          targetUrl: 'https://www.google.com/maps'
        };
      case 'admin':
        return {
          iframeSrc: 'https://example.com/?foe=admin',
          targetUrl: 'https://www.bing.com'
        };
      default:
        return null;
    }
  };

  const handleMetrics = () => {
    window.open('https://www.yahoo.com', '_blank', 'noopener,noreferrer');
  };

  const iframeConfig = getIframeConfig(type);

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
              Metrics
            </button>
            <button
              onClick={() => navigate('/foe?type=audits')}
              className="button"
              style={{ backgroundColor: '#0066cc', width: '200px' }}
            >
              Audits
            </button>
            <button
              onClick={() => navigate('/foe?type=download')}
              className="button"
              style={{ backgroundColor: '#0066cc', width: '200px' }}
            >
              Download Audit Info
            </button>
            <button
              onClick={() => navigate('/foe?type=admin')}
              className="button"
              style={{ backgroundColor: '#0066cc', width: '200px' }}
            >
              Admin Menu
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
