import { errorToast } from './errorToast.js';
import React from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import { getAudits, getCurrentUser, getPrograms } from './assets/data/apiData';
import './Entry.css';

// Entry is one of the heaviest areas in NGAT. Load only the workflow the user
// actually opened instead of downloading Schedule, Planning, Conduct Audit and
// Nonconformities code together on every Entry visit. Keep the loader functions
// so we can start downloading the selected tool while its audit data is loading.
const loadSchedule = () => import('./Schedule');
const loadPlanning = () => import('./Planning');
const loadResults = () => import('./Results');
const loadNonconformities = () => import('./Nonconformaties');

const Schedule = React.lazy(loadSchedule);
const Planning = React.lazy(loadPlanning);
const Results = React.lazy(loadResults);
const Nonconformities = React.lazy(loadNonconformities);

const preloadEntryTool = (type) => {
    switch (type) {
        case 'schedule':
            return loadSchedule();
        case 'planning':
            return loadPlanning();
        case 'results':
            return loadResults();
        case 'nonconformaties':
        case 'nonconformities':
            return loadNonconformities();
        default:
            return Promise.resolve();
    }
};

const hasEntryReferenceProfile = (type) => (
    ['schedule', 'planning', 'results', 'nonconformaties', 'nonconformities'].includes(type)
);

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

    // Load the lightweight audit list, selected page code, and that page's
    // bundled reference data together. This keeps the loading card at a stable
    // size and avoids the visible "audits -> entry tool -> lookup data" cascade.
    React.useEffect(() => {
        let cancelled = false;

        async function loadEntry() {
            setLoading(true);
            try {
                const referenceWarmup = hasEntryReferenceProfile(type)
                    ? getPrograms()
                    : Promise.resolve();

                const [auditsData, userData] = await Promise.all([
                    getAudits(),
                    getCurrentUser(),
                    preloadEntryTool(type),
                    referenceWarmup
                ]);
                if (cancelled) return;
                setAudits(Array.isArray(auditsData) ? auditsData : []);
                setCurrentUser(userData);
            } catch (error) {
                if (cancelled) return;
                console.error('Error loading entry:', error);
                setAudits([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadEntry();
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
                    <div className="entry-message">Loading entry...</div>
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
