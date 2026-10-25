import React from 'react';
import AdminSelectionGrid from './AdminSelectionGrid';
import { createStandard, getStandards, updateStandard } from '../../assets/data/apiData';

const STANDARD_SCOPE_OPTIONS = ['Internal', 'External'];
const MAX_STANDARD_NAME_LENGTH = 100;

const StandardsSection = ({ actionOptions, selectedAction, onActionChange }) => {
    const [standards, setStandards] = React.useState([]);
    const [selected, setSelected] = React.useState(null);
    const [standardName, setStandardName] = React.useState('');
    const [scope, setScope] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState('');
    const [message, setMessage] = React.useState('');

    const isEditMode = selectedAction === 'Edit';

    React.useEffect(() => {
        let mounted = true;
        getStandards()
            .then((rows) => {
                if (mounted) setStandards(Array.isArray(rows) ? rows : []);
            })
            .catch(() => {
                if (mounted) setError('Unable to load standards.');
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => { mounted = false; };
    }, []);

    React.useEffect(() => {
        setSelected(null);
        setStandardName('');
        setScope('');
        setError('');
        setMessage('');
    }, [selectedAction]);

    const resetForm = () => {
        setSelected(null);
        setStandardName('');
        setScope('');
        setError('');
        setMessage('');
    };

    const onSelectStandard = (row) => {
        setSelected(row);
        setStandardName(row.standardName || '');
        setScope(row.standardScope || '');
        setError('');
        setMessage('');
    };

    const save = async () => {
        const name = standardName.trim();
        if (isEditMode && !selected) {
            setError('Select a standard to edit.');
            return;
        }
        if (!name) {
            setError('Standard name is required.');
            return;
        }
        if (name.length > MAX_STANDARD_NAME_LENGTH) {
            setError('Standard name must be 100 characters or fewer.');
            return;
        }
        // Existing unclassified standards can be renamed without being reclassified.
        if (!STANDARD_SCOPE_OPTIONS.includes(scope) && !(isEditMode && !scope && !selected?.standardScope)) {
            setError('Choose Internal or External.');
            return;
        }
        const duplicate = standards.some((row) =>
            Number(row.standardId) !== Number(selected?.standardId) &&
            String(row.standardName || '').trim().toLowerCase() === name.toLowerCase()
        );
        if (duplicate) {
            setError('A standard with that name already exists.');
            return;
        }

        setSaving(true);
        setError('');
        setMessage('');
        try {
            const payload = { standardName: name, standardScope: scope || null };
            const saved = isEditMode
                ? await updateStandard(selected.standardId, payload)
                : await createStandard(payload);
            setStandards((previous) => isEditMode
                ? previous.map((row) => Number(row.standardId) === Number(saved.standardId) ? saved : row)
                : [...previous, saved]
            );
            if (isEditMode) {
                setSelected(saved);
                setStandardName(saved.standardName);
                setScope(saved.standardScope || '');
            } else {
                setSelected(null);
                setStandardName('');
                setScope('');
            }
            setMessage(isEditMode
                ? `${saved.standardName} updated successfully.`
                : `${saved.standardName} added successfully.`);
        } catch (saveError) {
            setError(saveError.message || 'Unable to save standard.');
        } finally {
            setSaving(false);
        }
    };

    const rows = React.useMemo(() => [...standards].sort((a, b) =>
        String(a.standardName || '').localeCompare(String(b.standardName || ''))
    ), [standards]);

    const unchanged = isEditMode && selected &&
        standardName.trim() === String(selected.standardName || '').trim() &&
        scope === (selected.standardScope || '');

    return (
        <section className="admin-section">
            <div className="admin-section-header">
                <div className="admin-section-title">
                    <div>
                        <h3>Standards Management</h3>
                        <p className="admin-section-subhead">
                            Add standards or update existing names and Internal/External classifications.
                            Existing audit references remain linked by standard ID.
                        </p>
                    </div>
                    <div className="admin-section-action-inline">
                        <div className="admin-action-select">
                            <label htmlFor="standard-action" className="admin-label">Action</label>
                            <select
                                id="standard-action"
                                className="admin-select admin-select-inline"
                                value={selectedAction}
                                onChange={onActionChange}
                                disabled={saving}
                            >
                                {actionOptions.map((action) => (
                                    <option key={action} value={action}>{action}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            {isEditMode && (loading ? (
                <p>Loading standards...</p>
            ) : (
                <div className="admin-edit-table-wrapper">
                    <p className="admin-editing-label">Select a standard to edit</p>
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
                        onSelectRow={onSelectStandard}
                    />
                </div>
            ))}
            {isEditMode && selected && (
                <p className="admin-editing-tag">Currently editing: {selected.standardName}</p>
            )}
            {(!isEditMode || selected) && (
                <div className="admin-form">
                    <div className="admin-form-row">
                        <label htmlFor="standard-name" className="admin-label">
                            Standard Name <span className="admin-required">*</span>
                        </label>
                        <input
                            id="standard-name"
                            className="admin-input"
                            type="text"
                            maxLength={MAX_STANDARD_NAME_LENGTH}
                            placeholder="Enter standard name"
                            value={standardName}
                            onChange={(event) => {
                                setStandardName(event.target.value);
                                setError('');
                                setMessage('');
                            }}
                            disabled={saving}
                        />
                    </div>
                    <div className="admin-form-row">
                        <label htmlFor="standard-scope" className="admin-label">
                            Classification {!isEditMode || selected?.standardScope ? (
                                <span className="admin-required">*</span>
                            ) : null}
                        </label>
                        <select
                            id="standard-scope"
                            className="admin-select"
                            value={scope}
                            onChange={(event) => {
                                setScope(event.target.value);
                                setError('');
                                setMessage('');
                            }}
                            disabled={saving}
                        >
                            <option value="" disabled={!isEditMode || Boolean(selected?.standardScope)}>
                                {isEditMode && !selected?.standardScope ? 'Unclassified' : 'Select classification'}
                            </option>
                            {STANDARD_SCOPE_OPTIONS.map((value) => (
                                <option value={value} key={value}>{value}</option>
                            ))}
                        </select>
                    </div>
                    <div className="admin-button-row">
                        <button
                            type="button"
                            className="admin-primary"
                            onClick={save}
                            disabled={saving || Boolean(unchanged) || loading}
                        >
                            {saving ? 'Saving...' : isEditMode ? 'Submit Changes' : 'Add Standard'}
                        </button>
                        <button
                            type="button"
                            className="admin-secondary"
                            onClick={resetForm}
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
