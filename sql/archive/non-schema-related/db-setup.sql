-- Database setup script for PostgreSQL
-- Run this with: psql -U postgres -f db-setup.sql

CREATE DATABASE audit_db;

\c audit_db;

-- Severities lookup table
CREATE TABLE severities (
    severityId SERIAL PRIMARY KEY,
    severity VARCHAR(50) NOT NULL UNIQUE
);

-- Insert severity values
INSERT INTO severities (severityId, severity) VALUES
(1, 'Low'),
(2, 'Medium'),
(3, 'High'),
(4, 'Critical')
ON CONFLICT (severity) DO NOTHING;

-- Nonconformances table
CREATE TABLE nonconformances (
    ncId SERIAL PRIMARY KEY,
    scheduleId INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL,
    findingType INTEGER,
    severity INTEGER,
    section INTEGER,
    subsection INTEGER,
    question TEXT,
    response TEXT,
    auditorComment TEXT,
    details TEXT,
    AIN VARCHAR(50),
    actionItemNumber VARCHAR(100),
    division JSONB DEFAULT '[]',
    sector JSONB DEFAULT '[]',
    qma JSONB DEFAULT '[]',
    other JSONB DEFAULT '[]',
    files JSONB DEFAULT '[]',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Standard texts lookup table (markdown stored in text column)
CREATE TABLE standard_texts (
    standardId INTEGER NOT NULL,
    section INTEGER NOT NULL,
    subsection INTEGER NOT NULL,
    text TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_standard_texts
    ON standard_texts (standardId, section, subsection);

-- Auditor file storage
CREATE TABLE auditor_files (
    fileId SERIAL PRIMARY KEY,
    auditorId INTEGER NOT NULL,
    fileName TEXT NOT NULL,
    mimeType TEXT,
    fileSize INTEGER,
    fileHash TEXT NOT NULL,
    fileData BYTEA NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_auditor_files_name
    ON auditor_files (auditorId, fileName);

CREATE INDEX IF NOT EXISTS idx_auditor_files_auditor
    ON auditor_files (auditorId);

-- Delay causes lookup table
CREATE TABLE causes (
    causeId SERIAL PRIMARY KEY,
    cause VARCHAR(200) NOT NULL UNIQUE
);

-- Indexes for performance
CREATE INDEX idx_nc_schedule ON nonconformances(scheduleId);
CREATE INDEX idx_nc_type ON nonconformances(type);
CREATE INDEX idx_nc_severity ON nonconformances(severity);
CREATE INDEX idx_nc_section_subsection ON nonconformances(section, subsection);

-- Insert existing data
INSERT INTO nonconformances (ncId, scheduleId, type, severity, section, subsection, question, response, auditorComment, details, AIN, division, sector, qma, other, files) VALUES
(1, 8176, 'PEQ', NULL, NULL, NULL, 'Are supplier quality agreements current and regularly reviewed?', 'Supplier quality agreements are maintained and reviewed annually. However, three critical suppliers have expired agreements beyond the 12-month requirement.', 'Quality agreements for Supplier A, B, and C expired 8-14 months ago without renewal. This represents a gap in the supplier management process.', '', '', '[6]', '[]', '[]', '[]', '[]'),
(2, 8176, 'PEQ', NULL, NULL, NULL, 'Is the Engineering Change Request approval process timely and effective?', 'Engineering Change Request approval process is documented and generally followed. Average approval time is 8.5 days against a 10-day target.', 'Review of Q1 2026 ECRs showed 12 of 45 exceeded the 10-day target, with delays up to 18 days. Process works but has occasional delays.', '', '', '[]', '[4]', '[]', '[]', '[]'),
(3, 8176, 'ETQ', NULL, NULL, NULL, 'Are corrective actions from previous audits closed?', 'Corrective actions from the December 2025 audit have been reviewed. 8 of 10 actions are closed. Two minor observations remain open with approved extensions.', 'CAR-2025-045 and CAR-2025-089 have approved extensions to April 30, 2026 due to resource constraints. Progress is being tracked.', '', '', '[]', '[]', '[1]', '[]', '[]'),
(4, 8176, '1', NULL, 4, 1, 'How does the organization determine and monitor external and internal issues affecting the QMS?', 'Organization context analysis processes are established per AS9100 4.1 requirements. External and internal issues affecting the QMS are documented in the strategic planning documentation.', 'While processes are well-documented, execution has gaps. Specifically, the annual review timing requirements are not consistently met.', '', '', '[]', '[]', '[]', '[14,15]', '[]'),
(5, 8176, '1', NULL, 4, 2, 'How are interested parties and their requirements identified and maintained?', 'Interested parties identification process follows AS9100 4.2 requirements. Stakeholders are identified, reviewed, and documented in the strategic planning system.', 'Process is effective overall. Documentation could be improved but does not represent a nonconformance.', '', '', '[7]', '[]', '[]', '[]', '[]'),
(6, 3245, 'ETQ', NULL, NULL, NULL, 'Are records maintained and accessible?', 'Records are maintained in accordance with the records retention schedule. Electronic records are backed up daily. Physical records are stored in controlled access areas.', 'Records management is well-controlled. Both electronic and physical records are appropriately maintained and accessible.', 'Spot check of 25 quality records showed 100% compliance with retention requirements.', '', '[]', '[5]', '[]', '[]', '[]'),
(7, 5431, 'PEQ', NULL, NULL, NULL, 'Are configuration management processes effective and current?', 'Configuration management processes are documented and implemented. Configuration baselines are established and controlled per EIA-649.', 'As-built documentation completion times are exceeding targets. This affects configuration status accounting accuracy.', 'Average as-built completion time is 38 days vs 30-day target. 47% of assemblies exceed target.', 'AIN-2026-004', '[8]', '[]', '[]', '[]', '[111,112]'),
(8, 7123, '1', NULL, 4, 3, 'How is the QMS scope determined and documented?', 'QMS scope is established per AS9100 4.3 requirements. Scope boundaries are documented and communicated to interested parties.', 'The QMS scope documentation is mature and effective. Scope is clearly defined and properly communicated.', 'QMS scope reviewed. Covers all sites and products. Exclusions properly justified and documented.', '', '[]', '[]', '[2,3]', '[]', '[113]'),
(9, 7123, 'ETQ', NULL, NULL, NULL, 'Is there evidence of continuous improvement?', 'Continuous improvement initiatives are tracked through the Kaizen system. 47 improvement projects completed in 2025, resulting in $2.3M in cost savings.', 'Strong continuous improvement culture is evident. Metrics demonstrate significant value generation.', 'Improvement tracking system shows active engagement across all divisions. ROI tracking is comprehensive.', '', '[]', '[]', '[]', '[16,17]', '[114,115]'),
(10, 8176, 'ETQ', NULL, NULL, NULL, 'Are the audit criteria clearly defined and understood?', 'Audit criteria were defined in the audit plan and communicated during opening meeting. All auditees confirmed understanding of scope and requirements.', 'Clear communication and understanding of audit criteria throughout the audit.', '', '', '[6,7]', '[]', '[]', '[]', '[]'),
(11, 3245, '1', NULL, 4, 2, 'Are interested parties properly identified and monitored?', 'The organization has determined interested parties and their requirements relevant to the QMS per AS9100 4.2.', 'Interested parties identification is appropriate. No gaps identified in stakeholder analysis or requirements determination.', 'Stakeholder register current. Customer, regulatory, and supplier requirements documented.', '', '[]', '[4,5]', '[]', '[]', '[]'),
(12, 9187, 'PEQ', NULL, NULL, NULL, 'Are supplier cybersecurity assessments current and comprehensive?', 'Cybersecurity assessments of critical suppliers are documented. However, periodic reassessments are not consistently performed per the 12-month requirement.', '12 of 45 critical suppliers have not been reassessed in over 24 months. This is a gap in the supplier risk management process.', 'Initial cybersecurity assessments completed for all critical suppliers. Reassessment tracking not automated.', 'AIN-2026-005', '[]', '[]', '[1]', '[]', '[116,117,118]');

-- Seed standard texts (AS9100 Rev D = standardId 1)
INSERT INTO standard_texts (standardId, section, subsection, text) VALUES
(1, 4, 1, '### 4.1 Understanding the organization and its context\n\nThe organization shall determine external and internal issues that are relevant to its purpose and strategic direction and that affect its ability to achieve the intended results of its quality management system.'),
(1, 4, 2, '### 4.2 Understanding the needs and expectations of interested parties\n\nThe organization shall determine the interested parties that are relevant to the quality management system and the requirements of these interested parties.'),
(1, 4, 3, '### 4.3 Determining the scope of the quality management system\n\nThe organization shall determine the boundaries and applicability of the quality management system to establish its scope.'),
(2, 4, 1, '### 4.1 Understanding the organization and its context\n\nThe organization shall determine external and internal issues relevant to its purpose and strategic direction that affect its ability to achieve the intended results of its quality management system.'),
(2, 4, 2, '### 4.2 Understanding the needs and expectations of interested parties\n\nThe organization shall determine interested parties relevant to the quality management system and the requirements of these interested parties.'),
(3, 5, 1, '### 5.1 Leadership and commitment\n\nTop management shall demonstrate leadership and commitment to the information security management system.'),
(3, 5, 2, '### 5.2 Information security policy\n\nTop management shall establish an information security policy that is appropriate to the purpose of the organization.')
ON CONFLICT (standardId, section, subsection) DO NOTHING;



-- Reset sequence to continue from max ID
SELECT setval('nonconformances_ncid_seq', (SELECT MAX(ncId) FROM nonconformances));
