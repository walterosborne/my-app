import { errorToast } from './errorToast.js';
import React from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import { getAudits, getCurrentUser } from './assets/data/apiData';
import './Entry.css';

// Entry is one of the heaviest areas in NGAT. Load only the workflow the user
// actually opened instead of downloading Schedule, Planning, Conduct Audit and
// Nonconformities code together on every Entry visit.
const Schedule = React.lazy(() => import('./Schedule'));
const Planning = React.lazy(() => import('./Planning'));
const Results = React.lazy(() => import('./Results'));
const Nonconformities = React.lazy(() => import('./Nonconformaties'));

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

    // The API loader now asks for a narrow, workflow-specific audit payload.
    // Changing Entry tabs changes the payload, so reload when `type` changes;
    // current-user and unchanged lookup reads are still served from cache.
    React.useEffect(() => {
        let cancelled = false;

        async function loadAudits() {
            setLoading(true);
            try {
                const [auditsData, userData] = await Promise.all([
                    getAudits(),
                    getCurrentUser()
                ]);
                if (cancelled) return;
                setAudits(Array.isArray(auditsData) ? auditsData : []);
                setCurrentUser(userData);
            } catch (error) {
                if (cancelled) return;
                console.error('Error loading audits:', error);
                setAudits([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadAudits();
        return () => {
            cancelled = true;
        };
    }, [type]);

    React.useEffect(() => {
        setAccessErrorShown(false);
    }, [auditId]);

    const hasAccessToRequestedAudit = !auditId || audits.some(a => a.scheduleId === auditId);

    React.useEffect(() => {
        if (loading) return;
        if (!auditId) return;
        if (!hasAccessToRequestedAudit && !accessErrorShown) {
            setTimeout(() => {
                errorToast('You either do not have access to audit ' + auditId + ' or it does not exist.');
            }, 0);
            setAccessErrorShown(true);
        }
    }, [auditId, hasAccessToRequestedAudit, loading, accessErrorShown]);

    // Explicit refreshes after a save bypass the cache so the workflow sees its
    // new values, while ordinary navigation reuses the already-loaded payload.
    const reloadAudits = async () => {
        try {
            const auditsData = await getAudits(true);
            setAudits(Array.isArray(auditsData) ? auditsData : []);
        } catch (error) {
            console.error('Error reloading audits:', error);
        }
    };

    if (loading) {
        return (
            <div className="entry-page">
                <div className="entry-container">
                    <div className="entry-message">Loading audits...</div>
                </div>
            </div>
        );
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
            case 'nonconformities':
                return <Nonconformities selectedAuditId={resolvedAuditId} allAudits={audits} reloadAudits={reloadAudits} />;
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
                                Conduct Audit
                            </button>
                            <button
                                onClick={() => handleNavigate('nonconformities')}
                                className="button"
                                style={{ backgroundColor: '#0066cc', width: '200px' }}
                            >
                                Nonconformities Entry
                            </button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="entry-page">
            <div className="entry-container">
                <React.Suspense fallback={<div className="entry-message">Loading entry tool...</div>}>
                    {renderComponent()}
                </React.Suspense>
            </div>
        </div>
    );
};

export default Entry;
