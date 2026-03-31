import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Entry.css';
import './AuditReports.css';
import { getCurrentUser } from './assets/data/apiData';

const riskCards = [
  {
    label: 'View Risk Analysis',
    path: '/risk-analysis/view',
    description: 'Review saved risk selections by organization and process area.'
  },
  {
    label: 'Edit Risk Analysis',
    path: '/risk-analysis/edit',
    description: 'Create or update risk selections for a specific organizational group.'
  }
];

function RiskAnalysis() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const userData = await getCurrentUser();
        if (!mounted) return;
        setCurrentUser(userData);
      } catch (error) {
        console.error('Error loading risk analysis user:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (currentUser?.isAdmin) return;
    const timeout = setTimeout(() => {
      navigate('/audit');
    }, 1200);
    return () => clearTimeout(timeout);
  }, [loading, currentUser, navigate]);

  if (loading || !currentUser) {
    return (
      <div className="entry-page">
        <div className="entry-container">
          <div className="entry-message">Loading risk analysis...</div>
        </div>
      </div>
    );
  }

  if (!currentUser.isAdmin) {
    return (
      <div className="entry-page">
        <div className="entry-container">
          <div className="entry-message">You do not have admin access. Redirecting...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="entry-page">
      <div className="entry-container">
        <div className="audit-reports-header tool-page-header">
          <p className="tool-page-subtitle">Tools · Risk Analysis</p>
          <h2 className="audit-reports-title">Risk Analysis</h2>
          <p className="audit-reports-subtitle">
            Choose whether you want to review saved risk selections or update them.
          </p>
        </div>
        <div className="audit-reports-grid">
          {riskCards.map((card) => (
            <Link key={card.label} to={card.path} className="audit-reports-card-link">
              <div className="audit-reports-card">
                <h3>{card.label}</h3>
                <p>{card.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RiskAnalysis;
