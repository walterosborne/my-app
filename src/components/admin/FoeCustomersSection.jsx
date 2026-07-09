import React from 'react';
import AdminSelectionGrid from './AdminSelectionGrid';

const FoeCustomersSection = ({
    actionOptions,
    selectedAction,
    onActionChange,
    isNewMode,
    isArchiveMode,
    customers,
    selectedCustomer,
    onSelectCustomer,
    customerInput,
    onCustomerChange,
    fieldErrors,
    onSubmit,
    onArchive,
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
                        Add new customers or archive existing records.
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
                </div>
            </div>
        </div>
        {isArchiveMode && (
            <div className="admin-edit-table-wrapper">
                <p className="admin-editing-label">Select a customer to archive</p>
                <AdminSelectionGrid
                    rows={customers}
                    columns={[
                        { field: 'customerName', headerName: 'Customer', flex: 1.5, minWidth: 220 }
                    ]}
                    getRowId={(row) => row.customerId}
                    selectedRowId={selectedCustomer?.customerId}
                    onSelectRow={onSelectCustomer}
                />
            </div>
        )}
        {isArchiveMode && selectedCustomer && (
            <p className="admin-editing-tag">
                Currently selected: {selectedCustomer.customerName}
            </p>
        )}
        {isNewMode && (
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
                        {submitting ? 'Adding Customer...' : 'Add Customer'}
                    </button>
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
        {isArchiveMode && selectedCustomer && (
            <div className="admin-form" style={{ marginTop: 0 }}>
                <div className="admin-button-row">
                    <button
                        type="button"
                        onClick={onArchive}
                        disabled={submitting}
                        className="admin-warning"
                    >
                        {submitting ? 'Archiving Customer...' : 'Archive Customer'}
                    </button>
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
