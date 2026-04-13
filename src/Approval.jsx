import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Audit.css';
import { buildApiUrl } from './assets/data/apiData';

const Approval = () => {
    const { scheduleId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = React.useState(true);
    const [approvalInfo, setApprovalInfo] = React.useState(null);
    const [error, setError] = React.useState(null);
    const [submittingApproval, setSubmittingApproval] = React.useState(false);

    React.useEffect(() => {
        async function loadApprovalInfo() {
            try {
                const response = await fetch(buildApiUrl(`approvals/${scheduleId}`));
                if (!response.ok) {
                    throw new Error('Approval not found');
                }
                const data = await response.json();
                setApprovalInfo(data);
                setLoading(false);
            } catch (err) {
                setError(err.message || 'Failed to load approval info');
                setLoading(false);
            }
        }
        loadApprovalInfo();
    }, [scheduleId]);

    const handleApprove = async () => {
        if (submittingApproval) return;
        setSubmittingApproval(true);
        try {
            const response = await fetch(buildApiUrl(`approvals/${scheduleId}/approve`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) {
                throw new Error('Unable to approve this audit');
            }
            const data = await response.json();
            toast.success(data.approved ? 'Approval complete. Audit is now approved.' : 'Approval recorded.');
            const refresh = await fetch(buildApiUrl(`approvals/${scheduleId}`));
            if (refresh.ok) {
                const updated = await refresh.json();
                setApprovalInfo(updated);
            }
        } catch (err) {
            toast.error(err.message || 'Approval failed');
        } finally {
            setSubmittingApproval(false);
        }
    };

    if (loading) {
        return (
            <div className="audit-page">
                <div className="audit-container">
                    <div style={{ padding: '2rem', textAlign: 'center' }}>Loading approval...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="audit-page">
                <div className="audit-container">
                    <div style={{ padding: '2rem', textAlign: 'center' }}>{error}</div>
                </div>
            </div>
        );
    }

    const audit = approvalInfo?.audit;
    const isApproved = Boolean(audit?.approvedat);
    const canApprove = approvalInfo?.canApprove;
    const alreadyApprovedByUser = Boolean(approvalInfo?.currentApproval?.approvedat);
    const auditorEmails = approvalInfo?.auditorEmails || [];
    const rejectionMailto = auditorEmails.length
        ? `mailto:${auditorEmails.join(',')}?subject=${encodeURIComponent(`Audit ${scheduleId} Rejection`)}&body=${encodeURIComponent('I am a listed approver and I am rejecting the audit because ')}`
        : '';

    return (
        <div className="audit-page">
            <div className="audit-container">
                {!canApprove ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                        You are not listed as an approver for this audit.
                        <div style={{ marginTop: '1rem' }}>
                            <button
                                className="button"
                                onClick={() => navigate('/')}
                                style={{ backgroundColor: '#0066cc', width: '200px' }}
                            >
                                Return Home
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                        <h1>Audit Approval</h1>
                        <p style={{ marginTop: '0.5rem' }}>
                            <strong>Audit:</strong> {audit?.title || 'Untitled Audit'}<br />
                            <strong>Schedule ID:</strong> {audit?.scheduleid}
                        </p>
                        <p style={{ marginTop: '1rem' }}>
                            {isApproved ? 'This audit has already been approved.' : 'Please review the audit and submit your approval.'}
                        </p>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                            <button
                                className="button"
                                onClick={() => navigate(`/audit/${scheduleId}`)}
                                style={{ backgroundColor: '#0066cc', width: '220px' }}
                            >
                                Review Audit
                            </button>
                            <button
                                className="button"
                                onClick={handleApprove}
                                disabled={isApproved || alreadyApprovedByUser || submittingApproval}
                                style={{ backgroundColor: !alreadyApprovedByUser ? '#0b7a3b' : 'grey', width: '220px' }}
                            >
                                {alreadyApprovedByUser ? 'Approval Already Submitted' : submittingApproval ? 'Submitting Approval...' : 'Approve Audit'}
                            </button>
                            <button
                                className="button"
                                onClick={() => rejectionMailto && window.open(rejectionMailto, '_blank', 'noopener,noreferrer')}
                                disabled={!rejectionMailto}
                                style={{ backgroundColor: rejectionMailto ? '#c62828' : 'grey', width: '220px' }}
                            >
                                Reject Audit
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Approval;
