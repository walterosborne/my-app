import React from 'react';
import './Entry.css';
import './VersionHistory.css';

const releases = [
  {
    version: '3.1.1',
    date: 'October 2026',
    current: true,
    title: 'Standards management and Conduct Audit PrOP fix',
    summary: 'Administrators can classify and maintain standards, while Conduct Audit again displays the organizational PrOPs relevant to each audit.',
    sections: [
      {
        title: 'Standards',
        items: [
          'Classify standards as Internal or External from Admin Menu → Standards.',
          'Add new standards and edit existing standard names or classifications.',
          'Conduct Audit Step 1 groups standards by Internal, External, and Unclassified.',
          'Existing audits and standard clause text remain linked to their original standard IDs.'
        ]
      },
      {
        title: 'Conduct Audit',
        items: [
          'Restored Sector, Site, Business Unit, and Operating Unit PrOP choices in finding responses.',
          'PrOP matching now handles numeric IDs consistently across organizational levels.'
        ]
      }
    ]
  },
  {
    version: '3.1',
    date: 'October 2026',
    title: 'Faster workflows and more flexible exports',
    summary: 'Refinements since NGAT 3.0 make common pages faster, standard clauses easier to read, and audit reports and metrics easier to export.',
    sections: [
      {
        title: 'Conduct Audit and standards',
        items: [
          {
            text: 'Standard sections and unanswered subsections now stay collapsed until you need them.',
            children: [
              'Sections still show questions with saved work, even when the rest of the section is closed.',
              'Standard section titles are displayed when available from imported clause text.'
            ]
          },
          'Read more / Read less works outside the clipped text area.',
          'Lettered requirements and notes are formatted more clearly for easier reading.'
        ]
      },
      {
        title: 'Individual Audit PDF reports',
        items: [
          {
            text: 'Choose between Internal and External PDF exports.',
            children: [
              'Internal reports include all finding types.',
              'External reports include only nonconformities.'
            ]
          },
          'The export dialog matches the rest of NGAT, and report titles stay clean.'
        ]
      },
      {
        title: 'Metrics exports',
        items: [
          'Export individual metric charts as PNG images as well as Excel files.',
          'Export controls have a more consistent appearance.'
        ]
      },
      {
        title: 'Speed and responsiveness',
        items: [
          'The Home audit lookahead uses a smaller, dedicated data request.',
          'Metrics, Entry, and reports load less unnecessary data.',
          'Pages and lookup data load more selectively, with improved loading states.'
        ]
      },
      {
        title: 'Approvals and reliability',
        items: [
          'Improved handling of direct approval links.',
          'Refined mail configuration and diagnostics for deployment troubleshooting.',
          'Admin status filters better match the values displayed on screen.'
        ]
      }
    ]
  },
  {
    version: '3.0',
    date: 'October 2026',
    title: 'A more capable audit workflow',
    summary: 'The current NGAT experience brings major improvements to audit entry, findings, reporting, FOE, and the tools you use throughout the audit lifecycle.',
    sections: [
      {
        title: 'Audit scheduling & lifecycle',
        items: [
          {
            text: 'Schedule Entry now does more to keep organizational selections valid.',
            children: [
              'Program, Operating Unit, Division, and related hierarchy selections are checked when new or updated schedules are submitted.',
              'Older audits remain viewable even when their historical organization data does not match newer hierarchy rules.'
            ]
          },
          {
            text: 'Audits can now be cancelled, reactivated, or archived.',
            children: [
              'Cancelled audits leave your active to-do workflow but keep their history.',
              'Cancelled audits can be included again from report-page filters when you need them.',
              'Archived audits are removed from the normal NGAT experience while remaining preserved.'
            ]
          }
        ]
      },
      {
        title: 'Conduct Audit',
        items: [
          {
            text: 'A single question can now contain multiple separate responses or findings.',
            children: [
              'This works for standard questions, Every Time Questions, and PEQs.',
              'Each response remains distinct when you return to the audit or review it later.'
            ]
          },
          'Empty questions stay collapsed by default, while questions with saved work reopen automatically.',
          'Question and response layouts were cleaned up so larger audits are easier to scan and edit.'
        ]
      },
      {
        title: 'Reports & objective evidence',
        items: [
          'Individual Audit Reports now group responses beneath the question they belong to instead of flattening everything together.',
          'Reports and Excel exports better identify the question and response associated with each finding.',
          'Objective Evidence is easier to review with visible file lists and per-question ZIP downloads.',
          'Report pages can include cancelled audits when you explicitly choose to show them.'
        ]
      },
      {
        title: 'FOE',
        items: [
          'FOE Audits and FOE Download Audit Info are now native NGAT pages instead of separate embedded legacy screens.',
          {
            text: 'The native FOE audit workflow keeps the familiar legacy behavior.',
            children: [
              'Create audits, save incomplete drafts, reopen drafts, and review completed audits.',
              'Lead auditors retain the additional review/edit controls for their sites.',
              'FOE reporting includes filters and separate Audits and Findings Excel sheets.'
            ]
          },
          'Submitting or editing a completed FOE audit now notifies the assigned auditor by email.'
        ]
      },
      {
        title: 'Everyday tools & navigation',
        items: [
          'Audit Stages is now My Audit To-Do List, with quicker navbar access alongside Calendar and Metrics.',
          'Multi-select dropdowns stay open while you make several selections in a row.',
          'Calendar labels and several tool-page layouts were tightened up for easier scanning.',
          'Risk Analysis now supports saved comments and a cleaner viewing experience.'
        ]
      },
      {
        title: 'Notifications',
        items: [
          'Assigned auditors receive notifications when normal audits are created or updated.',
          'Cancelling an audit sends a dedicated cancellation notification to the assigned auditors.',
          'If an email fails after an audit action succeeds, NGAT warns you without undoing the audit change.'
        ]
      }
    ]
  },
  {
    version: '2.2',
    date: 'July 2026',
    title: 'FOE administration and access improvements',
    summary: 'A smaller release focused on FOE administration, Conduct Audit reliability, and clearer access behavior.',
    sections: [
      {
        title: 'Highlights',
        items: [
          'Added a native FOE Admin Menu for auditors, sites, audit areas, customers, divisions, and shifts.',
          'Improved FOE filtering and editing workflows.',
          'CUI access messages became more useful, including guidance on who to contact when access is needed.',
          'Improved reliability when loading Conduct Audit questions and user access information.'
        ]
      }
    ]
  },
  {
    version: '2.1',
    date: 'June 2026',
    title: 'Evidence and Conduct Audit polish',
    summary: 'Focused improvements to evidence handling and the audit-entry experience.',
    sections: [
      {
        title: 'Highlights',
        items: [
          'Added multi-file Objective Evidence uploads.',
          'Improved Objective Evidence ZIP downloads and handling of shared file locations.',
          'Refined collapsing behavior for standard questions and Every Time Questions.',
          'Improved nonconformity response and comment behavior during Conduct Audit.'
        ]
      }
    ]
  },
  {
    version: '2.0',
    date: '2026',
    title: 'Modern NGAT',
    summary: 'The React-based NGAT foundation that introduced the modern end-to-end audit experience.',
    sections: [
      {
        title: 'Highlights',
        items: [
          'Unified Audit Schedule, Planning, Conduct Audit, Nonconformities, and reporting in one application.',
          'Added approval workflows, reminder emails, Objective Evidence, and CUI-aware access controls.',
          'Added All My Audits, report pages, Metrics, Calendar, and Audit Status tools.',
          'Expanded the Admin Menu for maintaining auditors and core audit reference data.'
        ]
      }
    ]
  }
];

