import React from 'react';
import AdminSelectionGrid from './AdminSelectionGrid';

const FoeShiftsSection = ({
    actionOptions,
    selectedAction,
    onActionChange,
    isEditMode,
    isNewMode,
    includeArchived,
    onIncludeArchivedChange,
    shifts,
    editingShift,
    onSelectShift,
    shiftInput,
    onShiftChange,
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
                    <h3>Shift Management</h3>
                    <p className="admin-section-subhead">
                        Add new shifts or update existing records.
                    </p>
                </div>
                <div className="admin-section-action-inline">
                    <div className="admin-action-select">
                        <label htmlFor="foe-shift-action" className="admin-label">
                            Action
                        </label>
                        <select
                            id="foe-shift-action"
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
                            Include archived shifts?
                        </label>
                    )}
                </div>
            </div>
        </div>
        {isEditMode && (
            <div className="admin-edit-table-wrapper">
                <p className="admin-editing-label">Select a shift to edit</p>
                <AdminSelectionGrid
                    rows={shifts}
                    columns={[
                        { field: 'shiftName', headerName: 'Shift', flex: 1.5, minWidth: 220 },
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
                    getRowId={(row) => row.shiftId}
                    selectedRowId={editingShift?.shiftId}
                    onSelectRow={onSelectShift}
                />
            </div>
        )}
        {isEditMode && editingShift && (
            <p className="admin-editing-tag">
                Currently editing: {editingShift.shiftName}
            </p>
        )}
        {(isNewMode || (isEditMode && editingShift)) && (
            <div className="admin-form">
                <div className="admin-form-row">
                    <label htmlFor="foe-shift-input" className="admin-label">
                        Shift <span className="admin-required">*</span>
                    </label>
                    <input
                        id="foe-shift-input"
                        type="text"
                        className="admin-input"
                        placeholder="Enter shift"
                        value={shiftInput}
                        onChange={onShiftChange}
                    />
                    {fieldErrors.shift && (
                        <p className="admin-field-error">{fieldErrors.shift}</p>
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
                                : 'Adding Shift...'
                            : isEditMode
                                ? 'Submit Changes'
                                : 'Add Shift'}
                    </button>
                    {isEditMode && editingShift && (
                        <button
                            type="button"
                            onClick={onArchiveToggle}
                            disabled={submitting}
                            className={editingShift.active === 1 ? 'admin-warning' : 'admin-info'}
                        >
                            {editingShift.active === 1 ? 'Archive Shift' : 'Reactivate Shift'}
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

export default FoeShiftsSection;
