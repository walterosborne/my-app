import React from 'react';
import AdminSelectionGrid from './AdminSelectionGrid';

const FoeCustomersSection = ({
    actionOptions,
    selectedAction,
    onActionChange,
    isEditMode,
    isNewMode,
    includeArchived,
    onIncludeArchivedChange,
    customers,
    editingCustomer,
    onSelectCustomer,
    customerInput,
    onCustomerChange,
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
                    <h3>Customer Management</h3>
                    <p className="admin-section-subhead">
                        Add new customers or update existing records.
                    </p>
                </div>
                <div className="admin-section-action-inline">
                    <div className="admin-action-select">
                        <label htmlFor="foe-customer-action" className="admin-label">
                            Action
                        </label>
                        <select
                            id="foe-customer-action"
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
                            Include archived customers?
                        </label>
                    )}
                </div>
            </div>
        </div>
        {isEditMode && (
            <div className="admin-edit-table-wrapper">
                <p className="admin-editing-label">Select a customer to edit</p>
                <AdminSelectionGrid
                    rows={customers}
                    columns={[
                        { field: 'customerName', headerName: 'Customer', flex: 1.5, minWidth: 220 },
                        {
                            field: 'status',
                            headerName: 'Status',
                            flex: 0.9,
                            minWidth: 140,
                            sortable: false,
                            valueGetter: (_value, row) => (row.active === 1 ? 'Active' : 'Archived'),
                            renderCell: ({ row }) => (row.active === 1 ? 'Active' : 'Archived')
                        }
                    ]}
                    getRowId={(row) => row.customerId}
                    selectedRowId={editingCustomer?.customerId}
                    onSelectRow={onSelectCustomer}
                />
            </div>
        )}
        {isEditMode && editingCustomer && (
            <p className="admin-editing-tag">
                Currently editing: {editingCustomer.customerName}
            </p>
        )}
        {(isNewMode || (isEditMode && editingCustomer)) && (
            <div className="admin-form">
                <div className="admin-form-row">
                    <label htmlFor="foe-customer-input" className="admin-label">
                        Customer <span className="admin-required">*</span>
                    </label>
                    <input
                        id="foe-customer-input"
                        type="text"
                        className="admin-input"
                        placeholder="Enter customer"
                        value={customerInput}
                        onChange={onCustomerChange}
                    />
                    {fieldErrors.customer && (
                        <p className="admin-field-error">{fieldErrors.customer}</p>
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
                                : 'Adding Customer...'
                            : isEditMode
                                ? 'Submit Changes'
                                : 'Add Customer'}
                    </button>
                    {isEditMode && editingCustomer && (
                        <button
                            type="button"
                            onClick={onArchiveToggle}
                            disabled={submitting}
                            className={editingCustomer.active === 1 ? 'admin-warning' : 'admin-info'}
                        >
                            {editingCustomer.active === 1 ? 'Archive Customer' : 'Reactivate Customer'}
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

export default FoeCustomersSection;
