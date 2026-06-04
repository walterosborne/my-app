import React from 'react';
import AdminSelectionGrid from './AdminSelectionGrid';

const SafetyEquipmentSection = ({
    actionOptions,
    selectedAction,
    onActionChange,
    isSafetyEquipmentEditMode,
    isSafetyEquipmentNewMode,
    includeArchived,
    onIncludeArchivedChange,
    visibleSafetyEquipment,
    editingSafetyEquipment,
    onSelectSafetyEquipment,
    safetyEquipmentInput,
    onSafetyEquipmentInputChange,
    safetyEquipmentFieldErrors,
    onSubmit,
    onArchiveToggle,
    onReset,
    submitting,
    safetyEquipmentMessage,
    safetyEquipmentError
}) => (
    <section className="admin-section">
        <div className="admin-section-header">
            <div className="admin-section-title">
                <div>
                    <h3>Safety Equipment Management</h3>
                    <p className="admin-section-subhead">
                        Add new safety equipment or refresh existing records.
                    </p>
                </div>
                <div className="admin-section-action-inline">
                    <div className="admin-action-select">
                        <label htmlFor="safety-equipment-action" className="admin-label">
                            Action
                        </label>
                        <select
                            id="safety-equipment-action"
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
                    {isSafetyEquipmentEditMode && (
                        <label className="admin-include-archived">
                            <input
                                type="checkbox"
                                checked={includeArchived}
                                onChange={onIncludeArchivedChange}
                            />
                            Include archived safety equipment?
                        </label>
                    )}
                </div>
            </div>
        </div>
        {isSafetyEquipmentEditMode && (
            <div className="admin-edit-table-wrapper">
                <p className="admin-editing-label">Select safety equipment to edit</p>
                <AdminSelectionGrid
                    rows={visibleSafetyEquipment}
                    columns={[
                        { field: 'safetyEquipmentName', headerName: 'Safety Equipment', flex: 1.5, minWidth: 240 },
                        {
                            field: 'status',
                            headerName: 'Status',
                            flex: 1,
                            minWidth: 140,
                            sortable: false,
                            renderCell: ({ row }) => (row.active === 1 ? 'Active' : 'Archived')
                        }
                    ]}
                    getRowId={(row) => row.safetyEquipmentId}
                    selectedRowId={editingSafetyEquipment?.safetyEquipmentId}
                    onSelectRow={onSelectSafetyEquipment}
                />
            </div>
        )}
        {isSafetyEquipmentEditMode && editingSafetyEquipment && (
            <p className="admin-editing-tag">
                Currently editing: {editingSafetyEquipment.safetyEquipmentName}
            </p>
        )}
        {(isSafetyEquipmentNewMode || (isSafetyEquipmentEditMode && editingSafetyEquipment)) && (
            <div className="admin-form">
                <div className="admin-form-row">
                    <label htmlFor="safety-equipment-input" className="admin-label">
                        Safety Equipment <span className="admin-required">*</span>
                    </label>
                    <input
                        id="safety-equipment-input"
                        type="text"
                        className="admin-input"
                        placeholder="Enter safety equipment"
                        value={safetyEquipmentInput}
                        onChange={onSafetyEquipmentInputChange}
                    />
                    {safetyEquipmentFieldErrors.safetyEquipmentName && (
                        <p className="admin-field-error">{safetyEquipmentFieldErrors.safetyEquipmentName}</p>
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
                            ? isSafetyEquipmentEditMode
                                ? 'Submitting Changes...'
                                : 'Adding Safety Equipment...'
                            : isSafetyEquipmentEditMode
                                ? 'Submit Changes'
                                : 'Add Safety Equipment'}
                    </button>
                    {isSafetyEquipmentEditMode && editingSafetyEquipment && (
                        <button
                            type="button"
                            onClick={onArchiveToggle}
                            disabled={submitting}
                            className={editingSafetyEquipment.active === 1 ? 'admin-warning' : 'admin-info'}
                        >
                            {editingSafetyEquipment.active === 1 ? 'Archive Safety Equipment' : 'Reactivate Safety Equipment'}
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
                {safetyEquipmentMessage && (
                    <p className="admin-success">{safetyEquipmentMessage}</p>
                )}
                {safetyEquipmentError && (
                    <p className="admin-field-error" style={{ marginTop: '0.2rem' }}>
                        {safetyEquipmentError}
                    </p>
                )}
            </div>
        )}
    </section>
);

export default SafetyEquipmentSection;
