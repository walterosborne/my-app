import React from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Schedule from './Schedule';
import Planning from './Planning';
import Results from './Results';
import Nonconformaties from './Nonconformaties';
import { getAudits, getCurrentUser } from './assets/data/apiData';
import './Entry.css';

const Entry = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const type = searchParams.get('type');
    const auditId = React.useMemo(() => {
        const queryAudit = searchParams.get('audit');
        if (queryAudit) {
            return parseInt(queryAudit);
        }
        const pathMatch = location.pathname.match(/\/(\d+)(?:\/)?$/);
        return pathMatch ? parseInt(pathMatch[1]) : null;
    }, [location.pathname, searchParams]);

    const [audits, setAudits] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [accessErrorShown, setAccessErrorShown] = React.useState(false);
    const [currentUser, setCurrentUser] = React.useState(null);

    // Load audits from API on mount
    React.useEffect(() => {
        async function loadAudits() {
            try {
                const [auditsData, userData] = await Promise.all([
                    getAudits(true),
                    getCurrentUser()
                ]);
                setAudits(auditsData);
                setCurrentUser(userData);
                setLoading(false);
            } catch (error) {
                console.error('Error loading audits:', error);
                setLoading(false);
            }
        }
        loadAudits();
    }, []);

    React.useEffect(() => {
        setAccessErrorShown(false);
    }, [auditId]);

    const hasAccessToRequestedAudit = !auditId || audits.some(a => a.scheduleId === auditId);

    React.useEffect(() => {
        if (loading) return;
        if (!auditId) return;
        if (!hasAccessToRequestedAudit && !accessErrorShown) {
            setTimeout(() => {
                toast.error('You either do not have access to audit ' + auditId + ' or it does not exist.');
            }, 0);
            setAccessErrorShown(true);
        }
    }, [auditId, hasAccessToRequestedAudit, loading, accessErrorShown]);

    // Function to reload audits data
    const reloadAudits = async () => {
        try {
            const auditsData = await getAudits(true); // Skip cache to get fresh data
            setAudits(auditsData);
        } catch (error) {
            console.error('Error reloading audits:', error);
        }
    };

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
    }

    const isRosterNonAuditor = currentUser?.myId && !currentUser?.auditorId;

    if (isRosterNonAuditor) {
        return (
            <div className="entry-page">
                <div className="entry-container">
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                        You are not listed as an auditor. Request access to continue.
                        <div style={{ marginTop: '1rem' }}>
                            <button
                                type="button"
                                className="button"
                                style={{ backgroundColor: '#0066cc', width: '200px' }}
                                onClick={() => navigate('/request-auditor-access')}
                            >
                                Request Access
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if ((audits.length === 0) && (type !== 'schedule')) {
        return (
            <div className="entry-page">
                <div className="entry-container">
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                        You do not have any audits yet. Create one to get started.
                        <div style={{ marginTop: '1rem' }}>
                            <button
                                onClick={() => navigate('/entry?type=schedule')}
                                className="button"
                                style={{ backgroundColor: '#0066cc', width: '200px' }}
                            >
                                Create an Audit
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const handleNavigate = (entryType) => {
        navigate(`/entry?type=${entryType}`);
    };

    const resolvedAuditId = hasAccessToRequestedAudit ? auditId : null;

    const renderComponent = () => {
        switch (type) {
            case 'schedule':
                return <Schedule selectedAuditId={resolvedAuditId} allAudits={audits} reloadAudits={reloadAudits} />;
            case 'planning':
                return <Planning selectedAuditId={resolvedAuditId} allAudits={audits} reloadAudits={reloadAudits} />;
            case 'results':
                return <Results selectedAuditId={resolvedAuditId} allAudits={audits} reloadAudits={reloadAudits} />;
            case 'nonconformaties':
                return <Nonconformaties selectedAuditId={resolvedAuditId} allAudits={audits} reloadAudits={reloadAudits} />;
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
