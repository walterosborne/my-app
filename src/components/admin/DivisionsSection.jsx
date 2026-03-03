import React from 'react';

const DivisionsSection = ({
    actionOptions,
    selectedAction,
    onActionChange,
    isDivisionEditMode,
    isDivisionNewMode,
    includeArchived,
    onIncludeArchivedChange,
    visibleDivisions,
    editingDivision,
    onSelectDivision,
    getSectorName,
    divisionInput,
    onDivisionInputChange,
    divisionSectorId,
    onSectorChange,
    sortedSectors,
    onClearSector,
    divisionFieldErrors,
    onSubmit,
    onArchiveToggle,
    onReset,
    submitting,
    divisionMessage,
    divisionError
}) => (
    <section className="admin-section">
        <div className="admin-section-header">
            <div className="admin-section-title">
                <div>
                    <h3>Division Management</h3>
                    <p className="admin-section-subhead">
                        Add new divisions or refresh existing records.
                    </p>
                </div>
                <div className="admin-section-action-inline">
                    <div className="admin-action-select">
                        <label htmlFor="division-action" className="admin-label">
                            Action
                        </label>
                        <select
                            id="division-action"
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
                    {isDivisionEditMode && (
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
        {isDivisionEditMode && (
            <div className="admin-edit-table-wrapper">
                <p className="admin-editing-label">Select a division to edit</p>
                <div className="admin-edit-table-scroll">
                    <table className="admin-edit-table">
                        <thead>
                            <tr>
                                <th>Division</th>
                                <th>Sector</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleDivisions.map((division) => {
                                const isSelected = editingDivision?.divisionId === division.divisionId;
                                const isArchived = (division.active ?? 1) === 0;
                                return (
                                    <tr
                                        key={division.divisionId}
                                        className={[
                                            isSelected ? 'selected' : '',
                                            isArchived ? 'archived' : ''
                                        ]
                                            .filter(Boolean)
                                            .join(' ')}
                                        onClick={() => onSelectDivision(division)}
                                    >
                                        <td>{division.divisionName}</td>
                                        <td>{getSectorName(division.sectorId)}</td>
                                        <td>{division.active === 1 ? 'Active' : 'Archived'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
        {isDivisionEditMode && editingDivision && (
            <p className="admin-editing-tag">
                Currently editing: {editingDivision.divisionName}
            </p>
        )}
        {(isDivisionNewMode || (isDivisionEditMode && editingDivision)) && (
            <div className="admin-form">
                <div className="admin-form-row">
                    <label htmlFor="division-input" className="admin-label">
                        Division <span className="admin-required">*</span>
                    </label>
                    <input
                        id="division-input"
                        type="text"
                        className="admin-input"
                        placeholder="Enter division"
                        value={divisionInput}
                        onChange={onDivisionInputChange}
                    />
                    {divisionFieldErrors.divisionName && (
                        <p className="admin-field-error">{divisionFieldErrors.divisionName}</p>
                    )}
                </div>
                <div className="admin-form-row">
                    <label htmlFor="division-sector" className="admin-label">
                        Parent Sector <span className="admin-required">*</span>
                    </label>
                    <div className="admin-select-wrapper">
                        <select
                            id="division-sector"
                            value={divisionSectorId}
                            onChange={onSectorChange}
                            className="admin-input"
                        >
                            <option value="" disabled hidden>
                                Select Sector
                            </option>
                            {sortedSectors.map((sector) => (
                                <option key={sector.sectorId} value={sector.sectorId}>
                                    {sector.sectorName}
                                </option>
                            ))}
                        </select>
                        {divisionSectorId && (
                            <button
                                type="button"
                                className="admin-clear-button"
                                onClick={onClearSector}
                            >
                                &times;
                            </button>
                        )}
                    </div>
                    {divisionFieldErrors.sectorId && (
                        <p className="admin-field-error">{divisionFieldErrors.sectorId}</p>
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
                            ? isDivisionEditMode
                                ? 'Submitting Changes...'
                                : 'Adding Division...'
                            : isDivisionEditMode
                                ? 'Submit Changes'
                                : 'Add Division'}
                    </button>
                    {isDivisionEditMode && editingDivision && (
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
                {divisionMessage && (
                    <p className="admin-success">{divisionMessage}</p>
                )}
                {divisionError && (
                    <p className="admin-field-error" style={{ marginTop: '0.2rem' }}>
                        {divisionError}
                    </p>
                )}
            </div>
        )}
    </section>
);

export default DivisionsSection;
