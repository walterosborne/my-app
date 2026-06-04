import React from 'react';
import AdminSelectionGrid from './AdminSelectionGrid';

const BusinessUnitsSection = ({
    actionOptions,
    selectedAction,
    onActionChange,
    isBusinessUnitEditMode,
    isBusinessUnitNewMode,
    includeArchived,
    onIncludeArchivedChange,
    visibleBusinessUnits,
    editingBusinessUnit,
    onSelectBusinessUnit,
    getDivisionName,
    businessUnitInput,
    onBusinessUnitInputChange,
    businessUnitDivisionId,
    onDivisionChange,
    sortedDivisions,
    onClearDivision,
    businessUnitFieldErrors,
    onSubmit,
    onArchiveToggle,
    onReset,
    submitting,
    businessUnitMessage,
    businessUnitError
}) => (
    <section className="admin-section">
        <div className="admin-section-header">
            <div className="admin-section-title">
                <div>
                    <h3>Business Unit Management</h3>
                    <p className="admin-section-subhead">
                        Add new business units or refresh existing records.
                    </p>
                </div>
                <div className="admin-section-action-inline">
                    <div className="admin-action-select">
                        <label htmlFor="business-unit-action" className="admin-label">
                            Action
                        </label>
                        <select
                            id="business-unit-action"
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
                    {isBusinessUnitEditMode && (
                        <label className="admin-include-archived">
                            <input
                                type="checkbox"
                                checked={includeArchived}
                                onChange={onIncludeArchivedChange}
                            />
                            Include archived business units?
                        </label>
                    )}
                </div>
            </div>
        </div>
        {isBusinessUnitEditMode && (
            <div className="admin-edit-table-wrapper">
                <p className="admin-editing-label">Select a business unit to edit</p>
                <AdminSelectionGrid
                    rows={visibleBusinessUnits}
                    columns={[
                        { field: 'businessUnitName', headerName: 'Business Unit', flex: 1.4, minWidth: 220 },
                        {
                            field: 'division',
                            headerName: 'Division',
                            flex: 1.1,
                            minWidth: 180,
                            sortable: false,
                            renderCell: ({ row }) => getDivisionName(row.divisionId)
                        },
                        {
                            field: 'status',
                            headerName: 'Status',
                            flex: 0.9,
                            minWidth: 140,
                            sortable: false,
                            renderCell: ({ row }) => (row.active === 1 ? 'Active' : 'Archived')
                        }
                    ]}
                    getRowId={(row) => row.businessUnitId}
                    selectedRowId={editingBusinessUnit?.businessUnitId}
                    onSelectRow={onSelectBusinessUnit}
                />
            </div>
        )}
        {isBusinessUnitEditMode && editingBusinessUnit && (
            <p className="admin-editing-tag">
                Currently editing: {editingBusinessUnit.businessUnitName}
            </p>
        )}
        {(isBusinessUnitNewMode || (isBusinessUnitEditMode && editingBusinessUnit)) && (
            <div className="admin-form">
                <div className="admin-form-row">
                    <label htmlFor="business-unit-input" className="admin-label">
                        Business Unit <span className="admin-required">*</span>
                    </label>
                    <input
                        id="business-unit-input"
                        type="text"
                        className="admin-input"
                        placeholder="Enter business unit"
                        value={businessUnitInput}
                        onChange={onBusinessUnitInputChange}
                    />
                    {businessUnitFieldErrors.businessUnitName && (
                        <p className="admin-field-error">{businessUnitFieldErrors.businessUnitName}</p>
                    )}
                </div>
                <div className="admin-form-row">
                    <label htmlFor="business-unit-division" className="admin-label">
                        Parent Division <span className="admin-required">*</span>
                    </label>
                    <div className="admin-select-wrapper">
                        <select
                            id="business-unit-division"
                            value={businessUnitDivisionId}
                            onChange={onDivisionChange}
                            className="admin-input"
                        >
                            <option value="" disabled hidden>
                                Select Division
                            </option>
                            {sortedDivisions.map((division) => (
                                <option key={division.divisionId} value={division.divisionId}>
                                    {division.divisionName}
                                </option>
                            ))}
                        </select>
                        {businessUnitDivisionId && (
                            <button
                                type="button"
                                className="admin-clear-button"
                                onClick={onClearDivision}
                            >
                                &times;
                            </button>
                        )}
                    </div>
                    {businessUnitFieldErrors.divisionId && (
                        <p className="admin-field-error">{businessUnitFieldErrors.divisionId}</p>
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
                            ? isBusinessUnitEditMode
                                ? 'Submitting Changes...'
                                : 'Adding Business Unit...'
                            : isBusinessUnitEditMode
                                ? 'Submit Changes'
                                : 'Add Business Unit'}
                    </button>
                    {isBusinessUnitEditMode && editingBusinessUnit && (
                        <button
                            type="button"
                            onClick={onArchiveToggle}
                            disabled={submitting}
                            className={editingBusinessUnit.active === 1 ? 'admin-warning' : 'admin-info'}
                        >
                            {editingBusinessUnit.active === 1 ? 'Archive Business Unit' : 'Reactivate Business Unit'}
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
                {businessUnitMessage && (
                    <p className="admin-success">{businessUnitMessage}</p>
                )}
                {businessUnitError && (
                    <p className="admin-field-error" style={{ marginTop: '0.2rem' }}>
                        {businessUnitError}
                    </p>
                )}
            </div>
        )}
    </section>
);

export default BusinessUnitsSection;
