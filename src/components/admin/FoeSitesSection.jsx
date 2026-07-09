import React from 'react';
import Select from 'react-select';
import { adminSelectStyles } from '../../Utilities.jsx';
import AdminSelectionGrid from './AdminSelectionGrid';

const FoeSitesSection = ({
    actionOptions,
    selectedAction,
    onActionChange,
    isEditMode,
    isNewMode,
    includeArchived,
    onIncludeArchivedChange,
    sites,
    editingSite,
    onSelectSite,
    siteInput,
    parentDivisionId,
    leadAuditorIds,
    auditorIds,
    divisionOptions,
    auditorOptions,
    onSiteChange,
    onParentDivisionChange,
    onLeadAuditorsChange,
    onAuditorsChange,
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
                    <h3>Site Management</h3>
                    <p className="admin-section-subhead">
                        Add new sites or update existing records.
                    </p>
                </div>
                <div className="admin-section-action-inline">
                    <div className="admin-action-select">
                        <label htmlFor="foe-site-action" className="admin-label">
                            Action
                        </label>
                        <select
                            id="foe-site-action"
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
                            Include archived sites?
                        </label>
                    )}
                </div>
            </div>
        </div>
        {isEditMode && (
            <div className="admin-edit-table-wrapper">
                <p className="admin-editing-label">Select a site to edit</p>
                <AdminSelectionGrid
                    rows={sites}
                    columns={[
                        { field: 'siteName', headerName: 'Site', flex: 1.4, minWidth: 220 },
                        {
                            field: 'status',
                            headerName: 'Status',
                            flex: 0.9,
                            minWidth: 140,
                            sortable: false,
                            renderCell: ({ row }) => (row.active === 1 ? 'Active' : 'Archived')
                        }
                    ]}
                    getRowId={(row) => row.siteId}
                    selectedRowId={editingSite?.siteId}
                    onSelectRow={onSelectSite}
                />
            </div>
        )}
        {isEditMode && editingSite && (
            <p className="admin-editing-tag">
                Currently editing: {editingSite.siteName}
            </p>
        )}
        {(isNewMode || (isEditMode && editingSite)) && (
            <div className="admin-form">
                <div className="admin-grid admin-grid-two-up">
                    <div className="admin-grid-item">
                        <label htmlFor="foe-site-input" className="admin-label">
                            Site <span className="admin-required">*</span>
                        </label>
                        <input
                            id="foe-site-input"
                            type="text"
                            className="admin-input"
                            placeholder="Enter site"
                            value={siteInput}
                            onChange={onSiteChange}
                        />
                        {fieldErrors.site && (
                            <p className="admin-field-error">{fieldErrors.site}</p>
                        )}
                    </div>
                    <div className="admin-grid-item">
                        <label className="admin-label">
                            Parent Division <span className="admin-required">*</span>
                        </label>
                        <Select
                            isClearable
                            options={divisionOptions}
                            styles={adminSelectStyles}
                            placeholder="Select parent division"
                            value={divisionOptions.find((option) => Number(option.value) === Number(parentDivisionId)) || null}
                            onChange={onParentDivisionChange}
                        />
                        {fieldErrors.parentDivisionId && (
                            <p className="admin-field-error">{fieldErrors.parentDivisionId}</p>
                        )}
                    </div>
                </div>
                <div className="admin-grid admin-grid-two-up">
                    <div className="admin-grid-item">
                        <label className="admin-label">
                            Leads
                        </label>
                        <Select
                            isMulti
                            isClearable
                            options={auditorOptions}
                            styles={adminSelectStyles}
                            placeholder="Select leads"
                            value={auditorOptions.filter((option) => leadAuditorIds.includes(option.value))}
                            onChange={onLeadAuditorsChange}
                        />
                    </div>
                    <div className="admin-grid-item">
                        <label className="admin-label">
                            Auditors
                        </label>
                        <Select
                            isMulti
                            isClearable
                            options={auditorOptions}
                            styles={adminSelectStyles}
                            placeholder="Select auditors"
                            value={auditorOptions.filter((option) => auditorIds.includes(option.value))}
                            onChange={onAuditorsChange}
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
                                : 'Adding Site...'
                            : isEditMode
                                ? 'Submit Changes'
                                : 'Add Site'}
                    </button>
                    {isEditMode && editingSite && (
                        <button
                            type="button"
                            onClick={onArchiveToggle}
                            disabled={submitting}
                            className={editingSite.active === 1 ? 'admin-warning' : 'admin-info'}
                        >
                            {editingSite.active === 1 ? 'Archive Site' : 'Reactivate Site'}
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

export default FoeSitesSection;
