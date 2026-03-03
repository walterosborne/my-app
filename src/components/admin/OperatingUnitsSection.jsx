import React from 'react';

const OperatingUnitsSection = ({
    actionOptions,
    selectedAction,
    onActionChange,
    isOperatingUnitEditMode,
    isOperatingUnitNewMode,
    includeArchived,
    onIncludeArchivedChange,
    visibleOperatingUnits,
    editingOperatingUnit,
    onSelectOperatingUnit,
    operatingUnitInput,
    onOperatingUnitInputChange,
    operatingUnitDivisionId,
    onDivisionChange,
    sortedDivisions,
    onClearDivision,
    operatingUnitFieldErrors,
    onSubmit,
    onArchiveToggle,
    onReset,
    submitting,
    operatingUnitMessage,
    operatingUnitError,
    getDivisionName
}) => (
    <section className="admin-section">
        <div className="admin-section-header">
            <div className="admin-section-title">
                <div>
                    <h3>Operating Unit Management</h3>
                    <p className="admin-section-subhead">
                        Add new operating units or refresh existing records.
                    </p>
                </div>
                <div className="admin-section-action-inline">
                    <div className="admin-action-select">
                        <label htmlFor="operating-unit-action" className="admin-label">
                            Action
                        </label>
                        <select
                            id="operating-unit-action"
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
                    {isOperatingUnitEditMode && (
                        <label className="admin-include-archived">
                            <input
                                type="checkbox"
                                checked={includeArchived}
                                onChange={onIncludeArchivedChange}
                            />
                            Include archived operating units?
                        </label>
                    )}
                </div>
            </div>
        </div>
        {isOperatingUnitEditMode && (
            <div className="admin-edit-table-wrapper">
                <p className="admin-editing-label">Select an operating unit to edit</p>
                <div className="admin-edit-table-scroll">
                    <table className="admin-edit-table">
                        <thead>
                            <tr>
                                <th>Operating Unit</th>
                                <th>Division</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleOperatingUnits.map((unit) => {
                                const isSelected = editingOperatingUnit?.operatingUnitId === unit.operatingUnitId;
                                const isArchived = (unit.active ?? 1) === 0;
                                return (
                                    <tr
                                        key={unit.operatingUnitId}
                                        className={[
                                            isSelected ? 'selected' : '',
                                            isArchived ? 'archived' : ''
                                        ]
                                            .filter(Boolean)
                                            .join(' ')}
                                        onClick={() => onSelectOperatingUnit(unit)}
                                    >
                                        <td>{unit.operatingUnitName}</td>
                                        <td>{getDivisionName(unit.divisionId)}</td>
                                        <td>{unit.active === 1 ? 'Active' : 'Archived'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
        {isOperatingUnitEditMode && editingOperatingUnit && (
            <p className="admin-editing-tag">
                Currently editing: {editingOperatingUnit.operatingUnitName}
            </p>
        )}
        {(isOperatingUnitNewMode || (isOperatingUnitEditMode && editingOperatingUnit)) && (
            <div className="admin-form">
                <div className="admin-form-row">
                    <label htmlFor="operating-unit-input" className="admin-label">
                        Operating Unit <span className="admin-required">*</span>
                    </label>
                    <input
                        id="operating-unit-input"
                        type="text"
                        className="admin-input"
                        placeholder="Enter operating unit"
                        value={operatingUnitInput}
                        onChange={onOperatingUnitInputChange}
                    />
                    {operatingUnitFieldErrors.operatingUnitName && (
                        <p className="admin-field-error">{operatingUnitFieldErrors.operatingUnitName}</p>
                    )}
                </div>
                <div className="admin-form-row">
                    <label htmlFor="operating-unit-division" className="admin-label">
                        Parent Division <span className="admin-required">*</span>
                    </label>
                    <div className="admin-select-wrapper">
                        <select
                            id="operating-unit-division"
                            value={operatingUnitDivisionId}
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
                        {operatingUnitDivisionId && (
                            <button
                                type="button"
                                className="admin-clear-button"
                                onClick={onClearDivision}
                            >
                                &times;
                            </button>
                        )}
                    </div>
                    {operatingUnitFieldErrors.divisionId && (
                        <p className="admin-field-error">{operatingUnitFieldErrors.divisionId}</p>
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
                            ? isOperatingUnitEditMode
                                ? 'Submitting Changes...'
                                : 'Adding Operating Unit...'
                            : isOperatingUnitEditMode
                                ? 'Submit Changes'
                                : 'Add Operating Unit'}
                    </button>
                    {isOperatingUnitEditMode && editingOperatingUnit && (
                        <button
                            type="button"
                            onClick={onArchiveToggle}
                            disabled={submitting}
                            className={editingOperatingUnit.active === 1 ? 'admin-warning' : 'admin-info'}
                        >
                            {editingOperatingUnit.active === 1 ? 'Archive Operating Unit' : 'Reactivate Operating Unit'}
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
                {operatingUnitMessage && (
                    <p className="admin-success">{operatingUnitMessage}</p>
                )}
                {operatingUnitError && (
                    <p className="admin-field-error" style={{ marginTop: '0.2rem' }}>
                        {operatingUnitError}
                    </p>
                )}
            </div>
        )}
    </section>
);

export default OperatingUnitsSection;
