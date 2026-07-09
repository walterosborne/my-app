import React from 'react';
import Select from 'react-select';
import { adminSelectStyles } from '../../Utilities.jsx';
import AdminSelectionGrid from './AdminSelectionGrid';

const FoeAuditorsSection = ({
    actionOptions,
    selectedAction,
    onActionChange,
    isEditMode,
    isNewMode,
    includeArchived,
    onIncludeArchivedChange,
    auditors,
    editingAuditor,
    onSelectAuditor,
    getSiteNames,
    myIdInput,
    nameInput,
    approvedSiteIds,
    approvedSiteOptions,
    onMyIdChange,
    onNameChange,
    onApprovedSitesChange,
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
                    <h3>Auditor Management</h3>
                    <p className="admin-section-subhead">
                        Add new auditors or update existing records.
                    </p>
                </div>
                <div className="admin-section-action-inline">
                    <div className="admin-action-select">
                        <label htmlFor="foe-auditor-action" className="admin-label">
                            Action
                        </label>
                        <select
                            id="foe-auditor-action"
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
                            Include archived auditors?
                        </label>
                    )}
                </div>
            </div>
        </div>
        {isEditMode && (
            <div className="admin-edit-table-wrapper">
                <p className="admin-editing-label">Select an auditor to edit</p>
                <AdminSelectionGrid
                    rows={auditors}
                    columns={[
                        { field: 'myId', headerName: 'MyID', flex: 1, minWidth: 160 },
                        { field: 'name', headerName: 'Name', flex: 1.2, minWidth: 180 },
                        {
                            field: 'approvedSites',
                            headerName: 'Approved Sites',
                            flex: 1.8,
                            minWidth: 260,
                            sortable: false,
                            renderCell: ({ row }) => getSiteNames(row.approvedSiteIds)
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
                    getRowId={(row) => row.auditorId}
                    selectedRowId={editingAuditor?.auditorId}
                    onSelectRow={onSelectAuditor}
                />
            </div>
        )}
        {isEditMode && editingAuditor && (
            <p className="admin-editing-tag">
                Currently editing: {editingAuditor.name}
            </p>
        )}
        {(isNewMode || (isEditMode && editingAuditor)) && (
            <div className="admin-form">
                <div className="admin-grid admin-grid-two-up">
                    <div className="admin-grid-item">
                        <label htmlFor="foe-auditor-myid" className="admin-label">
                            MyID <span className="admin-required">*</span>
                        </label>
                        <input
                            id="foe-auditor-myid"
                            type="text"
                            className="admin-input"
                            placeholder="Enter MyID"
                            value={myIdInput}
                            onChange={onMyIdChange}
                        />
                        {fieldErrors.myId && (
                            <p className="admin-field-error">{fieldErrors.myId}</p>
                        )}
                    </div>
                    <div className="admin-grid-item">
                        <label htmlFor="foe-auditor-name" className="admin-label">
                            Name <span className="admin-required">*</span>
                        </label>
                        <input
                            id="foe-auditor-name"
                            type="text"
                            className="admin-input"
                            placeholder="Enter name"
                            value={nameInput}
                            onChange={onNameChange}
                        />
                        {fieldErrors.name && (
                            <p className="admin-field-error">{fieldErrors.name}</p>
                        )}
                    </div>
                </div>
                <div className="admin-form-row">
                    <label className="admin-label">
                        Approved Sites
                    </label>
                    <Select
                        isMulti
                        isClearable
                        options={approvedSiteOptions}
                        styles={adminSelectStyles}
                        placeholder="Select approved sites"
                        value={approvedSiteOptions.filter((option) => approvedSiteIds.includes(option.value))}
                        onChange={onApprovedSitesChange}
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

export default FoeAuditorsSection;
