import React from 'react';
import { Link } from 'react-router-dom';
import './Entry.css';
import './AuditReports.css';

const reportCards = [
  {
    label: '30/60/90',
    path: '/reports?type=30-60-90',
    description: 'View upcoming audits scheduled in the next 30, 60, and 90 days.'
  },
  {
    label: 'Planned vs Completed',
    path: '/reports?type=planned-vs-completed',
    description: 'Compare planned audits to completed outcomes across organizational groupings.'
  },
  { label: 'Rollup Audit Results', path: '/reports?type=rollup-results', description: '' },
  { label: 'Rollup Audit Findings', path: '/reports?type=rollup-findings', description: '' },
  { label: 'Rollup Audit Schedule', path: '/reports?type=rollup-schedule', description: '' },
  { label: 'Clauses Audited', path: '/reports?type=clauses-audited', description: '' },
  { label: 'Processes Audited', path: '/reports?type=processes-audited', description: '' },
  { label: 'Schedule Comments', path: '/reports?type=schedule-comments', description: '' }
];

const AuditReports = () => {
  return (
    <div className="entry-page">
      <div className="entry-container">
        <div className="audit-reports-header tool-page-header">
          <p className="tool-page-subtitle">Audit Reports</p>
          <h2 className="audit-reports-title">Audit Reports</h2>
          <p className="audit-reports-subtitle" />
        </div>
        <div className="audit-reports-grid">
          {reportCards.map((report) => {
            const cardContent = (
              <div className={`audit-reports-card${report.path ? '' : ' is-disabled'}`}>
                <h3>{report.label}</h3>
                {report.description ? (
                  <p>{report.description}</p>
                ) : null}
              </div>
            );

            if (!report.path) {
              return (
                <div key={report.label} className="audit-reports-card-wrapper">
                  {cardContent}
                </div>
              );
            }

            return (
              <Link key={report.label} to={report.path} className="audit-reports-card-link">
                {cardContent}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AuditReports;
