import React from 'react';

const PropsSection = ({
    actionOptions,
    selectedAction,
    onActionChange,
    isPropEditMode,
    isPropNewMode,
    includeArchived,
    onIncludeArchivedChange,
    visibleProps,
    editingProp,
    onSelectProp,
    propTypeOptions,
    propTypeId,
    onPropTypeChange,
    propTargetOptions,
    propTargetId,
    propTargetLabel,
    onPropTargetChange,
    propInput,
    onPropInputChange,
    fieldErrors,
    onSubmit,
    onArchiveToggle,
    onReset,
    submitting,
    message,
    error,
    getPropTypeLabel,
    getPropTargetLabel
}) => (
    <section className="admin-section">
        <div className="admin-section-header">
            <div className="admin-section-title">
                <div>
                    <h3>PrOP Management</h3>
                    <p className="admin-section-subhead">
                        Add new PrOP entries or refresh existing records.
                    </p>
                </div>
                <div className="admin-section-action-inline">
                    <div className="admin-action-select">
                        <label htmlFor="prop-action" className="admin-label">
                            Action
                        </label>
                        <select
                            id="prop-action"
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
                    {isPropEditMode && (
                        <label className="admin-include-archived">
                            <input
                                type="checkbox"
                                checked={includeArchived}
                                onChange={onIncludeArchivedChange}
                            />
                            Include archived PrOP?
                        </label>
                    )}
                </div>
            </div>
        </div>
        {isPropEditMode && (
            <div className="admin-edit-table-wrapper">
                <p className="admin-editing-label">Select a PrOP to edit</p>
                <div className="admin-edit-table-scroll">
                    <table className="admin-edit-table">
                        <thead>
                            <tr>
                                <th>PrOP</th>
                                <th>Type</th>
                                <th>Target</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleProps.map((prop) => {
                                const isSelected = editingProp?.propId === prop.propId;
                                const isArchived = (prop.active ?? 1) === 0;
                                return (
                                    <tr
                                        key={prop.propId}
                                        className={[
                                            isSelected ? 'selected' : '',
                                            isArchived ? 'archived' : ''
                                        ]
                                            .filter(Boolean)
                                            .join(' ')}
                                        onClick={() => onSelectProp(prop)}
                                    >
                                        <td>{prop.PrOP}</td>
                                        <td>{getPropTypeLabel(prop.propTypeId)}</td>
                                        <td>{getPropTargetLabel(prop)}</td>
                                        <td>{prop.active === 1 ? 'Active' : 'Archived'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
        {isPropEditMode && editingProp && (
            <p className="admin-editing-tag">
                Currently editing: {editingProp.PrOP}
            </p>
        )}
        {(isPropNewMode || (isPropEditMode && editingProp)) && (
            <div className="admin-form">
                <div className="admin-form-row">
                    <label htmlFor="prop-name" className="admin-label">
                        PrOP <span className="admin-required">*</span>
                    </label>
                    <input
                        id="prop-name"
                        type="text"
                        className="admin-input"
                        placeholder="Enter PrOP name"
                        value={propInput}
                        onChange={onPropInputChange}
                    />
                    {fieldErrors.PrOP && (
                        <p className="admin-field-error">{fieldErrors.PrOP}</p>
                    )}
                </div>
                <div className="admin-form-row">
                    <label htmlFor="prop-type" className="admin-label">
                        PrOP Type <span className="admin-required">*</span>
                    </label>
                    <select
                        id="prop-type"
                        value={propTypeId}
                        onChange={onPropTypeChange}
                        className="admin-input"
                    >
                        <option value="" disabled hidden>
                            Select Type
                        </option>
                        {propTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    {fieldErrors.propTypeId && (
                        <p className="admin-field-error">{fieldErrors.propTypeId}</p>
                    )}
                </div>
                {propTargetLabel && (
                    <div className="admin-form-row">
                        <label htmlFor="prop-target" className="admin-label">
                            {propTargetLabel} <span className="admin-required">*</span>
                        </label>
                        <select
                            id="prop-target"
                            value={propTargetId}
                            onChange={onPropTargetChange}
                            className="admin-input"
                        >
                            <option value="" disabled hidden>
                                Select {propTargetLabel}
                            </option>
                            {propTargetOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {fieldErrors.targetId && (
                            <p className="admin-field-error">{fieldErrors.targetId}</p>
                        )}
                    </div>
                )}
                <div className="admin-button-row">
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={submitting}
                        className="admin-primary"
                    >
                        {submitting
                            ? isPropEditMode
                                ? 'Submitting Changes...'
                                : 'Adding PrOP...'
                            : isPropEditMode
                                ? 'Submit Changes'
                                : 'Add PrOP'}
                    </button>
                    {isPropEditMode && editingProp && (
                        <button
                            type="button"
                            onClick={onArchiveToggle}
                            disabled={submitting}
                            className={editingProp.active === 1 ? 'admin-warning' : 'admin-info'}
                        >
                            {editingProp.active === 1 ? 'Archive PrOP' : 'Reactivate PrOP'}
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

export default PropsSection;
