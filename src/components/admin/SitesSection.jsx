import React from 'react';

const SitesSection = ({
    actionOptions,
    selectedAction,
    onActionChange,
    isSiteEditMode,
    isSiteNewMode,
    includeArchived,
    onIncludeArchivedChange,
    visibleSites,
    editingSite,
    onSelectSite,
    getDivisionName,
    addressInput,
    cityInput,
    stateInput,
    countryInput,
    divisionId,
    onAddressChange,
    onCityChange,
    onStateChange,
    onCountryChange,
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
                    <h3>Site Management</h3>
                    <p className="admin-section-subhead">
                        Add new sites or refresh existing records.
                    </p>
                </div>
                <div className="admin-section-action-inline">
                    <div className="admin-action-select">
                        <label htmlFor="site-action" className="admin-label">
                            Action
                        </label>
                        <select
                            id="site-action"
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
                    {isSiteEditMode && (
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
        {isSiteEditMode && (
            <div className="admin-edit-table-wrapper">
                <p className="admin-editing-label">Select a site to edit</p>
                <div className="admin-edit-table-scroll">
                    <table className="admin-edit-table">
                        <thead>
                            <tr>
                                <th>Address</th>
                                <th>City</th>
                                <th>State</th>
                                <th>Country</th>
                                <th>Division</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleSites.map((site) => {
                                const isSelected = editingSite?.siteId === site.siteId;
                                const isArchived = (site.active ?? 1) === 0;
                                return (
                                    <tr
                                        key={site.siteId}
                                        className={[
                                            isSelected ? 'selected' : '',
                                            isArchived ? 'archived' : ''
                                        ]
                                            .filter(Boolean)
                                            .join(' ')}
                                        onClick={() => onSelectSite(site)}
                                    >
                                        <td>{site.address}</td>
                                        <td>{site.city || ''}</td>
                                        <td>{site.state || ''}</td>
                                        <td>{site.country || ''}</td>
                                        <td>{getDivisionName(site.divisionId)}</td>
                                        <td>{site.active === 1 ? 'Active' : 'Archived'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
        {isSiteEditMode && editingSite && (
            <p className="admin-editing-tag">
                Currently editing: {editingSite.address}
            </p>
        )}
        {(isSiteNewMode || (isSiteEditMode && editingSite)) && (
            <div className="admin-form">
                <div className="admin-form-row">
                    <label htmlFor="site-address" className="admin-label">
                        Address <span className="admin-required">*</span>
                    </label>
                    <input
                        id="site-address"
                        type="text"
                        className="admin-input"
                        placeholder="Enter address"
                        value={addressInput}
                        onChange={onAddressChange}
                    />
                    {fieldErrors.address && (
                        <p className="admin-field-error">{fieldErrors.address}</p>
                    )}
                </div>
                <div className="admin-form-row">
                    <label htmlFor="site-city" className="admin-label">
                        City <span className="admin-required">*</span>
                    </label>
                    <input
                        id="site-city"
                        type="text"
                        className="admin-input"
                        placeholder="Enter city"
                        value={cityInput}
                        onChange={onCityChange}
                    />
                    {fieldErrors.city && (
                        <p className="admin-field-error">{fieldErrors.city}</p>
                    )}
                </div>
                <div className="admin-form-row">
                    <label htmlFor="site-state" className="admin-label">
                        State <span className="admin-required">*</span>
                    </label>
                    <input
                        id="site-state"
                        type="text"
                        className="admin-input"
                        placeholder="Enter state"
                        value={stateInput}
                        onChange={onStateChange}
                    />
                    {fieldErrors.state && (
                        <p className="admin-field-error">{fieldErrors.state}</p>
                    )}
                </div>
                <div className="admin-form-row">
                    <label htmlFor="site-country" className="admin-label">
                        Country <span className="admin-required">*</span>
                    </label>
                    <input
                        id="site-country"
                        type="text"
                        className="admin-input"
                        placeholder="Enter country"
                        value={countryInput}
                        onChange={onCountryChange}
                    />
                    {fieldErrors.country && (
                        <p className="admin-field-error">{fieldErrors.country}</p>
                    )}
                </div>
                <div className="admin-form-row">
                    <label htmlFor="site-division" className="admin-label">
                        Division <span className="admin-required">*</span>
                    </label>
                    <div className="admin-select-wrapper">
                        <select
                            id="site-division"
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
                            ? isSiteEditMode
                                ? 'Submitting Changes...'
                                : 'Adding Site...'
                            : isSiteEditMode
                                ? 'Submit Changes'
                                : 'Add Site'}
                    </button>
                    {isSiteEditMode && editingSite && (
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

export default SitesSection;
