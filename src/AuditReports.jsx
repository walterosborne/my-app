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
  { label: 'Rollup Audit Results', path: '/reports?type=rollup-results', description: 'Detailed audit results by schedule, including planning and findings rollups.' },
  { label: 'Rollup Audit Schedule', path: '/reports?type=rollup-schedule', description: 'Lists each audit with its main organizational fields, current stage, scheduled month, assigned auditors, and the PrOP and standards content reviewed for that audit.' },
  { label: 'Clauses Audited', path: '/reports?type=clauses-audited', description: 'Lists each audited standard clause as its own row with the audit and organizational context where it was reviewed.' },
  { label: 'Processes Audited', path: '/reports?type=processes-audited', description: 'Lists each process selected in audit findings, along with the audit context and recorded audit time.' },
  { label: 'Schedule Comments', path: '/reports?type=schedule-comments', description: 'Shows each audit with its organizational context, selected processes, stage, start date, and the schedule comment entered in step 1.' }
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
