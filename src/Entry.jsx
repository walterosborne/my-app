import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Schedule from './Schedule';
import Planning from './Planning';
import Results from './Results';
import Nonconformaties from './Nonconformaties';
import { audits } from './assets/data/audits';
import './Entry.css';

const Entry = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const type = searchParams.get('type');
    const auditId = searchParams.get('audit') ? parseInt(searchParams.get('audit')) : null;

    const handleNavigate = (entryType) => {
        navigate(`/entry?type=${entryType}`);
    };

    const renderComponent = () => {
        switch (type) {
            case 'schedule':
                return <Schedule selectedAuditId={auditId} allAudits={audits} />;
            case 'planning':
                return <Planning selectedAuditId={auditId} allAudits={audits} />;
            case 'results':
                return <Results selectedAuditId={auditId} allAudits={audits} />;
            case 'nonconformaties':
                return <Nonconformaties selectedAuditId={auditId} allAudits={audits} />;
            default:
                return (
                    <div className="entry-message">
                        <h2>Select an Entry Type</h2>
                        <div style={{ display: 'flex', gap: '15px', marginTop: '20px', flexWrap: 'wrap', justifyContent: 'space-evenly' }}>
                            <button
                                onClick={() => handleNavigate('schedule')}
                                className="button"
                                style={{ backgroundColor: '#0066cc', width: '200px' }}
                            >
                                Schedule Entry
                            </button>
                            <button
                                onClick={() => handleNavigate('planning')}
                                className="button"
                                style={{ backgroundColor: '#0066cc', width: '200px' }}
                            >
                                Planning Entry
                            </button>
                            <button
                                onClick={() => handleNavigate('results')}
                                className="button"
                                style={{ backgroundColor: '#0066cc', width: '200px' }}
                            >
                                Results Entry
                            </button>
                            <button
                                onClick={() => handleNavigate('nonconformaties')}
                                className="button"
                                style={{ backgroundColor: '#0066cc', width: '200px' }}
                            >
                                Nonconformaties Entry
                            </button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="entry-page">
            <div className="entry-container">
                {renderComponent()}
            </div>
        </div>
    );
};

export default Entry;
