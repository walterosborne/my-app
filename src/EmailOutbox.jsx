import React from 'react';
import './Audit.css';

const EmailOutbox = () => {
    const [emails, setEmails] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        async function loadOutbox() {
            try {
                const response = await fetch('http://localhost:3001/api/email-outbox');
                if (!response.ok) {
                    throw new Error('Failed to load outbox');
                }
                const data = await response.json();
                setEmails(data);
                setLoading(false);
            } catch (err) {
                setError(err.message || 'Failed to load outbox');
                setLoading(false);
            }
        }
        loadOutbox();
    }, []);

    return (
        <div className="audit-page">
            <div className="audit-container">
                <h1>Approval Email Outbox</h1>
                <p style={{ marginTop: '0.5rem' }}>
                    Dev-only view of queued approval emails.
                </p>
                {loading && <div style={{ padding: '1rem 0' }}>Loading outbox...</div>}
                {error && <div style={{ padding: '1rem 0' }}>{error}</div>}
                {!loading && !error && emails.length === 0 && (
                    <div style={{ padding: '1rem 0' }}>No emails queued.</div>
                )}
                {!loading && !error && emails.length > 0 && (
                    <div style={{ marginTop: '1.5rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e0e0e0' }}>Sent To</th>
                                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e0e0e0' }}>Subject</th>
                                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e0e0e0' }}>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {emails.map((email) => (
                                    <tr key={email.emailId}>
                                        <td style={{ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid #f0f0f0' }}>
                                            {email.toAddress}
                                        </td>
                                        <td style={{ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid #f0f0f0' }}>
                                            {email.subject}
                                            <div style={{ marginTop: '8px', color: '#495057', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                                                {email.body}
                                            </div>
                                            <div style={{ marginTop: '12px', border: '1px solid #e0e0e0', borderRadius: '6px', padding: '12px', background: '#fafafa' }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2c3e50', marginBottom: '6px' }}>
                                                    Rendered HTML
                                                </div>
                                                <div dangerouslySetInnerHTML={{ __html: email.body }} />
                                            </div>
                                        </td>
                                        <td style={{ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid #f0f0f0' }}>
                                            {email.createdAt ? new Date(email.createdAt).toLocaleString() : ''}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailOutbox;
