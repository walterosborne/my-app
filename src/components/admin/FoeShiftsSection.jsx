import React from 'react';
import AdminSelectionGrid from './AdminSelectionGrid';

const FoeShiftsSection = ({
    actionOptions,
    selectedAction,
    onActionChange,
    isNewMode,
    isArchiveMode,
    shifts,
    selectedShift,
    onSelectShift,
    shiftInput,
    onShiftChange,
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
                    <h3>Shift Management</h3>
                    <p className="admin-section-subhead">
                        Add new shifts or archive existing records.
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
                </div>
            </div>
        </div>
        {isArchiveMode && (
            <div className="admin-edit-table-wrapper">
                <p className="admin-editing-label">Select a shift to archive</p>
                <AdminSelectionGrid
                    rows={shifts}
                    columns={[
                        { field: 'shiftName', headerName: 'Shift', flex: 1.5, minWidth: 220 }
                    ]}
                    getRowId={(row) => row.shiftId}
                    selectedRowId={selectedShift?.shiftId}
                    onSelectRow={onSelectShift}
                />
            </div>
        )}
        {isArchiveMode && selectedShift && (
            <p className="admin-editing-tag">
                Currently selected: {selectedShift.shiftName}
            </p>
        )}
        {isNewMode && (
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
                        {submitting ? 'Adding Shift...' : 'Add Shift'}
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
        {isArchiveMode && selectedShift && (
            <div className="admin-form" style={{ marginTop: 0 }}>
                <div className="admin-button-row">
                    <button
                        type="button"
                        onClick={onArchive}
                        disabled={submitting}
                        className="admin-warning"
                    >
                        {submitting ? 'Archiving Shift...' : 'Archive Shift'}
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

export default FoeShiftsSection;
