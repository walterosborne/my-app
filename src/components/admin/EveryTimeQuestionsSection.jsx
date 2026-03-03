import React from 'react';

const EveryTimeQuestionsSection = ({
    actionOptions,
    selectedAction,
    onActionChange,
    isEditMode,
    isNewMode,
    includeArchived,
    onIncludeArchivedChange,
    visibleQuestions,
    editingQuestion,
    onSelectQuestion,
    getDivisionName,
    questionInput,
    onQuestionInputChange,
    divisionId,
    onDivisionChange,
    sortedDivisions,
    onClearDivision,
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
                    <h3>Every Time Questions</h3>
                    <p className="admin-section-subhead">
                        Manage ETQs by division.
                    </p>
                </div>
                <div className="admin-section-action-inline">
                    <div className="admin-action-select">
                        <label htmlFor="etq-action" className="admin-label">
                            Action
                        </label>
                        <select
                            id="etq-action"
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
                            Include archived questions?
                        </label>
                    )}
                </div>
            </div>
        </div>
        {isEditMode && (
            <div className="admin-edit-table-wrapper">
                <p className="admin-editing-label">Select a question to edit</p>
                <div className="admin-edit-table-scroll">
                    <table className="admin-edit-table">
                        <thead>
                            <tr>
                                <th>Question</th>
                                <th>Division</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleQuestions.map((question) => {
                                const isSelected = editingQuestion?.etqId === question.etqId;
                                const isArchived = (question.active ?? 1) === 0;
                                return (
                                    <tr
                                        key={question.etqId}
                                        className={[
                                            isSelected ? 'selected' : '',
                                            isArchived ? 'archived' : ''
                                        ]
                                            .filter(Boolean)
                                            .join(' ')}
                                        onClick={() => onSelectQuestion(question)}
                                    >
                                        <td>{question.question}</td>
                                        <td>{getDivisionName(question.divisionId)}</td>
                                        <td>{question.active === 1 ? 'Active' : 'Archived'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
        {isEditMode && editingQuestion && (
            <p className="admin-editing-tag">
                Currently editing: {editingQuestion.question}
            </p>
        )}
        {(isNewMode || (isEditMode && editingQuestion)) && (
            <div className="admin-form">
                <div className="admin-form-row">
                    <label htmlFor="etq-question" className="admin-label">
                        Question <span className="admin-required">*</span>
                    </label>
                    <input
                        id="etq-question"
                        type="text"
                        className="admin-input"
                        placeholder="Enter question"
                        value={questionInput}
                        onChange={onQuestionInputChange}
                    />
                    {fieldErrors.question && (
                        <p className="admin-field-error">{fieldErrors.question}</p>
                    )}
                </div>
                <div className="admin-form-row">
                    <label htmlFor="etq-division" className="admin-label">
                        Division <span className="admin-required">*</span>
                    </label>
                    <div className="admin-select-wrapper">
                        <select
                            id="etq-division"
                            value={divisionId}
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
                        {divisionId && (
                            <button
                                type="button"
                                className="admin-clear-button"
                                onClick={onClearDivision}
                            >
                                &times;
                            </button>
                        )}
                    </div>
                    {fieldErrors.divisionId && (
                        <p className="admin-field-error">{fieldErrors.divisionId}</p>
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
                                : 'Adding Question...'
                            : isEditMode
                                ? 'Submit Changes'
                                : 'Add Question'}
                    </button>
                    {isEditMode && editingQuestion && (
                        <button
                            type="button"
                            onClick={onArchiveToggle}
                            disabled={submitting}
                            className={editingQuestion.active === 1 ? 'admin-warning' : 'admin-info'}
                        >
                            {editingQuestion.active === 1 ? 'Archive Question' : 'Reactivate Question'}
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

export default EveryTimeQuestionsSection;
