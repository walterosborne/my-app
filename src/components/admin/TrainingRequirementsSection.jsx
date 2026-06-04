import React from 'react';
import AdminSelectionGrid from './AdminSelectionGrid';

const TrainingRequirementsSection = ({
    actionOptions,
    selectedAction,
    onActionChange,
    isTrainingRequirementEditMode,
    isTrainingRequirementNewMode,
    includeArchived,
    onIncludeArchivedChange,
    visibleTrainingRequirements,
    editingTrainingRequirement,
    onSelectTrainingRequirement,
    trainingRequirementInput,
    onTrainingRequirementInputChange,
    trainingRequirementFieldErrors,
    onSubmit,
    onArchiveToggle,
    onReset,
    submitting,
    trainingRequirementMessage,
    trainingRequirementError
}) => (
    <section className="admin-section">
        <div className="admin-section-header">
            <div className="admin-section-title">
                <div>
                    <h3>Training Requirement Management</h3>
                    <p className="admin-section-subhead">
                        Add new training requirements or refresh existing records.
                    </p>
                </div>
                <div className="admin-section-action-inline">
                    <div className="admin-action-select">
                        <label htmlFor="training-requirement-action" className="admin-label">
                            Action
                        </label>
                        <select
                            id="training-requirement-action"
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
                    {isTrainingRequirementEditMode && (
                        <label className="admin-include-archived">
                            <input
                                type="checkbox"
                                checked={includeArchived}
                                onChange={onIncludeArchivedChange}
                            />
                            Include archived training requirements?
                        </label>
                    )}
                </div>
            </div>
        </div>
        {isTrainingRequirementEditMode && (
            <div className="admin-edit-table-wrapper">
                <p className="admin-editing-label">Select a training requirement to edit</p>
                <AdminSelectionGrid
                    rows={visibleTrainingRequirements}
                    columns={[
                        { field: 'trainingRequirementName', headerName: 'Training Requirement', flex: 1.5, minWidth: 240 },
                        {
                            field: 'status',
                            headerName: 'Status',
                            flex: 1,
                            minWidth: 140,
                            sortable: false,
                            renderCell: ({ row }) => (row.active === 1 ? 'Active' : 'Archived')
                        }
                    ]}
                    getRowId={(row) => row.trainingRequirementId}
                    selectedRowId={editingTrainingRequirement?.trainingRequirementId}
                    onSelectRow={onSelectTrainingRequirement}
                />
            </div>
        )}
        {isTrainingRequirementEditMode && editingTrainingRequirement && (
            <p className="admin-editing-tag">
                Currently editing: {editingTrainingRequirement.trainingRequirementName}
            </p>
        )}
        {(isTrainingRequirementNewMode || (isTrainingRequirementEditMode && editingTrainingRequirement)) && (
            <div className="admin-form">
                <div className="admin-form-row">
                    <label htmlFor="training-requirement-input" className="admin-label">
                        Training Requirement <span className="admin-required">*</span>
                    </label>
                    <input
                        id="training-requirement-input"
                        type="text"
                        className="admin-input"
                        placeholder="Enter training requirement"
                        value={trainingRequirementInput}
                        onChange={onTrainingRequirementInputChange}
                    />
                    {trainingRequirementFieldErrors.trainingRequirementName && (
                        <p className="admin-field-error">{trainingRequirementFieldErrors.trainingRequirementName}</p>
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
                            ? isTrainingRequirementEditMode
                                ? 'Submitting Changes...'
                                : 'Adding Training Requirement...'
                            : isTrainingRequirementEditMode
                                ? 'Submit Changes'
                                : 'Add Training Requirement'}
                    </button>
                    {isTrainingRequirementEditMode && editingTrainingRequirement && (
                        <button
                            type="button"
                            onClick={onArchiveToggle}
                            disabled={submitting}
                            className={editingTrainingRequirement.active === 1 ? 'admin-warning' : 'admin-info'}
                        >
                            {editingTrainingRequirement.active === 1 ? 'Archive Training Requirement' : 'Reactivate Training Requirement'}
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
                {trainingRequirementMessage && (
                    <p className="admin-success">{trainingRequirementMessage}</p>
                )}
                {trainingRequirementError && (
                    <p className="admin-field-error" style={{ marginTop: '0.2rem' }}>
                        {trainingRequirementError}
                    </p>
                )}
            </div>
        )}
    </section>
);

export default TrainingRequirementsSection;
