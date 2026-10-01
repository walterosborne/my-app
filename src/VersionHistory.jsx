import React from 'react';
import './Entry.css';
import './VersionHistory.css';

const releases = [
  {
    version: '3.0',
    date: 'October 2026',
    current: true,
    title: 'A more capable audit workflow',
    summary: 'The current NGAT experience, with major improvements to audit entry, findings, reporting, FOE, and day-to-day usability.',
    highlights: [
      'Conduct Audit now supports multiple responses or findings for a single question.',
      'Audit questions stay collapsed when empty and reopen automatically when they already contain saved responses.',
      'Audits can be cancelled, reactivated, or archived without losing their history.',
      'Schedule Entry better enforces Program, Operating Unit, Division, and related organizational relationships.',
      'Reports and exports understand the new question/response structure and can optionally include cancelled audits.',
      'Objective evidence is easier to review, with per-question file lists and ZIP downloads.',
      'FOE Audits and FOE Download Audit Info are now native NGAT pages, with FOE audit email notifications.',
      'Navigation, Calendar, My Audit To-Do List, Risk Analysis, and audit action layouts received usability improvements.'
    ]
  },
  {
    version: '2.2',
    date: 'July 2026',
    title: 'FOE administration and access improvements',
    summary: 'A smaller release focused on FOE administration and clearer access behavior.',
    highlights: [
      'Added a native FOE Admin Menu for auditors, sites, audit areas, customers, divisions, and shifts.',
      'Improved FOE filtering and editing workflows.',
      'CUI access messages became more useful, including guidance on who to contact when access is needed.',
      'Improved reliability when loading Conduct Audit questions and user access information.'
    ]
  },
  {
    version: '2.1',
    date: 'June 2026',
    title: 'Evidence and Conduct Audit polish',
    summary: 'Focused improvements to evidence handling and the audit-entry experience.',
    highlights: [
      'Added multi-file Objective Evidence uploads.',
      'Improved Objective Evidence ZIP downloads and handling of shared file locations.',
      'Refined collapsing behavior for standard questions and Every Time Questions.',
      'Improved nonconformity response and comment behavior during Conduct Audit.'
    ]
  },
  {
    version: '2.0',
    date: '2026',
    title: 'Modern NGAT',
    summary: 'The React-based NGAT foundation that introduced the modern end-to-end audit experience.',
    highlights: [
      'Unified Audit Schedule, Planning, Conduct Audit, Nonconformities, and reporting in one application.',
      'Added approval workflows, reminder emails, Objective Evidence, and CUI-aware access controls.',
      'Added All My Audits, report pages, Metrics, Calendar, and Audit Status tools.',
      'Expanded the Admin Menu for maintaining auditors and core audit reference data.'
    ]
  }
];

const VersionHistory = () => {
  return (
    <div className="entry-page version-history-page">
      <div className="entry-container version-history-container">
        <header className="version-history-hero">
          <p className="version-history-eyebrow">Help</p>
          <h1>Version History</h1>
          <p className="version-history-intro">
            A quick, user-focused look at the changes that meaningfully affect how you work in NGAT.
          </p>
        </header>

        <div className="version-history-timeline">
          {releases.map((release) => (
            <section className="version-history-release" key={release.version}>
              <div className="version-history-marker" aria-hidden="true">
                <span />
              </div>

              <div className="version-history-card">
                <div className="version-history-card-header">
                  <div>
                    <div className="version-history-version-row">
                      <span className="version-history-version">NGAT {release.version}</span>
                      {release.current ? (
                        <span className="version-history-current">Current</span>
                      ) : null}
                    </div>
                    <h2>{release.title}</h2>
                  </div>
                  <time>{release.date}</time>
                </div>

                <p className="version-history-summary">{release.summary}</p>

                <ul className="version-history-highlights">
                  {release.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VersionHistory;
