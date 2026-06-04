import React from 'react';
import Select from 'react-select';
import { adminSelectStyles } from '../../Utilities.jsx';
import AdminSelectionGrid from './AdminSelectionGrid';

const AuditorsSection = ({
    actionOptions,
    selectedAction,
    onActionChange,
    isActiveEditMode,
    includeArchived,
    onIncludeArchivedChange,
    isEditMode,
    visibleAuditors,
    editingAuditor,
    onSelectAuditor,
    sortField,
    sortDirection,
    onSort,
    getDivisionName,
    isNewMode,
    showFields,
    myIdInput,
    onMyIdChange,
    fieldErrors,
    myIdWarning,
    manualEntry,
    onManualEntryChange,
    firstName,
    lastName,
    divisionId,
    cuiApproved,
    sortedDivisions,
    programOptions,
    selectedProgramIds,
    onFirstNameChange,
    onLastNameChange,
    onDivisionChange,
    onClearDivision,
    onCuiApprovedChange,
    onProgramChange,
    onSubmit,
    submitting,
    onArchiveToggle,
    onReset,
    submissionMessage,
    submissionError
}) => (
    <section className="admin-section">
        <div className="admin-section-header">
            <div className="admin-section-title">
                <div>
                    <h3>Auditor Management</h3>
                    <p className="admin-section-subhead">
                        Add new auditors or refresh existing records.
                    </p>
                </div>
                <div className="admin-section-action-inline">
                    <div className="admin-action-select">
                        <label htmlFor="action-dropdown" className="admin-label">
                            Action
                        </label>
                        <select
                            id="action-dropdown"
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
                    {isActiveEditMode && (
                        <label className="admin-include-archived">
                            <input
                                type="checkbox"
                                checked={includeArchived}
                                onChange={onIncludeArchivedChange}
                            />
                            Include archived?
                        </label>
                    )}
                </div>
            </div>
        </div>
        {isEditMode && (
            <div className="admin-edit-table-wrapper">
                <p className="admin-editing-label">Select an auditor to edit</p>
                <AdminSelectionGrid
                    rows={visibleAuditors}
                    columns={[
                        {
                            field: 'myId',
                            headerName: 'MyID',
                            flex: 1,
                            minWidth: 150,
                            renderCell: ({ row }) => row.myId ?? row.myid ?? ''
                        },
                        {
                            field: 'firstName',
                            headerName: 'First Name',
                            flex: 1,
                            minWidth: 160,
                            renderCell: ({ row }) => row.firstName
                                ?? (row.auditorName || '').split(',')[1]?.trim()
                                ?? ''
                        },
                        {
                            field: 'lastName',
                            headerName: 'Last Name',
                            flex: 1,
                            minWidth: 160,
                            renderCell: ({ row }) => row.lastName
                                ?? (row.auditorName || '').split(',')[0]?.trim()
                                ?? ''
                        },
                        {
                            field: 'division',
                            headerName: 'Division',
                            flex: 1.2,
                            minWidth: 200,
                            sortable: false,
                            renderCell: ({ row }) => getDivisionName(row.divisionId)
                        }
                    ]}
                    getRowId={(row) => row.auditorId}
                    selectedRowId={editingAuditor?.auditorId}
                    onSelectRow={onSelectAuditor}
                />
            </div>
        )}
        {isEditMode && editingAuditor && (
            <p className="admin-editing-tag">
                Currently editing: {editingAuditor.auditorName
                    ?? [editingAuditor.lastName, editingAuditor.firstName].filter(Boolean).join(', ')}
            </p>
        )}
        {(isNewMode || (isEditMode && editingAuditor)) && (
            <div className="admin-form">
                <div className="admin-form-row">
                    <label htmlFor="myid-input" className="admin-label">
                        MyID <span className="admin-required">*</span>
                    </label>
                    <input
                        id="myid-input"
                        type="text"
                        className="admin-input"
                        placeholder="Enter MyID"
                        value={myIdInput}
                        onChange={onMyIdChange}
                    />
                    {fieldErrors.myId && (
                        <p className="admin-field-error">{fieldErrors.myId}</p>
                    )}
                    {!fieldErrors.myId && myIdWarning && (
                        <p className="admin-field-error">{myIdWarning}</p>
                    )}
                </div>
                {isNewMode && (
                    <label className="admin-option-label">
                        <input
                            type="checkbox"
                            checked={manualEntry}
                            onChange={onManualEntryChange}
                        />
                        Manually enter details
                    </label>
                )}
                {showFields && (
                    <>
                        <div className="admin-grid admin-grid-two-up">
                            <div className="admin-grid-item">
                                <label htmlFor="first-name" className="admin-label">
                                    First Name <span className="admin-required">*</span>
                                </label>
                                <input
                                    id="first-name"
                                    type="text"
                                    className="admin-input"
                                    value={firstName}
                                    onChange={onFirstNameChange}
                                />
                                {fieldErrors.firstName && (
                                    <p className="admin-field-error">{fieldErrors.firstName}</p>
                                )}
                            </div>
                            <div className="admin-grid-item">
                                <label htmlFor="last-name" className="admin-label">
                                    Last Name <span className="admin-required">*</span>
                                </label>
                                <input
                                    id="last-name"
                                    type="text"
                                    className="admin-input"
                                    value={lastName}
                                    onChange={onLastNameChange}
                                />
                                {fieldErrors.lastName && (
                                    <p className="admin-field-error">{fieldErrors.lastName}</p>
                                )}
                            </div>
                        </div>
                        <div className="admin-grid admin-grid-three-up">
                            <div className="admin-grid-item">
                                <label htmlFor="division-select" className="admin-label">
                                    User Division <span className="admin-required">*</span>
                                </label>
                                <Select
                                    inputId="division-select"
                                    isClearable
                                    options={sortedDivisions.map((division) => ({
                                        value: division.divisionId,
                                        label: division.divisionName
                                    }))}
                                    styles={adminSelectStyles}
                                    placeholder="Select Division"
                                    value={sortedDivisions
                                        .filter((division) => Number(division.divisionId) === Number(divisionId))
                                        .map((division) => ({
                                            value: division.divisionId,
                                            label: division.divisionName
                                        }))[0] || null}
                                    onChange={(selectedOption) => onDivisionChange(selectedOption)}
                                />
                                {fieldErrors.divisionId && (
                                    <p className="admin-field-error">{fieldErrors.divisionId}</p>
                                )}
                            </div>
                            <div className="admin-grid-item">
                                <label className="admin-label">
                                    Assigned Programs
                                </label>
                                <Select
                                    isMulti
                                    isClearable
                                    options={programOptions}
                                    styles={adminSelectStyles}
                                    placeholder="Select Programs"
                                    value={programOptions.filter((option) => selectedProgramIds.includes(option.value))}
                                    onChange={onProgramChange}
                                />
                            </div>
                            <div className="admin-grid-item">
                                <label className="admin-label">
                                    CUI Approved
                                </label>
                                <label className="admin-option-label" style={{ marginTop: '0.65rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={cuiApproved}
                                        onChange={onCuiApprovedChange}
                                    />
                                    Auditor is approved for CUI audits
                                </label>
                            </div>
                        </div>
                    </>
                )}
                <div className="admin-button-row">
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={submitting || !showFields}
                        className="admin-primary"
                    >
                        {submitting
                            ? isEditMode
                                ? 'Submitting Changes...'
                                : 'Adding Auditor...'
                            : isEditMode
                                ? 'Submit Changes'
                                : 'Add Auditor'}
                    </button>
                    {isEditMode && editingAuditor && (
                        <button
                            type="button"
                            onClick={onArchiveToggle}
                            disabled={submitting}
                            className={editingAuditor.active === 1 ? 'admin-warning' : 'admin-info'}
                        >
                            {editingAuditor.active === 1 ? 'Archive Auditor' : 'Reactivate Auditor'}
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
                {submissionMessage && (
                    <p className="admin-success">{submissionMessage}</p>
                )}
                {submissionError && (
                    <p className="admin-field-error" style={{ marginTop: '0.2rem' }}>
                        {submissionError}
                    </p>
                )}
            </div>
        )}
    </section>
);

export default AuditorsSection;
