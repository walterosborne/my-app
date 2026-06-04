import React from 'react';
import Select from 'react-select';
import { adminSelectStyles } from '../../Utilities.jsx';
import AdminSelectionGrid from './AdminSelectionGrid';

const ProgramsSection = ({
    actionOptions,
    selectedAction,
    onActionChange,
    isProgramEditMode,
    isProgramNewMode,
    includeArchived,
    onIncludeArchivedChange,
    visiblePrograms,
    editingProgram,
    onSelectProgram,
    getDivisionName,
    programInput,
    onProgramInputChange,
    programDivisionId,
    onDivisionChange,
    sortedDivisions,
    onClearDivision,
    auditorOptions,
    selectedAuditorIds,
    onAuditorChange,
    programFieldErrors,
    onSubmit,
    onArchiveToggle,
    onReset,
    submitting,
    programMessage,
    programError
}) => (
    <section className="admin-section">
        <div className="admin-section-header">
            <div className="admin-section-title">
                <div>
                    <h3>Program Management</h3>
                    <p className="admin-section-subhead">
                        Add new programs or refresh existing records.
                    </p>
                </div>
                <div className="admin-section-action-inline">
                    <div className="admin-action-select">
                        <label htmlFor="program-action" className="admin-label">
                            Action
                        </label>
                        <select
                            id="program-action"
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
                    {isProgramEditMode && (
                        <label className="admin-include-archived">
                            <input
                                type="checkbox"
                                checked={includeArchived}
                                onChange={onIncludeArchivedChange}
                            />
                            Include archived programs?
                        </label>
                    )}
                </div>
            </div>
        </div>
        {isProgramEditMode && (
            <div className="admin-edit-table-wrapper">
                <p className="admin-editing-label">Select a program to edit</p>
                <AdminSelectionGrid
                    rows={visiblePrograms}
                    columns={[
                        { field: 'programName', headerName: 'Program', flex: 1.4, minWidth: 220 },
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
                    getRowId={(row) => row.programId}
                    selectedRowId={editingProgram?.programId}
                    onSelectRow={onSelectProgram}
                />
            </div>
        )}
        {isProgramEditMode && editingProgram && (
            <p className="admin-editing-tag">
                Currently editing: {editingProgram.programName}
            </p>
        )}
        {(isProgramNewMode || (isProgramEditMode && editingProgram)) && (
            <div className="admin-form">
                <div className="admin-form-row">
                    <label htmlFor="program-input" className="admin-label">
                        Program <span className="admin-required">*</span>
                    </label>
                    <input
                        id="program-input"
                        type="text"
                        className="admin-input"
                        placeholder="Enter program"
                        value={programInput}
                        onChange={onProgramInputChange}
                    />
                    {programFieldErrors.programName && (
                        <p className="admin-field-error">{programFieldErrors.programName}</p>
                    )}
                </div>
                <div className="admin-form-row">
                    <label htmlFor="program-division" className="admin-label">
                        Parent Division <span className="admin-required">*</span>
                    </label>
                    <div className="admin-select-wrapper">
                        <select
                            id="program-division"
                            value={programDivisionId}
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
                        {programDivisionId && (
                            <button
                                type="button"
                                className="admin-clear-button"
                                onClick={onClearDivision}
                            >
                                &times;
                            </button>
                        )}
                    </div>
                    {programFieldErrors.divisionId && (
                        <p className="admin-field-error">{programFieldErrors.divisionId}</p>
                    )}
                </div>
                <div className="admin-form-row">
                    <label className="admin-label">
                        Assigned Auditors
                    </label>
                    <Select
                        isMulti
                        isClearable
                        options={auditorOptions}
                        styles={adminSelectStyles}
                        placeholder="Select Auditors"
                        value={auditorOptions.filter((option) => selectedAuditorIds.includes(option.value))}
                        onChange={onAuditorChange}
                    />
                </div>
                <div className="admin-button-row">
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={submitting}
                        className="admin-primary"
                    >
                        {submitting
                            ? isProgramEditMode
                                ? 'Submitting Changes...'
                                : 'Adding Program...'
                            : isProgramEditMode
                                ? 'Submit Changes'
                                : 'Add Program'}
                    </button>
                    {isProgramEditMode && editingProgram && (
                        <button
                            type="button"
                            onClick={onArchiveToggle}
                            disabled={submitting}
                            className={editingProgram.active === 1 ? 'admin-warning' : 'admin-info'}
                        >
                            {editingProgram.active === 1 ? 'Archive Program' : 'Reactivate Program'}
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
                {programMessage && (
                    <p className="admin-success">{programMessage}</p>
                )}
                {programError && (
                    <p className="admin-field-error" style={{ marginTop: '0.2rem' }}>
                        {programError}
                    </p>
                )}
            </div>
        )}
    </section>
);

export default ProgramsSection;
