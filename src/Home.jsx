import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import teamImage from './assets/placeholder.jpg';

const Home = () => {
    const navigate = useNavigate();
    const upcomingAudits = [
        { id: '8176', date: '2026-03-15', auditor: 'Smith, John' },
        { id: '3245', date: '2026-03-08', auditor: 'Johnson, Sarah' },
        { id: '7892', date: '2026-03-08', auditor: 'Williams, Michael' },
        { id: '4521', date: '2026-03-12', auditor: 'Brown, Jennifer' },
        { id: '6034', date: '2026-03-20', auditor: 'Davis, Robert' },
        { id: '9187', date: '2026-03-25', auditor: 'Miller, Emily' },
        { id: '2658', date: '2026-03-28', auditor: 'Wilson, David' }
    ];

    return (
        <div className="home-container">
            <div className="home-content">
                <div className="home-header">
                    <h1 className="home-title">Northrop Grumman Audit Tool (NGAT)</h1>
                    <p className="welcome-text">Welcome Osborne,Walter W!</p>
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

            <div className="right-section">
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
                                <div className="audit-id">Schedule ID: <em>{audit.id}</em></div>
                                <div className="audit-details">{audit.date} {audit.auditor}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;