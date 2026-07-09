import React from 'react';
import AdminSelectionGrid from './AdminSelectionGrid';

const FoeAuditAreasSection = ({
    actionOptions,
    selectedAction,
    onActionChange,
    isEditMode,
    isNewMode,
    includeArchived,
    onIncludeArchivedChange,
    auditAreas,
    editingAuditArea,
    onSelectAuditArea,
    getSiteLabelById,
    nameInput,
    parentSiteId,
    teamInput,
    managerInput,
    onNameChange,
    onParentSiteChange,
    onClearParentSite,
    onTeamChange,
    onManagerChange,
    sortedSites,
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
                    <h3>Audit Area Management</h3>
                    <p className="admin-section-subhead">
                        Add new audit areas or update existing records.
                    </p>
                </div>
                <div className="admin-section-action-inline">
                    <div className="admin-action-select">
                        <label htmlFor="foe-audit-area-action" className="admin-label">
                            Action
                        </label>
                        <select
                            id="foe-audit-area-action"
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
                            Include archived audit areas?
                        </label>
                    )}
                </div>
            </div>
        </div>
        {isEditMode && (
            <div className="admin-edit-table-wrapper">
                <p className="admin-editing-label">Select an audit area to edit</p>
                <AdminSelectionGrid
                    rows={auditAreas}
                    columns={[
                        { field: 'name', headerName: 'Name', flex: 1.2, minWidth: 180 },
                        {
                            field: 'parentSite',
                            headerName: 'Parent Site',
                            flex: 1.4,
                            minWidth: 220,
                            sortable: false,
                            renderCell: ({ row }) => getSiteLabelById(row.parentSiteId)
                        },
                        { field: 'team', headerName: 'Team', flex: 1, minWidth: 160 },
                        { field: 'manager', headerName: 'Manager', flex: 1, minWidth: 180 },
                        {
                            field: 'status',
                            headerName: 'Status',
                            flex: 0.9,
                            minWidth: 140,
                            sortable: false,
                            renderCell: ({ row }) => (row.active === 1 ? 'Active' : 'Archived')
                        }
                    ]}
                    getRowId={(row) => row.auditAreaId}
                    selectedRowId={editingAuditArea?.auditAreaId}
                    onSelectRow={onSelectAuditArea}
                />
            </div>
        )}
        {isEditMode && editingAuditArea && (
            <p className="admin-editing-tag">
                Currently editing: {editingAuditArea.name}
            </p>
        )}
        {(isNewMode || (isEditMode && editingAuditArea)) && (
            <div className="admin-form">
                <div className="admin-grid admin-grid-two-up">
                    <div className="admin-grid-item">
                        <label htmlFor="foe-audit-area-name" className="admin-label">
                            Name <span className="admin-required">*</span>
                        </label>
                        <input
                            id="foe-audit-area-name"
                            type="text"
                            className="admin-input"
                            placeholder="Enter audit area name"
                            value={nameInput}
                            onChange={onNameChange}
                        />
                        {fieldErrors.name && (
                            <p className="admin-field-error">{fieldErrors.name}</p>
                        )}
                    </div>
                    <div className="admin-grid-item">
                        <label htmlFor="foe-audit-area-parent-site" className="admin-label">
                            Parent Site <span className="admin-required">*</span>
                        </label>
                        <div className="admin-select-wrapper">
                            <select
                                id="foe-audit-area-parent-site"
                                value={parentSiteId}
                                onChange={onParentSiteChange}
                                className="admin-input"
                            >
                                <option value="" disabled hidden>
                                    Select Parent Site
                                </option>
                                {sortedSites.map((site) => (
                                    <option key={site.siteId} value={site.siteId}>
                                        {getSiteLabelById(site.siteId)}
                                    </option>
                                ))}
                            </select>
                            {parentSiteId && (
                                <button
                                    type="button"
                                    className="admin-clear-button"
                                    onClick={onClearParentSite}
                                >
                                    &times;
                                </button>
                            )}
                        </div>
                        {fieldErrors.parentSiteId && (
                            <p className="admin-field-error">{fieldErrors.parentSiteId}</p>
                        )}
                    </div>
                </div>
                <div className="admin-grid admin-grid-two-up">
                    <div className="admin-grid-item">
                        <label htmlFor="foe-audit-area-team" className="admin-label">
                            Team
                        </label>
                        <input
                            id="foe-audit-area-team"
                            type="text"
                            className="admin-input"
                            placeholder="Enter team"
                            value={teamInput}
                            onChange={onTeamChange}
                        />
                    </div>
                    <div className="admin-grid-item">
                        <label htmlFor="foe-audit-area-manager" className="admin-label">
                            Manager
                        </label>
                        <input
                            id="foe-audit-area-manager"
                            type="text"
                            className="admin-input"
                            placeholder="Enter manager"
                            value={managerInput}
                            onChange={onManagerChange}
                        />
                    </div>
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
                                : 'Adding Audit Area...'
                            : isEditMode
                                ? 'Submit Changes'
                                : 'Add Audit Area'}
                    </button>
                    {isEditMode && editingAuditArea && (
                        <button
                            type="button"
                            onClick={onArchiveToggle}
                            disabled={submitting}
                            className={editingAuditArea.active === 1 ? 'admin-warning' : 'admin-info'}
                        >
                            {editingAuditArea.active === 1 ? 'Archive Audit Area' : 'Reactivate Audit Area'}
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

export default FoeAuditAreasSection;
