import React from 'react';

const AuditTypesSection = ({
    actionOptions,
    selectedAction,
    onActionChange,
    isAuditTypeEditMode,
    isAuditTypeNewMode,
    includeArchived,
    onIncludeArchivedChange,
    visibleAuditTypes,
    editingAuditType,
    onSelectAuditType,
    auditTypeInput,
    onAuditTypeInputChange,
    auditTypeFieldErrors,
    onSubmit,
    onArchiveToggle,
    onReset,
    submitting,
    auditTypeMessage,
    auditTypeError
}) => (
    <section className="admin-section">
        <div className="admin-section-header">
            <div className="admin-section-title">
                <div>
                    <h3>Audit Type Management</h3>
                    <p className="admin-section-subhead">
                        Add new audit types or refresh existing records.
                    </p>
                </div>
                <div className="admin-section-action-inline">
                    <div className="admin-action-select">
                        <label htmlFor="audit-type-action" className="admin-label">
                            Action
                        </label>
                        <select
                            id="audit-type-action"
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
                    {isAuditTypeEditMode && (
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
        {isAuditTypeEditMode && (
            <div className="admin-edit-table-wrapper">
                <p className="admin-editing-label">Select an audit type to edit</p>
                <div className="admin-edit-table-scroll">
                    <table className="admin-edit-table">
                        <thead>
                            <tr>
                                <th>Audit Type</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleAuditTypes.map((type) => {
                                const isSelected = editingAuditType?.auditTypeId === type.auditTypeId;
                                const isArchived = (type.active ?? 1) === 0;
                                return (
                                    <tr
                                        key={type.auditTypeId}
                                        className={[
                                            isSelected ? 'selected' : '',
                                            isArchived ? 'archived' : ''
                                        ]
                                            .filter(Boolean)
                                            .join(' ')}
                                        onClick={() => onSelectAuditType(type)}
                                    >
                                        <td>{type.auditTypeName}</td>
                                        <td>{type.active === 1 ? 'Active' : 'Archived'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
        {isAuditTypeEditMode && editingAuditType && (
            <p className="admin-editing-tag">
                Currently editing: {editingAuditType.auditTypeName}
            </p>
        )}
        {(isAuditTypeNewMode || (isAuditTypeEditMode && editingAuditType)) && (
            <div className="admin-form">
                <div className="admin-form-row">
                    <label htmlFor="audit-type-input" className="admin-label">
                        Audit Type <span className="admin-required">*</span>
                    </label>
                    <input
                        id="audit-type-input"
                        type="text"
                        className="admin-input"
                        placeholder="Enter audit type"
                        value={auditTypeInput}
                        onChange={onAuditTypeInputChange}
                    />
                    {auditTypeFieldErrors.auditTypeName && (
                        <p className="admin-field-error">{auditTypeFieldErrors.auditTypeName}</p>
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
                            ? isAuditTypeEditMode
                                ? 'Submitting Changes...'
                                : 'Adding Audit Type...'
                            : isAuditTypeEditMode
                                ? 'Submit Changes'
                                : 'Add Audit Type'}
                    </button>
                    {isAuditTypeEditMode && editingAuditType && (
                        <button
                            type="button"
                            onClick={onArchiveToggle}
                            disabled={submitting}
                            className={editingAuditType.active === 1 ? 'admin-warning' : 'admin-info'}
                        >
                            {editingAuditType.active === 1 ? 'Archive Audit Type' : 'Reactivate Audit Type'}
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
                {auditTypeMessage && (
                    <p className="admin-success">{auditTypeMessage}</p>
                )}
                {auditTypeError && (
                    <p className="admin-field-error" style={{ marginTop: '0.2rem' }}>
                        {auditTypeError}
                    </p>
                )}
            </div>
        )}
    </section>
);

export default AuditTypesSection;
