import React from 'react';
import AdminSelectionGrid from './AdminSelectionGrid';

const FoeDivisionsSection = ({
    actionOptions,
    selectedAction,
    onActionChange,
    isNewMode,
    isArchiveMode,
    divisions,
    selectedDivision,
    onSelectDivision,
    divisionInput,
    onDivisionChange,
    fieldErrors,
    onSubmit,
    onArchive,
    onReset,
    submitting,
    message,
    error
}) => (
    <section className="admin-section">
        <div className="admin-section-header">
            <div className="admin-section-title">
                <div>
                    <h3>Division Management</h3>
                    <p className="admin-section-subhead">
                        Add new divisions or archive existing records.
                    </p>
                </div>
                <div className="admin-section-action-inline">
                    <div className="admin-action-select">
                        <label htmlFor="foe-division-action" className="admin-label">
                            Action
                        </label>
                        <select
                            id="foe-division-action"
                            value={selectedAction}
                            onChange={onActionChange}
                            className="admin-select admin-select-inline"
                        >
                            {actionOptions.map((action) => (
                                <option key={action} value={action}>
                                    {action}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
        {isArchiveMode && (
            <div className="admin-edit-table-wrapper">
                <p className="admin-editing-label">Select a division to archive</p>
                <AdminSelectionGrid
                    rows={divisions}
                    columns={[
                        { field: 'divisionName', headerName: 'Division', flex: 1.5, minWidth: 220 }
                    ]}
                    getRowId={(row) => row.divisionId}
                    selectedRowId={selectedDivision?.divisionId}
                    onSelectRow={onSelectDivision}
                />
            </div>
        )}
        {isArchiveMode && selectedDivision && (
            <p className="admin-editing-tag">
                Currently selected: {selectedDivision.divisionName}
            </p>
        )}
        {isNewMode && (
            <div className="admin-form">
                <div className="admin-form-row">
                    <label htmlFor="foe-division-input" className="admin-label">
                        Division <span className="admin-required">*</span>
                    </label>
                    <input
                        id="foe-division-input"
                        type="text"
                        className="admin-input"
                        placeholder="Enter division"
                        value={divisionInput}
                        onChange={onDivisionChange}
                    />
                    {fieldErrors.division && (
                        <p className="admin-field-error">{fieldErrors.division}</p>
                    )}
                </div>
                <div className="admin-button-row">
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={submitting}
                        className="admin-primary"
                    >
                        {submitting ? 'Adding Division...' : 'Add Division'}
                    </button>
                    <button
                        type="button"
                        onClick={onReset}
                        className="admin-secondary"
                    >
                        Reset
                    </button>
                </div>
                {message && (
                    <p className="admin-success">{message}</p>
                )}
                {error && (
                    <p className="admin-field-error" style={{ marginTop: '0.2rem' }}>
                        {error}
                    </p>
                )}
            </div>
        )}
        {isArchiveMode && selectedDivision && (
            <div className="admin-form" style={{ marginTop: 0 }}>
                <div className="admin-button-row">
                    <button
                        type="button"
                        onClick={onArchive}
                        disabled={submitting}
                        className="admin-warning"
                    >
                        {submitting ? 'Archiving Division...' : 'Archive Division'}
                    </button>
                    <button
                        type="button"
                        onClick={onReset}
                        className="admin-secondary"
                    >
                        Reset
                    </button>
                </div>
                {message && (
                    <p className="admin-success">{message}</p>
                )}
                {error && (
                    <p className="admin-field-error" style={{ marginTop: '0.2rem' }}>
                        {error}
                    </p>
                )}
            </div>
        )}
    </section>
);

export default FoeDivisionsSection;
