import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Audit.css';
import { audits } from './assets/data/audits';
import { programs as programsList } from './assets/data/programs';
import { divisions as divisionsList } from './assets/data/divisions';
import { sectors as sectorsList } from './assets/data/sectors';
import { sites as sitesList } from './assets/data/sites';
import { businessUnits as businessUnitsList } from './assets/data/businessUnits';
import { operatingUnits as operatingUnitsList } from './assets/data/operatingUnits';
import { auditors as auditorsList } from './assets/data/auditors';
import { auditTypes as auditTypesList } from './assets/data/auditTypes';
import { statuses as statusesList } from './assets/data/statuses';
import { functions as functionsList } from './assets/data/functions';
import { intExt as intExtList } from './assets/data/intExt';
import { standards as standardsList } from './assets/data/standards';

const Audit = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Helper function to get program names from programIds
    const getProgramNames = (programIds) => {
        return programIds.map(programId => {
            const program = programsList.find(p => p.programId === programId);
            return program ? program.programName : programId;
        }).join(', ');
    };

    // Helper function to get division name from divisionId
    const getDivisionName = (divisionId) => {
        const division = divisionsList.find(d => d.divisionId === divisionId);
        return division ? division.divisionName : divisionId;
    };

    // Helper function to get sector name from sectorId
    const getSectorName = (sectorId) => {
        const sector = sectorsList.find(s => s.sectorId === sectorId);
        return sector ? sector.sectorName : sectorId;
    };

    // Helper function to get site name from siteId
    const getSiteName = (siteId) => {
        const site = sitesList.find(s => s.siteId === siteId);
        return site ? site.siteName : siteId;
    };

    // Helper function to get business unit names from businessUnitIds
    const getBusinessUnitNames = (businessUnitIds) => {
        return businessUnitIds.map(businessUnitId => {
            const businessUnit = businessUnitsList.find(bu => bu.businessUnitId === businessUnitId);
            return businessUnit ? businessUnit.businessUnitName : businessUnitId;
        }).join(', ');
    };

    // Helper function to get operating unit names from operatingUnitIds
    const getOperatingUnitNames = (operatingUnitIds) => {
        return operatingUnitIds.map(operatingUnitId => {
            const operatingUnit = operatingUnitsList.find(ou => ou.operatingUnitId === operatingUnitId);
            return operatingUnit ? operatingUnit.operatingUnitName : operatingUnitId;
        }).join(', ');
    };

    // Helper function to get lead auditor name from leadAuditorId
    const getLeadAuditorName = (leadAuditorId) => {
        const auditor = auditorsList.find(a => a.auditorId === leadAuditorId);
        return auditor ? auditor.auditorName : leadAuditorId;
    };

    // Helper function to get additional auditor names from additionalAuditorIds
    const getAdditionalAuditorNames = (additionalAuditorIds) => {
        return additionalAuditorIds.map(auditorId => {
            const auditor = auditorsList.find(a => a.auditorId === auditorId);
            return auditor ? auditor.auditorName : auditorId;
        }).join(', ');
    };

    // Helper function to get audit type name from auditTypeId
    const getAuditTypeName = (auditTypeId) => {
        const auditType = auditTypesList.find(at => at.auditTypeId === auditTypeId);
        return auditType ? auditType.auditTypeName : auditTypeId;
    };

    // Helper function to get status name from statusId
    const getStatusName = (statusId) => {
        const status = statusesList.find(s => s.statusId === statusId);
        return status ? status.statusName : statusId;
    };

    // Helper function to get function name from functionId
    const getFunctionName = (functionId) => {
        const func = functionsList.find(f => f.functionId === functionId);
        return func ? func.functionName : functionId;
    };

    // Helper function to get int/ext name from intExtId
    const getIntExtName = (intExtId) => {
        const intExtItem = intExtList.find(ie => ie.intExtId === intExtId);
        return intExtItem ? intExtItem.intExtName : intExtId;
    };

    // Helper function to get standard names from standardIds
    const getStandardNames = (standardIds) => {
        return standardIds.map(standardId => {
            const standard = standardsList.find(s => s.standardId === standardId);
            return standard ? standard.standardName : standardId;
        }).join(', ');
    };

    // EXAMPLE FUNCTION - NOT CURRENTLY IN USE
    // This function demonstrates how to fetch audit data from a SQL Server database
    // Requires a backend API endpoint (e.g., Express.js with mssql package)
    const fetchAuditsFromSQLServer = async () => {
        try {
            // Call your backend API endpoint that connects to SQL Server
            const response = await fetch('/api/audits', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Add authentication headers if needed
                    // 'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data; // Returns array of audit objects from SQL Server
        } catch (error) {
            console.error('Error fetching audits from SQL Server:', error);
            throw error;
        }
    };

    // Backend API endpoint would look something like this (Node.js/Express):
    /*
    const express = require('express');
    const sql = require('mssql');
    const router = express.Router();

    const sqlConfig = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        server: process.env.DB_SERVER,
        options: {
            encrypt: true,
            trustServerCertificate: false
        }
    };

    router.get('/api/audits', async (req, res) => {
        try {
            await sql.connect(sqlConfig);
            const result = await sql.query`
                SELECT 
                    scheduleId,
                    title,
                    auditType,
                    function,
                    standards,
                    status,
                    stage,
                    scheduleDate,
                    startDate,
                    endDate,
                    reportDueDate,
                    division,
                    programs,
                    sector,
                    site,
                    businessUnit,
                    operatingUnit,
                    leadAuditor,
                    additionalAuditors,
                    scope,
                    processElements,
                    findings
                FROM Audits
                ORDER BY scheduleId DESC
            `;
            res.json(result.recordset);
        } catch (err) {
            console.error('SQL error:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });
    */

    // Find the audit based on URL param or default to highest numbered
    const getAuditData = () => {
        if (id) {
            const audit = audits.find(a => a.scheduleId === parseInt(id));
            return audit || audits[0]; // Fallback to first if not found
        }
        // Default to highest numbered audit (sort by scheduleId numerically)
        const sorted = [...audits].sort((a, b) => b.scheduleId - a.scheduleId);
        return sorted[0];
    };

    const auditData = getAuditData();

    const handleAuditChange = (event) => {
        const selectedId = event.target.value;
        navigate(`/audit/${selectedId}`);
    };

    return (
        <div className="audit-page">
            <div className="audit-container">
                {/* Audit Selector */}
                <div className="audit-selector">
                    <label htmlFor="audit-select">Select Audit:</label>
                    <select
                        id="audit-select"
                        value={auditData.scheduleId}
                        onChange={handleAuditChange}
                        className="audit-select-dropdown"
                    >
                        {audits.map((audit) => (
                            <option key={audit.scheduleId} value={audit.scheduleId}>
                                {audit.scheduleId} - {audit.title}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Header Section */}
                <div className="audit-header">
                    <div className="audit-id">Schedule ID: {auditData.scheduleId}</div>
                    <h1 className="audit-title">{auditData.title}</h1>
                    <div className="audit-status-badge">
                        {auditData.stage.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                    {/* Always show Export XLSX */}
                    <button className="action-btn export-xlsx">Export XLSX</button>

                    {/* Stage-specific buttons */}
                    {auditData.stage === 'planning' && (
                        <>
                            <button
                                className="action-btn"
                                onClick={() => navigate(`/entry?type=schedule&audit=${auditData.scheduleId}`)}
                            >
                                Edit Schedule
                            </button>
                            <button
                                className="action-btn"
                                onClick={() => navigate(`/entry?type=planning&audit=${auditData.scheduleId}`)}
                            >
                                Edit Planning
                            </button>
                        </>
                    )}

                    {auditData.stage === 'conduct audit' && (
                        <>
                            <button
                                className="action-btn"
                                onClick={() => navigate(`/entry?type=schedule&audit=${auditData.scheduleId}`)}
                            >
                                Edit Schedule
                            </button>
                            <button
                                className="action-btn"
                                onClick={() => navigate(`/entry?type=planning&audit=${auditData.scheduleId}`)}
                            >
                                Edit Planning
                            </button>
                            <button
                                className="action-btn"
                                onClick={() => navigate(`/entry?type=results&audit=${auditData.scheduleId}`)}
                            >
                                Conduct Audit
                            </button>
                        </>
                    )}

                    {auditData.stage === 'nonconformaties' && (
                        <>
                            <button
                                className="action-btn"
                                onClick={() => navigate(`/entry?type=schedule&audit=${auditData.scheduleId}`)}
                            >
                                Edit Schedule
                            </button>
                            <button
                                className="action-btn"
                                onClick={() => navigate(`/entry?type=planning&audit=${auditData.scheduleId}`)}
                            >
                                Edit Planning
                            </button>
                            <button
                                className="action-btn"
                                onClick={() => navigate(`/entry?type=results&audit=${auditData.scheduleId}`)}
                            >
                                Conduct Audit
                            </button>
                            <button
                                className="action-btn"
                                onClick={() => navigate(`/entry?type=nonconformaties&audit=${auditData.scheduleId}`)}
                            >
                                Enter Nonconformaties
                            </button>
                        </>
                    )}

                    {(auditData.stage === 'pending approval' || auditData.stage === 'approved') && (
                        <button className="action-btn export-pdf">Export PDF</button>
                    )}
                </div>

                {/* Two Column Layout for Basic Info */}
                <div className="audit-section-row">
                    <div className="audit-section">
                        <h2 className="section-title">Audit Information</h2>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Audit Type:</label>
                                <span>{getAuditTypeName(auditData.auditTypeId)}</span>
                            </div>
                            <div className="info-item">
                                <label>Function:</label>
                                <span>{getFunctionName(auditData.functionId)}</span>
                            </div>
                            <div className="info-item">
                                <label>Standards:</label>
                                <span>{getStandardNames(auditData.standardIds)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="audit-section">
                        <h2 className="section-title">Schedule & Dates</h2>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Schedule Date:</label>
                                <span>{auditData.scheduleDate}</span>
                            </div>
                            <div className="info-item">
                                <label>Expected Start Date:</label>
                                <span>{auditData.expectedStartDate}</span>
                            </div>
                            <div className="info-item">
                                <label>Expected Completion Date:</label>
                                <span>{auditData.expectedCompletionDate}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Organization Section */}
                <div className="audit-section">
                    <h2 className="section-title">Organization</h2>
                    <div className="info-grid-three">
                        <div className="info-item">
                            <label>Division:</label>
                            <span>{getDivisionName(auditData.divisionId)}</span>
                        </div>
                        <div className="info-item">
                            <label>Sector:</label>
                            <span>{getSectorName(auditData.sectorId)}</span>
                        </div>
                        <div className="info-item">
                            <label>Site:</label>
                            <span>{auditData.siteIds.map(siteId => getSiteName(siteId)).join(', ')}</span>
                        </div>
                        <div className="info-item">
                            <label>Business Unit:</label>
                            <span>{getBusinessUnitNames(auditData.businessUnitIds)}</span>
                        </div>
                        <div className="info-item">
                            <label>Operating Unit:</label>
                            <span>{getOperatingUnitNames(auditData.operatingUnitIds)}</span>
                        </div>
                        <div className="info-item">
                            <label>Programs:</label>
                            <span>{getProgramNames(auditData.programIds)}</span>
                        </div>
                    </div>
                </div>

                {/* Auditors Section */}
                <div className="audit-section">
                    <h2 className="section-title">Audit Team</h2>
                    <div className="info-item">
                        <label>Lead Auditor:</label>
                        <span className="lead-auditor">{getLeadAuditorName(auditData.leadAuditorId)}</span>
                    </div>
                    <div className="info-item">
                        <label>Additional Auditors:</label>
                        <span>{getAdditionalAuditorNames(auditData.additionalAuditorIds)}</span>
                    </div>
                </div>

                {/* Planning Details */}
                <div className="audit-section">
                    <h2 className="section-title">Planning Details</h2>
                    <div className="planning-content">
                        <div className="planning-item">
                            <h3>Scope</h3>
                            <p>{auditData.scope}</p>
                        </div>
                        <div className="planning-item">
                            <h3>Safety Considerations</h3>
                            <p>{auditData.safetyConsiderations}</p>
                        </div>
                        <div className="planning-item">
                            <h3>Special Equipment</h3>
                            <p>{auditData.specialEquipment}</p>
                        </div>
                    </div>
                </div>

                {/* Results Summary */}
                <div className="audit-section summary-section">
                    <h2 className="section-title">Results Summary</h2>
                    <div className="summary-grid">
                        <div className="summary-card">
                            <div className="summary-number">3</div>
                            <div className="summary-label">Total PEQs</div>
                        </div>
                        <div className="summary-card compliant">
                            <div className="summary-number">3</div>
                            <div className="summary-label">Compliant</div>
                        </div>
                        <div className="summary-card partial">
                            <div className="summary-number">3</div>
                            <div className="summary-label">Partially Compliant</div>
                        </div>
                        <div className="summary-card major-nc">
                            <div className="summary-number">3</div>
                            <div className="summary-label">Major NCs</div>
                        </div>
                        <div className="summary-card observation">
                            <div className="summary-number">3</div>
                            <div className="summary-label">Observations</div>
                        </div>
                    </div>
                </div>

                {/* Findings and Nonconformances */}
                <div className="audit-section">
                    <h2 className="section-title">Findings & Nonconformances</h2>
                    {auditData.findings.map((finding, index) => (
                        <div key={index} className={`finding-card ${finding.type.toLowerCase().replace(/\s+/g, '-')}`}>
                            <div className="finding-header">
                                <div className="finding-id-type">
                                    <span className="finding-id">{finding.id}</span>
                                    <span className={`finding-type ${finding.severity?.toLowerCase()}`}>
                                        {finding.type} {finding.severity && `- ${finding.severity}`}
                                    </span>
                                </div>
                                <span className={`finding-status ${finding.status?.toLowerCase()}`}>{finding.status}</span>
                            </div>

                            {finding.question && (
                                <div className="finding-item">
                                    <strong>Related Question:</strong>
                                    <p>{finding.question}</p>
                                </div>
                            )}

                            {finding.requirement && (
                                <div className="finding-item">
                                    <strong>Requirement:</strong>
                                    <p>{finding.requirement}</p>
                                </div>
                            )}

                            <div className="finding-item">
                                <strong>Description:</strong>
                                <p>{finding.description}</p>
                            </div>

                            {finding.rootCause && (
                                <div className="finding-item">
                                    <strong>Root Cause:</strong>
                                    <p>{finding.rootCause}</p>
                                </div>
                            )}

                            {finding.correctiveAction && (
                                <div className="finding-item">
                                    <strong>Corrective Action:</strong>
                                    <p>{finding.correctiveAction}</p>
                                </div>
                            )}

                            {finding.benefit && (
                                <div className="finding-item">
                                    <strong>Benefit:</strong>
                                    <p>{finding.benefit}</p>
                                </div>
                            )}

                            {finding.targetCloseDate && (
                                <div className="finding-footer">
                                    <div className="finding-footer-item">
                                        <strong>Responsible:</strong> {finding.responsiblePerson}
                                    </div>
                                    <div className="finding-footer-item">
                                        <strong>Target Close:</strong> {finding.targetCloseDate}
                                    </div>
                                    <div className="finding-footer-item">
                                        <strong>Reviewer:</strong> {finding.reviewer}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Audit;