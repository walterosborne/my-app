import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './Entry.css';
import './AuditStatuses.css';
import { normalizeDisplayLabel } from './Utilities.jsx';
import { getAuditsAll, getAuditors, getCurrentUser, getPrograms, getSites } from './assets/data/apiData';

const getSiteLabel = (site) => {
  if (!site) return '';
  const city = site.city || '';
  const address = site.address || '';
  if (city && address) {
    return `${city} (${address})`;
  }
  if (city) {
    return city;
  }
  return address || site.siteId;
};

const AuditStatuses = () => {
  const [loading, setLoading] = useState(true);
  const [audits, setAudits] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [auditorsList, setAuditorsList] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [sitesList, setSitesList] = useState([]);
  const [includeCompleted, setIncludeCompleted] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [auditsData, userData, auditors, programs, sites] = await Promise.all([
          getAuditsAll(true),
          getCurrentUser(),
          getAuditors(),
          getPrograms(),
          getSites()
        ]);
        setAudits(auditsData);
        setCurrentUser(userData);
        setAuditorsList(auditors);
        setProgramsList(programs);
        setSitesList(sites);
      } catch (error) {
        console.error('Error loading audit statuses:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const formatSingle = (id, lookupList, idKey, nameKey) => {
    if (!id) return '';
    const item = lookupList.find((entry) => entry[idKey] === id);
    return normalizeDisplayLabel(item ? item[nameKey] : id);
  };

  const formatArray = (ids, lookupList, idKey, nameKey, separator = ', ') => {
    if (!ids || ids.length === 0) return '';
    return ids.map((id) => {
      const item = lookupList.find((entry) => entry[idKey] === id);
      return normalizeDisplayLabel(item ? item[nameKey] : id);
    }).join(separator);
  };

  const formatSiteArray = (ids) => {
    if (!ids || ids.length === 0) return '';
    return ids.map((id) => {
      const site = sitesList.find((entry) => entry.siteId === id);
      return site ? getSiteLabel(site) : id;
    }).join(', ');
  };

  const getStageLabel = (audit) => {
    const stage = Number(audit?.stage);
    if (stage === -1) return 'Historical';
    if (audit?.approvedAt) return 'Approved';
    if (Number(audit?.locked) === 1) return 'Pending Approval';
    switch (stage) {
      case 1:
        return 'Planning';
      case 2:
        return 'Conduct Audit';
      case 3:
        return 'Nonconformities';
      case 4:
        return 'Nonconformities';
      default:
        return 'Unknown Stage';
    }
  };

  const getStageTone = (label) => {
    if (label === 'Approved') return 'approved';
    if (label === 'Pending Approval') return 'pending';
    return 'default';
  };

  const isAuditCompleted = (audit) => {
    return Boolean(audit?.approvedAt ?? audit?.approvedat);
  };

  const sortedAudits = useMemo(() => {
    return [...audits].sort((a, b) => Number(b.scheduleId) - Number(a.scheduleId));
  }, [audits]);

  const auditorAudits = useMemo(() => {
    if (!currentUser?.auditorId) return [];
    const auditorId = Number(currentUser.auditorId);
    return sortedAudits.filter((audit) => {
      if (!includeCompleted && isAuditCompleted(audit)) {
        return false;
      }
      const additionalIds = Array.isArray(audit.additionalAuditorIds) ? audit.additionalAuditorIds : [];
      return audit.leadAuditorId === auditorId || additionalIds.includes(auditorId);
    });
  }, [sortedAudits, currentUser, includeCompleted]);

  const approvalAudits = useMemo(() => {
    if (!currentUser) return [];
    const myId = currentUser.myId || null;
    const auditorId = currentUser.auditorId ? Number(currentUser.auditorId) : null;
    return sortedAudits.filter((audit) => {
      const completed = isAuditCompleted(audit);
      if (!includeCompleted && completed) {
        return false;
      }
      const isApprovalStage = Number(audit.locked) === 1 || completed;
      if (!isApprovalStage) return false;
      const approverIds = Array.isArray(audit.additionalApprovers)
        ? audit.additionalApprovers
        : [];
      const hasApproverRole = myId != null && (audit.approver === myId || approverIds.includes(myId));
      const isLeadAuditor = auditorId != null && Number(audit.leadAuditorId) === auditorId;
      return hasApproverRole || isLeadAuditor;
    });
  }, [sortedAudits, currentUser, includeCompleted]);

  const renderAuditCard = (audit) => {
    const stageLabel = getStageLabel(audit);
    const additionalAuditors = formatArray(audit.additionalAuditorIds, auditorsList, 'auditorId', 'auditorName', '; ');
    return (
      <Link to={`/audit/${audit.scheduleId}`} className="audit-status-card-link">
        <div className="audit-status-card">
          <div className="audit-status-card-header">
            <div>
              <div className="audit-status-id">Schedule ID: {audit.scheduleId}</div>
              <div className="audit-status-title">{audit.title || 'Untitled Audit'}</div>
            </div>
            <span className={`audit-status-chip ${getStageTone(stageLabel)}`}>{stageLabel}</span>
          </div>
          <div className="audit-status-details">
            <div className="audit-status-field">
              <span className="audit-status-label">Lead Auditor</span>
              <span className="audit-status-value">
                {formatSingle(audit.leadAuditorId, auditorsList, 'auditorId', 'auditorName') || 'No response provided'}
              </span>
            </div>
            <div className="audit-status-field">
              <span className="audit-status-label">Additional Auditors</span>
              <span className="audit-status-value">{additionalAuditors || 'None'}</span>
            </div>
            <div className="audit-status-field">
              <span className="audit-status-label">Programs</span>
              <span className="audit-status-value">
                {formatArray(audit.programIds, programsList, 'programId', 'programName') || 'None'}
              </span>
            </div>
            <div className="audit-status-field">
              <span className="audit-status-label">Sites</span>
              <span className="audit-status-value">{formatSiteArray(audit.siteIds) || 'None'}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="entry-page">
        <div className="entry-container">
          <div className="entry-message">Loading audit statuses...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="entry-page">
      <div className="entry-container">
        <div className="audit-statuses-header tool-page-header">
          <div>
            <p className="tool-page-subtitle">Tools · Audit Statuses</p>
            <h2 className="audit-statuses-title">Audit Statuses</h2>
            <p className="audit-statuses-subtitle">
              Track your audits and any approvals that are currently awaiting your review.
            </p>
          </div>
          <label className="audit-statuses-toggle">
            <input
              type="checkbox"
              checked={includeCompleted}
              onChange={(event) => setIncludeCompleted(event.target.checked)}
            />
            Include completed audits
          </label>
        </div>
        <div className="audit-statuses-sections">
          <div className="audit-statuses-section">
            <div className="audit-statuses-section-header">
              <h3>Audits You Are Assigned To</h3>
              <span className="audit-statuses-count">{auditorAudits.length}</span>
            </div>
            {auditorAudits.length === 0 ? (
              <div className="audit-statuses-empty">No audits assigned yet.</div>
            ) : (
              <div className="audit-statuses-grid">
                {auditorAudits.map(renderAuditCard)}
              </div>
            )}
          </div>

          <div className="audit-statuses-section">
            <div className="audit-statuses-section-header">
              <h3>Approvals Requested</h3>
              <span className="audit-statuses-count">{approvalAudits.length}</span>
            </div>
            {approvalAudits.length === 0 ? (
              <div className="audit-statuses-empty">No approvals requested.</div>
            ) : (
              <div className="audit-statuses-grid">
                {approvalAudits.map(renderAuditCard)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditStatuses;
