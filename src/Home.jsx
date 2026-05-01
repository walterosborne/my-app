import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import teamImage from './assets/placeholder.jpg';
import { getAuditsAll, getAuditors, getCurrentUser, getHeaderDiagnostics } from './assets/data/apiData';
import { formatDateForDisplay, parseCalendarDate } from './Utilities.jsx';

const Home = () => {
    const navigate = useNavigate();
    const [upcomingAudits, setUpcomingAudits] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [currentUser, setCurrentUser] = React.useState(null);
    const leftBubbleRef = React.useRef(null);
    const rightBubbleRef = React.useRef(null);

    React.useEffect(() => {
        async function logAuthDiagnostics() {
            console.log('NGAT auth diagnostics effect started on Home.');
            try {
                const diagnosticsPayload = await getHeaderDiagnostics();
                const authCandidates = diagnosticsPayload?.diagnostics?.authCandidates ?? {};
                const fallbackSource = authCandidates.x_client_auth_user ? 'iis-auth fallback' : 'none';
                const authUser = authCandidates.auth_user ?? null;
                const likelyAuthUser =
                    authCandidates.auth_user
                    || authCandidates.remote_user
                    || authCandidates.x_auth_user
                    || authCandidates.x_client_auth_user
                    || authCandidates.x_logon_user
                    || authCandidates.x_remote_user
                    || authCandidates.x_iis_windowsauthuserid
                    || authCandidates.x_iisnode_auth_user
                    || authCandidates.x_forwarded_user
                    || authCandidates.x_auth_header
                    || null;

                console.log('NGAT AUTH_USER header:', authUser);
                console.log('NGAT likely auth user:', likelyAuthUser);
                console.log('NGAT auth fallback source:', fallbackSource);
                console.log('NGAT auth candidates:', authCandidates);
            } catch (error) {
                console.log('NGAT AUTH_USER: unavailable because /api/testheaders failed.');
                console.error('NGAT failed to load auth diagnostics on Home:', error);
            }
        }

        logAuthDiagnostics();
    }, []);

    // Load audits from API and format for display
    React.useEffect(() => {
        async function loadAudits() {
            try {
                const [auditsData, auditorsData, userData] = await Promise.all([
                    getAuditsAll(true),
                    getAuditors(),
                    getCurrentUser()
                ]);
                setCurrentUser(userData?.name && userData.name !== 'User' ? userData : null);

                // Calculate date range for 30-day lookahead
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                const thirtyDaysFromNow = new Date();
                thirtyDaysFromNow.setHours(23, 59, 59, 999);
                thirtyDaysFromNow.setDate(now.getDate() + 30);

                // Transform audit data to match the display format
                const formatted = auditsData
                    .filter(a => {
                        if (!a.expectedStartDate) return false;
                        const startDate = parseCalendarDate(a.expectedStartDate);
                        if (!startDate) return false;
                        // Only include audits with expected start date within next 30 days
                        return startDate >= now && startDate <= thirtyDaysFromNow;
                    })
                    .map(a => {
                        // Get auditor name from leadAuditorId
                        const auditor = auditorsData.find(aud => aud.auditorId === a.leadAuditorId);
                        const auditorName = auditor ? auditor.auditorName : 'TBD';

                        const title = a.title || 'Untitled Audit';
                        return {
                            id: String(a.scheduleId),
                            date: formatDateForDisplay(a.expectedStartDate),
                            auditor: auditorName,
                            title,
                            scheduleLabel: `Schedule ID: ${a.scheduleId}`,
                            rawDate: a.expectedStartDate // Keep for sorting
                        };
                    })
                    .sort((a, b) => parseCalendarDate(a.rawDate) - parseCalendarDate(b.rawDate)); // Sort by date
                setUpcomingAudits(formatted);
                setLoading(false);
            } catch (error) {
                console.error('Error loading audits:', error);
                setLoading(false);
            }
        }
        loadAudits();
    }, []);

    React.useLayoutEffect(() => {
        const syncSidebarHeight = () => {
            if (!leftBubbleRef.current || !rightBubbleRef.current) return;
            const leftHeight = leftBubbleRef.current.getBoundingClientRect().height;
            rightBubbleRef.current.style.maxHeight = `${leftHeight}px`;
            rightBubbleRef.current.style.height = `${leftHeight}px`;
        };

        syncSidebarHeight();
        window.addEventListener('resize', syncSidebarHeight);
        return () => window.removeEventListener('resize', syncSidebarHeight);
    }, [upcomingAudits.length]);

    return (
        <div className="home-container">
            <div className="home-content" ref={leftBubbleRef}>
                <div className="home-header">
                    <h1 className="home-title">Northrop Grumman Audit Tool (NGAT)</h1>
                    {currentUser?.name && (
                        <p className="welcome-text">Welcome {currentUser.name}!</p>
                    )}
                </div>

                <div className="main-section">
                    <div className="left-section">
                        <img src={teamImage} alt="Team Meeting" className="team-image" />
                    </div>

                    <div className="center-section">
                        <button
                            className="step-button"
                            onClick={() => navigate('/entry?type=schedule')}
                        >
                            Step 1: Audit Schedule
                        </button>
                        <button
                            className="step-button"
                            onClick={() => navigate('/entry?type=planning')}
                        >
                            Step 2: Audit Plan
                        </button>
                        <button
                            className="step-button"
                            onClick={() => navigate('/entry?type=results')}
                        >
                            Step 3: Conduct Audit
                        </button>
                        <button
                            className="step-button"
                            onClick={() => navigate('/entry?type=nonconformaties')}
                        >
                            Step 4: Nonconformities
                        </button>
                        <button
                            className="step-button"
                            onClick={() => navigate(`/audit`)}
                            style={{ cursor: 'pointer' }}

                        >
                            Step 5: Generate Audit Report
                        </button>
                    </div>
                </div>

                <div className="home-quick-links">
                    <button
                        className="home-link-button"
                        onClick={() => navigate('/audit')}
                    >
                        My Audits
                    </button>
                    <button
                        className="home-link-button"
                        onClick={() => navigate('/audit-statuses')}
                    >
                        My Audit/Approval Statuses
                    </button>
                </div>

                <div className="home-description">
                    <p>
                        NGAT is a sector-wide application for DS internal and external audits. It streamlines the audit process by
                        providing a centralized five-step platform for schedule creation, audit planning, and finding entry. Key features
                        include an Audit Reports section for accessing individual or multi-audit reports, an Audit Calendar for viewing
                        upcoming and past audit schedules over specific timelines, and a metrics dashboard to analyze trends and
                        statistics. There is also an input page which allows for seamless and instant collection of new data. The
                        application contains data from the NGAT and FOE databases, which are currently separate systems. Join us in
                        committing to shared success in organized DS audits. <a href="#" className="info-link">Click here for more information.</a>
                    </p>
                </div>
            </div>

            <div className="right-section" ref={rightBubbleRef}>
                <div className="audit-sidebar">
                    <h2 className="sidebar-title">Upcoming Audits (30 Day Lookahead)</h2>
                    <div className="audit-list">
                        {upcomingAudits.map((audit, index) => (
                            <div
                                key={index}
                                className="audit-item"
                                onClick={() => navigate(`/audit/${audit.id}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="audit-id">
                                    {audit.scheduleLabel} <em>({audit.title})</em>
                                </div>
                                <div className="audit-details">
                                    <span className="audit-date">{audit.date}</span> {audit.auditor}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
