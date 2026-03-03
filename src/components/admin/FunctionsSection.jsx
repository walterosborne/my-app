import React from 'react';

const FunctionsSection = ({
    actionOptions,
    selectedAction,
    onActionChange,
    isEditMode,
    isNewMode,
    includeArchived,
    onIncludeArchivedChange,
    visibleFunctions,
    editingFunction,
    onSelectFunction,
    functionInput,
    onFunctionInputChange,
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
                    <h3>Function Management</h3>
                    <p className="admin-section-subhead">
                        Add new functions or refresh existing records.
                    </p>
                </div>
                <div className="admin-section-action-inline">
                    <div className="admin-action-select">
                        <label htmlFor="function-action" className="admin-label">
                            Action
                        </label>
                        <select
                            id="function-action"
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
                            Include archived functions?
                        </label>
                    )}
                </div>
            </div>
        </div>
        {isEditMode && (
            <div className="admin-edit-table-wrapper">
                <p className="admin-editing-label">Select a function to edit</p>
                <div className="admin-edit-table-scroll">
                    <table className="admin-edit-table">
                        <thead>
                            <tr>
                                <th>Function</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleFunctions.map((fn) => {
                                const isSelected = editingFunction?.functionId === fn.functionId;
                                const isArchived = (fn.active ?? 1) === 0;
                                return (
                                    <tr
                                        key={fn.functionId}
                                        className={[
                                            isSelected ? 'selected' : '',
                                            isArchived ? 'archived' : ''
                                        ]
                                            .filter(Boolean)
                                            .join(' ')}
                                        onClick={() => onSelectFunction(fn)}
                                    >
                                        <td>{fn.functionName}</td>
                                        <td>{fn.active === 1 ? 'Active' : 'Archived'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
        {isEditMode && editingFunction && (
            <p className="admin-editing-tag">
                Currently editing: {editingFunction.functionName}
            </p>
        )}
        {(isNewMode || (isEditMode && editingFunction)) && (
            <div className="admin-form">
                <div className="admin-form-row">
                    <label htmlFor="function-input" className="admin-label">
                        Function <span className="admin-required">*</span>
                    </label>
                    <input
                        id="function-input"
                        type="text"
                        className="admin-input"
                        placeholder="Enter function"
                        value={functionInput}
                        onChange={onFunctionInputChange}
                    />
                    {fieldErrors.functionName && (
                        <p className="admin-field-error">{fieldErrors.functionName}</p>
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
                            ? isEditMode
                                ? 'Submitting Changes...'
                                : 'Adding Function...'
                            : isEditMode
                                ? 'Submit Changes'
                                : 'Add Function'}
                    </button>
                    {isEditMode && editingFunction && (
                        <button
                            type="button"
                            onClick={onArchiveToggle}
                            disabled={submitting}
                            className={editingFunction.active === 1 ? 'admin-warning' : 'admin-info'}
                        >
                            {editingFunction.active === 1 ? 'Archive Function' : 'Reactivate Function'}
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

export default FunctionsSection;
