import React from 'react';
import AdminSelectionGrid from './AdminSelectionGrid';

const FoeDivisionsSection = ({
    actionOptions,
    selectedAction,
    onActionChange,
    isEditMode,
    isNewMode,
    includeArchived,
    onIncludeArchivedChange,
    divisions,
    editingDivision,
    onSelectDivision,
    divisionInput,
    onDivisionChange,
    fieldErrors,
    onSubmit,
    onArchiveToggle,
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
                        Add new divisions or update existing records.
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
                    {isEditMode && (
                        <label className="admin-include-archived">
                            <input
                                type="checkbox"
                                checked={includeArchived}
                                onChange={onIncludeArchivedChange}
                            />
                            Include archived divisions?
                        </label>
                    )}
                </div>
            </div>
        </div>
        {isEditMode && (
            <div className="admin-edit-table-wrapper">
                <p className="admin-editing-label">Select a division to edit</p>
                <AdminSelectionGrid
                    rows={divisions}
                    columns={[
                        { field: 'divisionName', headerName: 'Division', flex: 1.5, minWidth: 220 },
                        {
                            field: 'status',
                            headerName: 'Status',
                            flex: 0.9,
                            minWidth: 140,
                            sortable: false,
                            valueGetter: (_value, row) => (row.active === 1 ? 'Active' : 'Archived'),
                            renderCell: ({ row }) => (row.active === 1 ? 'Active' : 'Archived')
                        }
                    ]}
                    getRowId={(row) => row.divisionId}
                    selectedRowId={editingDivision?.divisionId}
                    onSelectRow={onSelectDivision}
                />
            </div>
        )}
        {isEditMode && editingDivision && (
            <p className="admin-editing-tag">
                Currently editing: {editingDivision.divisionName}
            </p>
        )}
        {(isNewMode || (isEditMode && editingDivision)) && (
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
                        {submitting
                            ? isEditMode
                                ? 'Submitting Changes...'
                                : 'Adding Division...'
                            : isEditMode
                                ? 'Submit Changes'
                                : 'Add Division'}
                    </button>
                    {isEditMode && editingDivision && (
                        <button
                            type="button"
                            onClick={onArchiveToggle}
                            disabled={submitting}
                            className={editingDivision.active === 1 ? 'admin-warning' : 'admin-info'}
                        >
                            {editingDivision.active === 1 ? 'Archive Division' : 'Reactivate Division'}
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
