import React from 'react';
import AdminSelectionGrid from './AdminSelectionGrid';
import { getStandards, updateStandardScope } from '../../assets/data/apiData';

// Existing standards are classified here; standard names and their clause text
// are managed independently. NULL is kept visible until explicitly classified.
const StandardsSection = () => {
    const [standards, setStandards] = React.useState([]);
    const [selected, setSelected] = React.useState(null);
    const [scope, setScope] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState('');
    const [message, setMessage] = React.useState('');

    React.useEffect(() => {
        let mounted = true;
        getStandards()
            .then((rows) => { if (mounted) setStandards(Array.isArray(rows) ? rows : []); })
            .catch(() => { if (mounted) setError('Unable to load standards.'); })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, []);

    const onSelect = (row) => {
        setSelected(row);
        setScope(row.standardScope || '');
        setError('');
        setMessage('');
    };

    const save = async () => {
        if (!selected || !['Internal', 'External'].includes(scope)) {
            setError('Choose Internal or External before saving.');
            return;
        }
        setSaving(true);
        setError('');
        setMessage('');
        try {
            const updated = await updateStandardScope(selected.standardId, scope);
            setStandards((previous) => previous.map((row) =>
                Number(row.standardId) === Number(updated.standardId) ? updated : row
            ));
            setSelected(updated);
            setMessage(`${updated.standardName} marked ${updated.standardScope}.`);
        } catch (saveError) {
            setError(saveError.message || 'Unable to save classification.');
        } finally {
            setSaving(false);
        }
    };

    const rows = React.useMemo(() => [...standards].sort((a, b) =>
        String(a.standardName || '').localeCompare(String(b.standardName || ''))
    ), [standards]);

    return (
        <section className="admin-section">
            <div className="admin-section-header">
                <div className="admin-section-title">
                    <div>
                        <h3>Standards Management</h3>
                        <p className="admin-section-subhead">
                            Classify existing standards as Internal or External. Unclassified standards
                            remain available in audits until they are assigned a classification.
                        </p>
                    </div>
                </div>
            </div>
            {loading ? <p>Loading standards...</p> : (
                <div className="admin-edit-table-wrapper">
                    <p className="admin-editing-label">Select a standard to classify</p>
                    <AdminSelectionGrid
                        rows={rows}
                        columns={[
                            { field: 'standardName', headerName: 'Standard', flex: 2, minWidth: 220 },
                            {
                                field: 'standardScope',
                                headerName: 'Classification',
                                flex: 1,
                                minWidth: 160,
                                valueGetter: (_value, row) => row.standardScope || 'Unclassified'
                            }
                        ]}
                        getRowId={(row) => row.standardId}
                        selectedRowId={selected?.standardId}
                        onSelectRow={onSelect}
                    />
                </div>
            )}
            {selected && (
                <div className="admin-form">
                    <p className="admin-editing-tag">Currently editing: {selected.standardName}</p>
                    <div className="admin-form-row">
                        <label className="admin-label" htmlFor="standard-scope">
                            Classification <span className="admin-required">*</span>
                        </label>
                        <select
                            id="standard-scope"
                            className="admin-select"
                            value={scope}
                            onChange={(event) => { setScope(event.target.value); setMessage(''); setError(''); }}
                        >
                            <option value="" disabled>Choose classification</option>
                            <option value="Internal">Internal</option>
                            <option value="External">External</option>
                        </select>
                    </div>
                    <div className="admin-button-row">
                        <button
                            type="button"
                            className="admin-primary"
                            disabled={saving || scope === (selected.standardScope || '') || !scope}
                            onClick={save}
                        >
                            {saving ? 'Saving...' : 'Save Classification'}
                        </button>
                        <button
                            type="button"
                            className="admin-secondary"
                            onClick={() => { setSelected(null); setScope(''); setError(''); setMessage(''); }}
                            disabled={saving}
                        >
                            Reset
                        </button>
                    </div>
                </div>
            )}
            {message && <p className="admin-success">{message}</p>}
            {error && <p className="admin-field-error">{error}</p>}
        </section>
    );
};

export default StandardsSection;
