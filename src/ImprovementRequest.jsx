import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Entry.css';
import './App.css';
import './RequestAuditorAccess.css';
import './ImprovementRequest.css';
import { API_BASE, getCurrentUser } from './assets/data/apiData';

const IMPROVEMENT_TYPE_OPTIONS = [
    { value: 'Enhancement', label: 'Enhancement' },
    { value: 'Bug Report', label: 'Bug Report' },
    { value: 'Feature Request', label: 'Feature Request' },
    { value: 'Other', label: 'Other' }
];

const ImprovementRequest = () => {
    const [loading, setLoading] = useState(true);
    const [improvementType, setImprovementType] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requestSubmitted, setRequestSubmitted] = useState(false);

    useEffect(() => {
        async function loadUser() {
            try {
                await getCurrentUser();
            } catch (error) {
                console.error('Error loading improvement request data:', error);
            } finally {
                setLoading(false);
            }
        }

        loadUser();
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (isSubmitting || requestSubmitted) return;
        if (!improvementType || !reason.trim()) {
            event.currentTarget.reportValidity();
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE}/submit-improvement`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    improvementType,
                    reason: reason.trim()
                })
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result?.error || 'Submission failed.');
            }
            toast.success('Submitted!');
            if (result?.emailWarning) {
                toast.error(result.emailWarning);
            }
            setRequestSubmitted(true);
        } catch (error) {
            console.error('Error submitting improvement request:', error);
            toast.error(error.message || 'Submission failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="entry-page">
            <div className="entry-container">
                <div style={{ width: '100%', textAlign: 'left' }}>
                    <h1>Improvement Submission</h1>
                </div>
                {loading ? (
                    <div className="entry-message">
                        <p>Loading...</p>
                    </div>
                ) : (
                    <form className="section request-access-section" onSubmit={handleSubmit}>
                        <div className="sectionrow">
                            <div className="fieldboxwhole">
                                <label>Type of improvement<label style={{ color: 'red' }}>*</label></label>
                                <div className="improvement-request-radio-group" role="radiogroup" aria-label="Type of improvement">
                                    {IMPROVEMENT_TYPE_OPTIONS.map((option) => (
                                        <label key={option.value} className="improvement-request-radio-option">
                                            <input
                                                type="radio"
                                                name="improvementType"
                                                value={option.value}
                                                checked={improvementType === option.value}
                                                onChange={(event) => setImprovementType(event.target.value)}
                                                disabled={isSubmitting || requestSubmitted}
                                                required
                                            />
                                            <span>{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="sectionrow">
                            <div className="fieldboxwhole">
                                <label>Describe the improvement and why it should be made.<label style={{ color: 'red' }}>*</label></label>
                                <textarea
                                    className="textfield request-access-textarea"
                                    rows={5}
                                    value={reason}
                                    onChange={(event) => setReason(event.target.value)}
                                    required
                                    disabled={isSubmitting || requestSubmitted}
                                />
                            </div>
                        </div>
                        <div className="request-access-actions">
                            <button className="button request-access-submit" type="submit" disabled={isSubmitting || requestSubmitted}>
                                {requestSubmitted ? 'Request Submitted' : isSubmitting ? 'Submitting Request...' : 'Submit Improvement'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ImprovementRequest;