const VersionHistoryItem = ({ item }) => {
  if (typeof item === 'string') {
    return <li>{item}</li>;
  }

  return (
    <li>
      <span>{item.text}</span>
      {Array.isArray(item.children) && item.children.length > 0 ? (
        <ul className="version-history-subhighlights">
          {item.children.map((child) => (
            <li key={child}>{child}</li>
          ))}
        </ul>
      ) : null}
    </li>
  );
};

const VersionHistory = () => {
  return (
    <div className="entry-page version-history-page">
      <div className="entry-container version-history-container">
        <header className="version-history-hero">
          <p className="version-history-eyebrow">Help</p>
          <h1>Version History</h1>
          <p className="version-history-intro">
            A user-focused look at the changes that meaningfully affect how you work in NGAT.
          </p>
        </header>

        <div className="version-history-timeline">
          {releases.map((release) => (
            <section className="version-history-release" key={release.version}>
              <div className="version-history-marker" aria-hidden="true">
                <span />
              </div>

              <div className={`version-history-card${release.current ? ' is-current' : ''}`}>
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

                <div className="version-history-sections">
                  {release.sections.map((section) => (
                    <div className="version-history-section" key={section.title}>
                      <h3>{section.title}</h3>
                      <ul className="version-history-highlights">
                        {section.items.map((item, index) => (
                          <VersionHistoryItem
                            key={typeof item === 'string' ? item : `${section.title}-${index}`}
                            item={item}
                          />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VersionHistory;
