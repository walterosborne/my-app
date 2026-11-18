import React from 'react';
import AdminSelectionGrid from './AdminSelectionGrid';
import { createCustomer, getCustomers, updateCustomer } from '../../assets/data/apiData';

const CustomersSection = ({ actionOptions, selectedAction, onActionChange }) => {
    const [customers, setCustomers] = React.useState([]);
    const [selected, setSelected] = React.useState(null);
    const [name, setName] = React.useState('');
    const [includeArchived, setIncludeArchived] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState('');
    const [message, setMessage] = React.useState('');
    const isEditMode = selectedAction === 'Edit';

    React.useEffect(() => {
        let mounted = true;
        getCustomers().then((rows) => {
            if (mounted) setCustomers(Array.isArray(rows) ? rows : []);
        }).catch(() => {
            if (mounted) setError('Unable to load customers.');
        }).finally(() => {
            if (mounted) setLoading(false);
        });
        return () => { mounted = false; };
    }, []);

    React.useEffect(() => {
        setSelected(null);
        setName('');
        setError('');
        setMessage('');
    }, [selectedAction]);

    const reset = () => {
        setSelected(null);
        setName('');
        setError('');
        setMessage('');
    };

    const persist = async (active = selected?.active ?? 1) => {
        const customerName = name.trim();
        if (!customerName || customerName.length > 200) {
            setError('Customer name must be 1 to 200 characters.');
            return;
        }
        if (isEditMode && !selected) {
            setError('Select a customer to edit.');
            return;
        }
        setSaving(true);
        setError('');
        setMessage('');
        try {
            const saved = isEditMode
                ? await updateCustomer(selected.customerId, { customerName, active })
                : await createCustomer({ customerName });
            setCustomers((old) => isEditMode
                ? old.map((row) => row.customerId === saved.customerId ? saved : row)
                : [...old, saved]);
            if (isEditMode) {
                setSelected(saved);
                setName(saved.customerName);
            } else {
                setName('');
            }
            setMessage(isEditMode ? 'Customer updated.' : 'Customer added.');
        } catch (saveError) {
            setError(saveError.message || 'Unable to save customer.');
        } finally {
            setSaving(false);
        }
    };

    const rows = customers
        .filter((row) => includeArchived || Number(row.active) === 1)
        .sort((a, b) => a.customerName.localeCompare(b.customerName));

    return (
        <section className="admin-section">
            <div className="admin-section-header">
                <div className="admin-section-title">
                    <div>
                        <h3>Customer Management</h3>
                        <p className="admin-section-subhead">Add, rename, archive, or reactivate customers.</p>
                    </div>
                    <div className="admin-section-action-inline">
                        <div className="admin-action-select">
                            <label htmlFor="customer-action" className="admin-label">Action</label>
                            <select id="customer-action" className="admin-select admin-select-inline"
                                value={selectedAction} onChange={onActionChange}>
                                {actionOptions.map((action) => <option key={action} value={action}>{action}</option>)}
                            </select>
                        </div>
                        {isEditMode && (
                            <label className="admin-include-archived">
                                <input type="checkbox" checked={includeArchived}
                                    onChange={(event) => setIncludeArchived(event.target.checked)} />
                                Include archived customers?
                            </label>
                        )}
                    </div>
                </div>
            </div>
            {isEditMode && (loading ? <p>Loading customers...</p> : (
                <div className="admin-edit-table-wrapper">
                    <p className="admin-editing-label">Select a customer to edit</p>
                    <AdminSelectionGrid rows={rows} getRowId={(row) => row.customerId}
                        selectedRowId={selected?.customerId}
                        onSelectRow={(row) => {
                            setSelected(row);
                            setName(row.customerName);
                            setError('');
                            setMessage('');
                        }}
                        columns={[
                            { field: 'customerName', headerName: 'Customer', flex: 2, minWidth: 220 },
                            { field: 'status', headerName: 'Status', flex: 1, minWidth: 140,
                                valueGetter: (_value, row) => Number(row.active) === 1 ? 'Active' : 'Archived' }
                        ]} />
                </div>
            ))}
            {isEditMode && selected && <p className="admin-editing-tag">Currently editing: {selected.customerName}</p>}
            {(!isEditMode || selected) && (
                <div className="admin-form">
                    <div className="admin-form-row">
                        <label htmlFor="customer-name" className="admin-label">
                            Customer Name <span className="admin-required">*</span>
                        </label>
                        <input id="customer-name" className="admin-input" maxLength={200}
                            value={name} onChange={(event) => {
                                setName(event.target.value);
                                setError('');
                                setMessage('');
                            }} disabled={saving || loading} />
                    </div>
                    <div className="admin-button-row">
                        <button type="button" className="admin-primary" onClick={() => persist()}
                            disabled={saving || loading}>
                            {saving ? 'Saving...' : isEditMode ? 'Submit Changes' : 'Add Customer'}
                        </button>
                        {isEditMode && (
                            <button type="button"
                                className={Number(selected.active) === 1 ? 'admin-warning' : 'admin-info'}
                                onClick={() => persist(Number(selected.active) === 1 ? 0 : 1)}
                                disabled={saving}>
                                {Number(selected.active) === 1 ? 'Archive Customer' : 'Reactivate Customer'}
                            </button>
                        )}
                        <button type="button" className="admin-secondary" onClick={reset} disabled={saving}>Reset</button>
                    </div>
                </div>
            )}
            {message && <p className="admin-success">{message}</p>}
            {error && <p className="admin-field-error">{error}</p>}
        </section>
    );
};

export default CustomersSection;
