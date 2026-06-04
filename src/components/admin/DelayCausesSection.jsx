import React from 'react';
import AdminSelectionGrid from './AdminSelectionGrid';

const DelayCausesSection = ({
    actionOptions,
    selectedAction,
    onActionChange,
    isDelayCauseEditMode,
    isDelayCauseNewMode,
    includeArchived,
    onIncludeArchivedChange,
    visibleDelayCauses,
    editingDelayCause,
    onSelectDelayCause,
    delayCauseInput,
    onDelayCauseInputChange,
    delayCauseFieldErrors,
    onSubmit,
    onArchiveToggle,
    onReset,
    submitting,
    delayCauseMessage,
    delayCauseError
}) => (
    <section className="admin-section">
        <div className="admin-section-header">
            <div className="admin-section-title">
                <div>
                    <h3>Delay Cause Management</h3>
                    <p className="admin-section-subhead">
                        Add new delay causes or refresh existing records.
                    </p>
                </div>
                <div className="admin-section-action-inline">
                    <div className="admin-action-select">
                        <label htmlFor="delay-cause-action" className="admin-label">
                            Action
                        </label>
                        <select
                            id="delay-cause-action"
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
                    {isDelayCauseEditMode && (
                        <label className="admin-include-archived">
                            <input
                                type="checkbox"
                                checked={includeArchived}
                                onChange={onIncludeArchivedChange}
                            />
                            Include archived delay causes?
                        </label>
                    )}
                </div>
            </div>
        </div>
        {isDelayCauseEditMode && (
            <div className="admin-edit-table-wrapper">
                <p className="admin-editing-label">Select a delay cause to edit</p>
                <AdminSelectionGrid
                    rows={visibleDelayCauses}
                    columns={[
                        { field: 'cause', headerName: 'Delay Cause', flex: 1.5, minWidth: 240 },
                        {
                            field: 'status',
                            headerName: 'Status',
                            flex: 1,
                            minWidth: 140,
                            sortable: false,
                            renderCell: ({ row }) => (row.active === 1 ? 'Active' : 'Archived')
                        }
                    ]}
                    getRowId={(row) => row.causeId}
                    selectedRowId={editingDelayCause?.causeId}
                    onSelectRow={onSelectDelayCause}
                />
            </div>
        )}
        {isDelayCauseEditMode && editingDelayCause && (
            <p className="admin-editing-tag">
                Currently editing: {editingDelayCause.cause}
            </p>
        )}
        {(isDelayCauseNewMode || (isDelayCauseEditMode && editingDelayCause)) && (
            <div className="admin-form">
                <div className="admin-form-row">
                    <label htmlFor="delay-cause-input" className="admin-label">
                        Delay Cause <span className="admin-required">*</span>
                    </label>
                    <input
                        id="delay-cause-input"
                        type="text"
                        className="admin-input"
                        placeholder="Enter delay cause"
                        value={delayCauseInput}
                        onChange={onDelayCauseInputChange}
                    />
                    {delayCauseFieldErrors.cause && (
                        <p className="admin-field-error">{delayCauseFieldErrors.cause}</p>
                    )}
                </div>
                <div className="admin-button-row">
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={submitting}
                        className="admin-primary"
                    >
                        {submitting
                            ? isDelayCauseEditMode
                                ? 'Submitting Changes...'
                                : 'Adding Delay Cause...'
                            : isDelayCauseEditMode
                                ? 'Submit Changes'
                                : 'Add Delay Cause'}
                    </button>
                    {isDelayCauseEditMode && editingDelayCause && (
                        <button
                            type="button"
                            onClick={onArchiveToggle}
                            disabled={submitting}
                            className={editingDelayCause.active === 1 ? 'admin-warning' : 'admin-info'}
                        >
                            {editingDelayCause.active === 1 ? 'Archive Delay Cause' : 'Reactivate Delay Cause'}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onReset}
                        className="admin-secondary"
                    >
                        Reset
                    </button>
                </div>
                {delayCauseMessage && (
                    <p className="admin-success">{delayCauseMessage}</p>
                )}
                {delayCauseError && (
                    <p className="admin-field-error" style={{ marginTop: '0.2rem' }}>
                        {delayCauseError}
                    </p>
                )}
            </div>
        )}
    </section>
);

export default DelayCausesSection;
