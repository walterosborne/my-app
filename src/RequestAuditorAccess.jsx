import React, { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Entry.css';
import './App.css';
import './RequestAuditorAccess.css';
import { customStyles, formatRosterLabel } from './Utilities.jsx';
import { API_BASE, getCurrentUser, getDivisions, getRosterByIds } from './assets/data/apiData';

const RequestAuditorAccess = () => {
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState(null);
    const [rosterEntry, setRosterEntry] = useState(null);
    const [divisionsList, setDivisionsList] = useState([]);
    const [divisionId, setDivisionId] = useState(null);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requestSubmitted, setRequestSubmitted] = useState(false);

    useEffect(() => {
        async function loadUser() {
            try {
                const [userData, divisionsData] = await Promise.all([
                    getCurrentUser(),
                    getDivisions()
                ]);
                setUserInfo(userData);
                if (userData?.myId) {
                    const rosterData = await getRosterByIds([userData.myId]);
                    const match = rosterData.find((entry) => entry.myId === userData.myId)
                        || rosterData.find((entry) => entry.networkId === userData.networkId);
                    setRosterEntry(match || null);
                }
                setDivisionsList(divisionsData || []);
            } catch (error) {
                console.error('Error loading request access data:', error);
            } finally {
                setLoading(false);
            }
        }
        loadUser();
    }, []);

    const isAuditor = Boolean(userInfo?.auditorId);
    const displayName = rosterEntry
        ? formatRosterLabel(rosterEntry)
        : formatRosterLabel(userInfo?.name || '', userInfo?.myId || '');
    const displayEmail = rosterEntry?.email || '';

    const activeDivisions = useMemo(() => {
        return divisionsList
            .filter((division) => Number(division.active ?? 1) === 1)
            .slice()
            .sort((a, b) => (a.divisionName || '').localeCompare(b.divisionName || ''));
    }, [divisionsList]);

    const divisionOptions = useMemo(() => {
        return activeDivisions.map((division) => ({
            value: division.divisionId,
            label: division.divisionName
        }));
    }, [activeDivisions]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (isSubmitting || requestSubmitted) return;
        if (!divisionId || !reason.trim()) {
            event.currentTarget.reportValidity();
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE}/request-auditor-access`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    divisionId,
                    reason: reason.trim()
                })
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result?.error || 'Request failed.');
            }
            toast.success('Submitted!');
            if (result?.emailWarning) {
                toast.error(result.emailWarning);
            }
            setRequestSubmitted(true);
        } catch (error) {
            console.error('Error submitting access request:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="entry-page">
            <div className="entry-container">
                <div style={{ width: '100%', textAlign: 'left' }}>
                    <h1>Auditor Addition Request</h1>
                </div>
                {loading ? (
                    <div className="entry-message">
                        <p>Loading...</p>
                    </div>
                ) : isAuditor ? (
                    <div className="request-access-status request-access-status--success">
                        You are already listed as an auditor.
                    </div>
                ) : (
                    <form className="section request-access-section" onSubmit={handleSubmit}>
                        <div className="sectionrow">
                            <div className="fieldboxthird">
                                <label>Name</label>
                                <input className="textfield" value={displayName} readOnly disabled />
                            </div>
                            <div className="fieldboxthird">
                                <label>Email</label>
                                <input className="textfield" value={displayEmail} readOnly disabled />
                            </div>
                            <div className="fieldboxthird">
                                <label>Division<label style={{ color: 'red' }}>*</label></label>
                                <Select
                                    isClearable
                                    isDisabled={isSubmitting || requestSubmitted}
                                    options={divisionOptions}
                                    styles={customStyles}
                                    placeholder="Division"
                                    value={divisionId ? divisionOptions.find((option) => option.value === divisionId) : null}
                                    onChange={(selectedOption) => setDivisionId(selectedOption ? selectedOption.value : null)}
                                />
                                <input
                                    className="request-access-hidden-input"
                                    value={divisionId ?? ''}
                                    onChange={() => {}}
                                    required
                                    aria-hidden="true"
                                    tabIndex={-1}
                                />
                            </div>
                        </div>
                        <div className="sectionrow">
                            <div className="fieldboxwhole">
                                <label>Provide reasoning for your request.<label style={{ color: 'red' }}>*</label></label>
                                <textarea
                                    className="textfield request-access-textarea"
                                    rows={4}
                                    value={reason}
                                    onChange={(event) => setReason(event.target.value)}
                                    required
                                    disabled={isSubmitting || requestSubmitted}
                                />
                            </div>
                        </div>
                        <div className="request-access-actions">
                            <button className="button request-access-submit" type="submit" disabled={isSubmitting || requestSubmitted}>
                                {requestSubmitted ? 'Request Submitted' : isSubmitting ? 'Submitting Request...' : 'Submit Request'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default RequestAuditorAccess;
