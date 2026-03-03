-- Complete database migration script
-- Run this with: psql audit_db < migrate-all-data.sql

\c audit_db;

-- Create all lookup tables
CREATE TABLE IF NOT EXISTS audit_types (
    auditTypeId SERIAL PRIMARY KEY,
    auditTypeName VARCHAR(50) NOT NULL UNIQUE,
    active INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS int_ext (
    intExtId SERIAL PRIMARY KEY,
    intExtName VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS functions (
    functionId SERIAL PRIMARY KEY,
    functionName VARCHAR(100) NOT NULL UNIQUE,
    active INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS statuses (
    statusId SERIAL PRIMARY KEY,
    statusName VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS standards (
    standardId SERIAL PRIMARY KEY,
    standardName VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS standard_texts (
    standardId INTEGER NOT NULL,
    section INTEGER NOT NULL,
    subsection INTEGER NOT NULL,
    text TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_standard_texts
    ON standard_texts (standardId, section, subsection);

CREATE TABLE IF NOT EXISTS auditor_files (
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

CREATE TABLE IF NOT EXISTS programs (
    programId SERIAL PRIMARY KEY,
    programName VARCHAR(100) NOT NULL UNIQUE,
    divisionId INTEGER,
    active INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS divisions (
    divisionId SERIAL PRIMARY KEY,
    divisionName VARCHAR(100) NOT NULL UNIQUE,
    sectorId INTEGER,
    active INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS sectors (
    sectorId SERIAL PRIMARY KEY,
    sectorName VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS sites (
    siteId SERIAL PRIMARY KEY,
    address VARCHAR(200) NOT NULL UNIQUE,
    city VARCHAR(100),
    state VARCHAR(50),
    country VARCHAR(100),
    divisionId INTEGER,
    active INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS business_units (
    businessUnitId SERIAL PRIMARY KEY,
    businessUnitName VARCHAR(100) NOT NULL UNIQUE,
    divisionId INTEGER,
    active INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS operating_units (
    operatingUnitId SERIAL PRIMARY KEY,
    operatingUnitName VARCHAR(100) NOT NULL UNIQUE,
    divisionId INTEGER,
    active INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS roster (
    myId VARCHAR(6) PRIMARY KEY,
    rosterName VARCHAR(100) NOT NULL,
    networkId VARCHAR(6),
    email VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS auditors (
    auditorId SERIAL PRIMARY KEY,
    fName VARCHAR(100) NOT NULL,
    lName VARCHAR(100) NOT NULL,
    myId VARCHAR(6),
    admin INTEGER DEFAULT 0,
    divisionId INTEGER,
    active INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS safety_equipment (
    safetyEquipmentId SERIAL PRIMARY KEY,
    safetyEquipmentName VARCHAR(100) NOT NULL UNIQUE,
    active INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS training_requirements (
    trainingRequirementId SERIAL PRIMARY KEY,
    trainingRequirementName VARCHAR(100) NOT NULL UNIQUE,
    active INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS severities (
    severityId SERIAL PRIMARY KEY,
    severity VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS causes (
    causeId SERIAL PRIMARY KEY,
    cause VARCHAR(200) NOT NULL UNIQUE,
    active INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS everytimequestions (
    etqId SERIAL PRIMARY KEY,
    question VARCHAR(255) NOT NULL,
    divisionId INTEGER NOT NULL,
    active INT DEFAULT 1
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_everytimequestions_question_division
    ON everytimequestions (question, divisionId);

CREATE TABLE IF NOT EXISTS props (
    propId SERIAL PRIMARY KEY,
    prOP VARCHAR(200) NOT NULL,
    sectorId INTEGER,
    divisionId INTEGER,
    siteId INTEGER,
    buId INTEGER,
    ouId INTEGER,
    programId INTEGER,
    propTypeId INTEGER,
    active INTEGER DEFAULT 1
);

-- Create audits table
CREATE TABLE IF NOT EXISTS audits (
    scheduleId SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    auditTypeId INTEGER,
    intExtId INTEGER,
    functionId INTEGER,
    standardIds JSONB DEFAULT '[]',
    statusId INTEGER,
    stage INTEGER,
    expectedStartDate DATE,
    expectedCompletionDate DATE,
    startDate DATE,
    divisionId INTEGER,
    programIds JSONB DEFAULT '[]',
    sectorId INTEGER,
    siteIds JSONB DEFAULT '[]',
    businessUnitIds JSONB DEFAULT '[]',
    operatingUnitIds JSONB DEFAULT '[]',
    leadAuditorId INTEGER,
    additionalAuditorIds JSONB DEFAULT '[]',
    comment TEXT,
    scope TEXT,
    safety INTEGER DEFAULT 0,
    clearance INTEGER DEFAULT 0,
    safetyEquipmentIds JSONB DEFAULT '[]',
    trainingRequirementIds JSONB DEFAULT '[]',
    famaIds JSONB DEFAULT '[]',
    intervieweeIds JSONB DEFAULT '[]',
    specialConsiderations TEXT,
    overview TEXT,
    evaluator VARCHAR(100),
    relatedItems TEXT,
    programManager VARCHAR(100),
    maLeadManager VARCHAR(100),
    approver VARCHAR(10),
    additionalapprovers JSONB DEFAULT '[]',
    delayCause INTEGER,
    approvedAt TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS approvals (
    approvalId SERIAL PRIMARY KEY,
    scheduleId INTEGER NOT NULL,
    approverMyId VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    requestedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approvedAt TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(scheduleId, approverMyId)
);

CREATE TABLE IF NOT EXISTS email_outbox (
    emailId SERIAL PRIMARY KEY,
    toAddress TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert lookup data
INSERT INTO audit_types (auditTypeId, auditTypeName) VALUES
(1, 'Internal'),
(2, 'External'),
(3, 'Supplier'),
(4, 'Customer'),
(5, 'Certification')
ON CONFLICT (auditTypeName) DO NOTHING;

INSERT INTO int_ext (intExtId, intExtName) VALUES
(1, 'Internal'),
(2, 'External')
ON CONFLICT (intExtName) DO NOTHING;

INSERT INTO functions (functionId, functionName) VALUES
(1, 'Quality Management'),
(2, 'Information Security'),
(3, 'Maintenance & Repair'),
(4, 'Environmental Compliance'),
(5, 'Software Development'),
(6, 'Supply Chain Management'),
(7, 'Occupational Safety'),
(8, 'Configuration Management'),
(9, 'Program Management'),
(10, 'Training & Development')
ON CONFLICT (functionName) DO NOTHING;

INSERT INTO statuses (statusId, statusName) VALUES
(1, 'Scheduled'),
(2, 'In Progress'),
(3, 'Completed'),
(4, 'Cancelled'),
(5, 'On Hold')
ON CONFLICT (statusName) DO NOTHING;

INSERT INTO severities (severityId, severity) VALUES
(1, 'Low'),
(2, 'Medium'),
(3, 'High'),
(4, 'Critical')
ON CONFLICT (severity) DO NOTHING;

INSERT INTO standards (standardId, standardName) VALUES
(1, 'AS9100 Rev D'),
(2, 'ISO 9001:2015'),
(3, 'ISO 27001:2022'),
(4, 'NIST Cybersecurity Framework'),
(5, 'AS9110 Rev C'),
(6, 'FAA Part 145'),
(7, 'ISO 14001:2015'),
(8, 'EPA Regulations'),
(9, 'CMMI-DEV v2.0'),
(10, 'NIST SP 800-161'),
(11, 'DFARS Cybersecurity'),
(12, 'ISO 45001:2018'),
(13, 'EIA-649-B'),
(14, 'AS9100 Rev D Section 7.5.3'),
(15, 'PMI PMBOK 6th Edition'),
(16, 'EIA-748 EVMS'),
(17, 'AS9100 7.2'),
(18, 'ISO 9001 7.2')
ON CONFLICT (standardName) DO NOTHING;

INSERT INTO standard_texts (standardId, section, subsection, text) VALUES
(1, 4, 1, '### 4.1 Understanding the organization and its context\n\nThe organization shall determine external and internal issues that are relevant to its purpose and strategic direction and that affect its ability to achieve the intended results of its quality management system.'),
(1, 4, 2, '### 4.2 Understanding the needs and expectations of interested parties\n\nThe organization shall determine the interested parties that are relevant to the quality management system and the requirements of these interested parties.'),
(1, 4, 3, '### 4.3 Determining the scope of the quality management system\n\nThe organization shall determine the boundaries and applicability of the quality management system to establish its scope.'),
(2, 4, 1, '### 4.1 Understanding the organization and its context\n\nThe organization shall determine external and internal issues relevant to its purpose and strategic direction that affect its ability to achieve the intended results of its quality management system.'),
(2, 4, 2, '### 4.2 Understanding the needs and expectations of interested parties\n\nThe organization shall determine interested parties relevant to the quality management system and the requirements of these interested parties.'),
(3, 5, 1, '### 5.1 Leadership and commitment\n\nTop management shall demonstrate leadership and commitment to the information security management system.'),
(3, 5, 2, '### 5.2 Information security policy\n\nTop management shall establish an information security policy that is appropriate to the purpose of the organization.')
ON CONFLICT (standardId, section, subsection) DO NOTHING;

INSERT INTO programs (programId, programName, divisionId) VALUES
(1, 'Program Alpha', 1),
(2, 'Program Beta', 1),
(3, 'Secure Communications', 2),
(4, 'Cyber Defense', 2),
(5, 'Aircraft Maintenance', 1),
(6, 'Component Overhaul', 1),
(7, 'Satellite Manufacturing', 3),
(8, 'Propulsion Systems', 3),
(9, 'Command & Control Systems', 2),
(10, 'Mission Planning Software', 2),
(11, 'Electronic Warfare', 2),
(12, 'Radar Systems', 2),
(13, 'F-35 Manufacturing', 1),
(14, 'B-21 Assembly', 1),
(15, 'GPS III', 3),
(16, 'James Webb Space Telescope Ground Systems', 3),
(17, 'IBCS', 2),
(18, 'AARGM-ER', 1),
(999, 'All Programs', NULL)
ON CONFLICT (programName) DO NOTHING;

INSERT INTO divisions (divisionId, divisionName, sectorId) VALUES
(1, 'Aeronautics Systems', 1),
(2, 'Mission Systems', 1),
(3, 'Space Systems', 2),
(4, 'Corporate', 1)
ON CONFLICT (divisionName) DO NOTHING;

INSERT INTO everytimequestions (question, divisionId)
SELECT q.question, d.divisionId
FROM (VALUES
    ('Are the audit criteria clearly defined and understood?'),
    ('Are records maintained and accessible?'),
    ('Is there evidence of continuous improvement?'),
    ('Are corrective actions from previous audits closed?')
) AS q(question)
CROSS JOIN divisions d
ON CONFLICT (question, divisionId) DO NOTHING;

INSERT INTO sectors (sectorId, sectorName) VALUES
(1, 'Defense Systems'),
(2, 'Space')
ON CONFLICT (sectorName) DO NOTHING;

INSERT INTO sites (siteId, address, city, state, country, divisionId, active) VALUES
(1, 'Plant 42 - Palmdale', NULL, NULL, NULL, 1, 1),
(2, 'Annapolis Junction, MD', NULL, NULL, NULL, 2, 1),
(3, 'Lake Charles, LA', NULL, NULL, NULL, 1, 1),
(4, 'Redondo Beach, CA', NULL, NULL, NULL, 3, 1),
(5, 'McLean, VA', NULL, NULL, NULL, 2, 1),
(6, 'Baltimore, MD', NULL, NULL, NULL, 2, 1),
(7, 'Palmdale, CA', NULL, NULL, NULL, 1, 1),
(8, 'Azusa, CA', NULL, NULL, NULL, 3, 1),
(9, 'Woodland Hills, CA', NULL, NULL, NULL, 3, 1),
(10, 'Oklahoma City, OK', NULL, NULL, NULL, 1, 1)
ON CONFLICT (address) DO NOTHING;

INSERT INTO business_units (businessUnitId, businessUnitName, divisionId) VALUES
(1, 'Air Dominance', 1),
(2, 'Cyber & Intelligence', 2),
(3, 'Global Logistics & Modernization', 1),
(4, 'Space Systems', 3),
(5, 'C4ISR', 2),
(6, 'Electronic Systems', 2),
(7, 'Space Launch', 3),
(8, 'Strike & Missiles', 1),
(9, 'Defense Services', 1)
ON CONFLICT (businessUnitName) DO NOTHING;

INSERT INTO operating_units (operatingUnitId, operatingUnitName, divisionId) VALUES
(1, 'Advanced Development', 1),
(2, 'Information Assurance', 2),
(3, 'MRO Services', 1),
(4, 'Manufacturing', 1),
(5, 'Software Engineering', 2),
(6, 'Procurement', 1),
(7, 'Final Assembly', 1),
(8, 'Engineering', 1),
(9, 'Program Management Office', 2),
(10, 'Learning & Development', 4)
ON CONFLICT (operatingUnitName) DO NOTHING;

WITH roster_names(rosterName) AS (
    VALUES
        ('Anderson, Michael'),
        ('Brown, Jennifer'),
        ('Chen, David'),
        ('Davis, Sarah'),
        ('Garcia, Thomas'),
        ('Johnson, Lisa'),
        ('Lee, Robert'),
        ('Martinez, Patricia'),
        ('Miller, James'),
        ('Moore, Linda'),
        ('Rodriguez, Kevin'),
        ('Smith, Amanda'),
        ('Taylor, Christopher'),
        ('Thompson, Mary'),
        ('White, Richard'),
        ('Wilson, Elizabeth'),
        ('Young, Daniel'),
        ('Harris, Barbara'),
        ('Clark, Matthew'),
        ('Lewis, Susan')
),
ranked AS (
    SELECT rosterName, ROW_NUMBER() OVER (ORDER BY rosterName) AS rn
    FROM roster_names
)
INSERT INTO roster (myId, rosterName, networkId)
SELECT
    CASE WHEN ranked.rn % 2 = 0 THEN 'C' || LPAD(ranked.rn::text, 5, '0')
         ELSE 'A' || LPAD(ranked.rn::text, 5, '0') END,
    ranked.rosterName,
    CASE WHEN ranked.rn % 2 = 0 THEN 'B' || LPAD(ranked.rn::text, 5, '0')
         ELSE 'A' || LPAD(ranked.rn::text, 5, '0') END
FROM ranked
ON CONFLICT (myId) DO NOTHING;

UPDATE roster
SET email = CONCAT(
    regexp_replace(lower(trim(split_part(rostername, ',', 2))), '[^a-z0-9]+', '', 'g'),
    '.',
    regexp_replace(lower(trim(split_part(rostername, ',', 1))), '[^a-z0-9]+', '', 'g'),
    '@walterosborne.com'
)
WHERE email IS NULL;

INSERT INTO auditors (auditorId, lName, fName, admin, active) VALUES
(1, 'Smith', 'John', 1, 1),
(2, 'Martinez', 'Carlos', 1, 1),
(3, 'Thompson', 'James', 0, 1),
(4, 'Green', 'Patricia', 0, 1),
(5, 'Kumar', 'Priya', 0, 1),
(6, 'Anderson', 'Michelle', 0, 1),
(7, 'Williams', 'David', 0, 1),
(8, 'Chen', 'Robert', 0, 1),
(9, 'Rodriguez', 'Maria', 0, 1),
(10, 'Mitchell', 'Karen', 0, 1),
(11, 'Johnson', 'Sarah', 0, 1),
(12, 'Williams', 'Michael', 0, 1),
(13, 'Brown', 'Jennifer', 0, 1),
(14, 'Garcia', 'Maria', 0, 1),
(15, 'Rodriguez', 'Luis', 0, 1),
(16, 'White', 'Rebecca', 0, 1),
(17, 'Harris', 'Daniel', 0, 1),
(18, 'Brown', 'Michael', 0, 1),
(19, 'Davis', 'Jennifer', 0, 1),
(20, 'O''Brien', 'Sean', 0, 1),
(21, 'Nguyen', 'Tina', 0, 1),
(22, 'Jackson', 'Marcus', 0, 1),
(23, 'Taylor', 'Christopher', 0, 1),
(24, 'Moore', 'Jessica', 0, 1),
(25, 'Brown', 'Sarah', 0, 1),
(26, 'Johnson', 'Mark', 0, 1),
(27, 'Garcia', 'Lisa', 0, 1),
(28, 'Patel', 'Anika', 0, 1),
(29, 'Robinson', 'James', 0, 1),
(30, 'Kim', 'Daniel', 0, 1),
(31, 'Foster', 'Amanda', 0, 1),
(32, 'Turner', 'Paul', 0, 1)
ON CONFLICT (auditorId) DO NOTHING;

-- Match auditor myId to roster by name when possible
UPDATE auditors a
SET myId = r.myId
FROM roster r
WHERE LOWER(TRIM(CONCAT(a.lName, ', ', a.fName))) = LOWER(TRIM(r.rosterName));

-- Capture the division from the roster match
-- Assign remaining auditor myId values
WITH missing AS (
    SELECT auditorId, ROW_NUMBER() OVER (ORDER BY auditorId) AS rn
    FROM auditors
    WHERE myId IS NULL
)
UPDATE auditors a
SET myId = 'D' || LPAD(missing.rn::text, 5, '0')
FROM missing
WHERE a.auditorId = missing.auditorId;

-- Add auditors to roster when missing
INSERT INTO roster (rosterName, networkId, myId)
SELECT CONCAT(a.lName, ', ', a.fName),
       'E' || LPAD(ROW_NUMBER() OVER (ORDER BY a.auditorId)::text, 5, '0'),
       a.myId
FROM auditors a
LEFT JOIN roster r ON LOWER(TRIM(r.rosterName)) = LOWER(TRIM(CONCAT(a.lName, ', ', a.fName)))
WHERE r.myId IS NULL;

UPDATE roster
SET email = CONCAT(
    regexp_replace(lower(trim(split_part(rostername, ',', 2))), '[^a-z0-9]+', '', 'g'),
    '.',
    regexp_replace(lower(trim(split_part(rostername, ',', 1))), '[^a-z0-9]+', '', 'g'),
    '@walterosborne.com'
)
WHERE email IS NULL;

-- Add a test user with no audits
INSERT INTO auditors (lName, fName, myId)
SELECT 'Lopez', 'Jamie', 'Y12345'
WHERE NOT EXISTS (
    SELECT 1 FROM auditors WHERE LOWER(TRIM(CONCAT(lName, ', ', fName))) = LOWER(TRIM('Lopez, Jamie'))
);

INSERT INTO roster (rosterName, networkId, myId)
SELECT 'Lopez, Jamie', 'Z12345', 'Y12345'
WHERE NOT EXISTS (
    SELECT 1 FROM roster WHERE LOWER(TRIM(rosterName)) = LOWER(TRIM('Lopez, Jamie'))
);

-- Add a roster-only test user (not an auditor)
INSERT INTO roster (rosterName, networkId, myId)
SELECT 'Nguyen, Alex', 'R12345', 'X12345'
WHERE NOT EXISTS (
    SELECT 1 FROM roster WHERE LOWER(TRIM(rosterName)) = LOWER(TRIM('Nguyen, Alex'))
);

INSERT INTO safety_equipment (safetyEquipmentId, safetyEquipmentName, active) VALUES
(1, 'Hard Hat', 1),
(2, 'Safety Glasses', 1),
(3, 'Steel-Toe Boots', 1),
(4, 'Hearing Protection', 1),
(5, 'Respirator', 1),
(6, 'Fall Protection Harness', 1),
(7, 'ESD Wrist Strap', 1),
(8, 'Chemical Resistant Gloves', 1),
(9, 'Clean Room Garments', 1),
(10, 'High-Visibility Vest', 1)
ON CONFLICT (safetyEquipmentName) DO NOTHING;

INSERT INTO training_requirements (trainingRequirementId, trainingRequirementName, active) VALUES
(1, 'Safety Orientation', 1),
(2, 'Security Awareness', 1),
(3, 'FOD Prevention', 1),
(4, 'Hazardous Materials Handling', 1),
(5, 'Confined Space Entry', 1),
(6, 'Lockout/Tagout', 1),
(7, 'Forklift Operation', 1),
(8, 'Clean Room Protocols', 1),
(9, 'Respirator Fit Test', 1),
(10, 'Fall Protection', 1),
(11, 'Electrical Safety', 1),
(12, 'Flight Line Safety', 1)
ON CONFLICT (trainingRequirementName) DO NOTHING;

INSERT INTO props (propId, prOP, sectorId, divisionId, siteId, buId, ouId, programId, propTypeId, active) VALUES
(1, 'Corporate Quality Manual', NULL, NULL, NULL, NULL, NULL, NULL, 1, 1),
(2, 'Corporate Environmental Policy', NULL, NULL, NULL, NULL, NULL, NULL, 1, 1),
(3, 'Corporate Safety Standards', NULL, NULL, NULL, NULL, NULL, NULL, 1, 1),
(4, 'Defense Sector Security Requirements', 1, NULL, NULL, NULL, NULL, NULL, 2, 1),
(5, 'Commercial Sector Export Control Procedure', 2, NULL, NULL, NULL, NULL, NULL, 2, 1),
(6, 'Aircraft Division Design Control Procedure', NULL, 1, NULL, NULL, NULL, NULL, 3, 1),
(7, 'Systems Division Software Development Standards', NULL, 2, NULL, NULL, NULL, NULL, 3, 1),
(8, 'Space Division Configuration Management Plan', NULL, 3, NULL, NULL, NULL, NULL, 3, 1),
(9, 'Palmdale Site Facility Access Procedure', NULL, NULL, 1, NULL, NULL, NULL, 4, 1),
(10, 'Edwards Site Flight Line Safety Manual', NULL, NULL, 2, NULL, NULL, NULL, 4, 1),
(11, 'Manufacturing BU Process Control Standards', NULL, NULL, NULL, 1, NULL, NULL, 5, 1),
(12, 'Engineering BU Design Review Checklist', NULL, NULL, NULL, 2, NULL, NULL, 5, 1),
(13, 'Quality Assurance BU Inspection Procedure', NULL, NULL, NULL, 3, NULL, NULL, 5, 1),
(14, 'Advanced Systems OU Technical Data Package Requirements', NULL, NULL, NULL, NULL, 1, NULL, 6, 1),
(15, 'Information Systems OU Cybersecurity Controls', NULL, NULL, NULL, NULL, 2, NULL, 6, 1),
(16, 'Fighter Program Risk Management Plan', NULL, NULL, NULL, NULL, NULL, 1, 7, 1),
(17, 'Bomber Program Configuration Control Board Charter', NULL, NULL, NULL, NULL, NULL, 2, 7, 1),
(18, 'Surveillance Program Software Quality Assurance Plan', NULL, NULL, NULL, NULL, NULL, 3, 7, 1),
(19, 'Trainer Program Supplier Quality Requirements', NULL, NULL, NULL, NULL, NULL, 4, 7, 0),
(20, 'Cargo Program Manufacturing Process Specification', NULL, NULL, NULL, NULL, NULL, 5, 7, 1);

-- Insert audit data (7 audits from audits.js)
INSERT INTO audits (scheduleId, title, auditTypeId, intExtId, functionId, standardIds, statusId, stage, expectedStartDate, expectedCompletionDate, startDate, divisionId, programIds, sectorId, siteIds, businessUnitIds, operatingUnitIds, leadAuditorId, additionalAuditorIds, comment, scope, safety, clearance, safetyEquipmentIds, trainingRequirementIds, famaIds, specialConsiderations, overview, evaluator, relatedItems, programManager, maLeadManager) VALUES
(8176, 'AS9100 Quality Management System Audit', 1, 1, 1, '[1, 2]', 2, 2, '2026-03-15', '2026-03-17', '2026-03-15', 1, '[1, 2]', 1, '[1]', '[1]', '[1]', 1, '[11, 12, 13]', 'Test Comments', 'Comprehensive review of quality management system processes including design controls, supplier management, configuration management, and risk management. Focus on compliance with AS9100 Rev D requirements and effectiveness of corrective action system.', 0, 0, '[2, 3, 4]', '[1, 3, 12]', '[1, 14, 17]', 'Coordinate with production schedule to minimize impact on flight test operations. Some areas may require advance notification for access.', 'The audit was conducted over three days with full cooperation from the quality team. All requested documentation was made available, and key personnel were accessible for interviews. Manufacturing operations were observed during both first and second shift to ensure comprehensive coverage.', 'Smith, John', 'CAR-2025-045, CAR-2025-089', 'Johnson, Sarah', 'Davis, Michael'),

(3245, 'ISO 27001 Information Security Management Audit', 2, 2, 2, '[3, 4]', 3, 4, '2026-02-10', '2026-02-12', '2026-02-10', 2, '[3, 4]', 1, '[2]', '[2]', '[2]', 2, '[14, 15]', '', 'Assessment of information security management system including access controls, incident response, vulnerability management, and data protection measures.', 0, 0, '[2]', '[2]', '[7, 10]', 'Audit of secure systems requires prior coordination with security team. Access to certain systems requires separate approval process.', 'Security audit completed with full access to all required systems and documentation. Information security team provided comprehensive briefings on current threat landscape and control implementation.', 'Martinez, Carlos', 'ISMS-2025-012', 'Chen, Lisa', 'Anderson, Michelle'),

(7892, 'AS9110 MRO Quality System Audit', 1, 1, 3, '[5, 6]', 1, 1, '2026-04-20', '2026-04-22', '2026-04-20', 1, '[5, 6]', 1, '[3]', '[3]', '[3]', 3, '[16, 17]', '', 'Review of maintenance, repair, and overhaul operations including airworthiness compliance, maintenance records, and technical data management.', 0, 1, '[1, 2, 3, 4]', '[1, 3, 12]', '[2, 13, 15]', 'Aircraft maintenance operations are time-sensitive. Schedule audit activities to avoid interfering with critical maintenance windows.', '', '', '', '', ''),

(4521, 'Environmental Management System Audit (ISO 14001)', 1, 1, 4, '[7, 8]', 3, 4, '2026-01-15', '2026-01-16', '2026-01-15', 3, '[7, 8]', 2, '[4]', '[4]', '[4]', 4, '[18, 19]', '', 'Environmental management system audit covering waste management, emissions monitoring, chemical handling, and regulatory compliance.', 0, 1, '[2, 8, 9]', '[1, 4, 9]', '[5, 18, 20]', 'Environmental sampling activities must be coordinated with site environmental coordinator. Weather-dependent activities may require schedule flexibility.', '', '', '', '', ''),

(6034, 'CMMI Level 3 Process Appraisal', 2, 2, 5, '[9]', 2, 3, '2026-03-25', '2026-03-28', '2026-03-25', 2, '[9, 10]', 1, '[5]', '[5]', '[5]', 5, '[20, 21, 22]', '', 'CMMI appraisal covering software development processes including requirements management, configuration management, verification, validation, and measurement.', 0, 0, '[7]', '[2, 8]', '[3, 7, 15, 16]', 'Software development team sprint schedules should be considered. Minimize interruption during critical sprint activities.', '', '', '', '', ''),

(9187, 'Supply Chain Security Audit', 1, 1, 6, '[10, 11]', 3, 4, '2026-02-01', '2026-02-03', '2026-02-01', 2, '[11, 12]', 1, '[6]', '[6]', '[6]', 6, '[23, 24]', '', 'Supply chain security assessment including supplier vetting, counterfeit parts prevention, cyber supply chain risk management, and DFARS compliance.', 0, 1, '[3]', '[1]', '[4, 18]', 'Supplier data is confidential and proprietary. Ensure audit team members have signed appropriate NDAs.', '', '', '', '', ''),

(2658, 'Safety Management System Audit', 1, 1, 7, '[12]', 1, 1, '2026-05-10', '2026-05-12', '2026-05-10', 1, '[13, 14]', 1, '[7]', '[1]', '[7]', 7, '[25, 26, 27]', '', 'Safety management system audit covering hazard identification, risk assessment, incident investigation, safety training, and emergency response.', 0, 1, '[1, 2, 3, 4, 6]', '[1, 10, 11]', '[5, 9, 13]', 'Coordinate with safety manager for access to incident investigation files. Active manufacturing operations may limit interview availability.', '', '', '', '', ''),

(5431, 'Configuration Management Audit', 1, 1, 8, '[13, 14]', 3, 4, '2026-01-20', '2026-01-22', '2026-01-20', 3, '[15, 16]', 2, '[8]', '[7]', '[8]', 8, '[28, 29]', '', 'Configuration management audit covering configuration identification, control, status accounting, and audits per EIA-649 standard.', 0, 1, '[7, 9]', '[8]', '[3, 16]', 'Configuration management database access requires separate account provisioning 48 hours in advance.', '', '', '', '', ''),

(7123, 'Project Management Practices Audit', 1, 1, 9, '[15, 16]', 2, 2, '2026-03-05', '2026-03-07', '2026-03-05', 2, '[17, 18]', 1, '[9]', '[8]', '[9]', 9, '[30, 31]', '', 'Project management audit covering earned value management, risk management, schedule management, and stakeholder communication.', 1, 1, '[]', '[]', '[8, 11, 12]', 'Project managers have limited availability during monthly reporting cycle (last week of each month).', '', '', '', '', ''),

(8942, 'Training Management System Audit', 1, 1, 10, '[17, 18]', 3, 4, '2026-02-15', '2026-02-16', '2026-02-15', 1, '[999]', 1, '[10]', '[9]', '[10]', 10, '[32]', '', 'Training management audit covering training needs analysis, training effectiveness evaluation, competency management, and training records.', 1, 1, '[]', '[]', '[6, 19]', 'Training records contain personally identifiable information. Review must be conducted in secure area with appropriate privacy controls.', '', '', '', '', '');

-- Add dummy audits for a single auditor (matching hardcoded networkId)
WITH lead AS (
    SELECT a.auditorId
    FROM roster r
    JOIN auditors a ON a.myId = r.myId
    WHERE r.networkId = 'E00001'
    LIMIT 1
)
INSERT INTO audits (
    title, auditTypeId, intExtId, functionId, statusId, stage,
    expectedStartDate, expectedCompletionDate, startDate,
    leadAuditorId, additionalAuditorIds
)
SELECT 'Dummy Audit - Schedule Only', 1, 1, 1, 1, 1,
       CURRENT_DATE + INTERVAL '10 days',
       CURRENT_DATE + INTERVAL '12 days', NULL,
       lead.auditorId, '[]'::jsonb
FROM lead
UNION ALL
SELECT 'Dummy Audit - Planning Done', 1, 1, 2, 2, 2,
       CURRENT_DATE - INTERVAL '5 days',
       CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE - INTERVAL '5 days',
       lead.auditorId, '[]'::jsonb
FROM lead
UNION ALL
SELECT 'Dummy Audit - Results Done', 1, 2, 3, 2, 3,
       CURRENT_DATE - INTERVAL '15 days',
       CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE - INTERVAL '15 days',
       lead.auditorId, '[]'::jsonb
FROM lead
UNION ALL
SELECT 'Dummy Audit - Nonconformaties', 2, 2, 4, 3, 4,
       CURRENT_DATE - INTERVAL '25 days',
       CURRENT_DATE - INTERVAL '23 days', CURRENT_DATE - INTERVAL '25 days',
       lead.auditorId, '[]'::jsonb
FROM lead
UNION ALL
SELECT 'Dummy Audit - Pending Approval', 2, 1, 5, 3, 4,
       CURRENT_DATE - INTERVAL '35 days',
       CURRENT_DATE - INTERVAL '33 days', CURRENT_DATE - INTERVAL '35 days',
       lead.auditorId, '[]'::jsonb
FROM lead;

-- Normalize roster references to MyIDs
WITH ranked AS (
    SELECT myId, ROW_NUMBER() OVER (ORDER BY rosterName) AS rn
    FROM roster
)
UPDATE audits a
SET famaIds = COALESCE(
    (SELECT jsonb_agg(r.myId)
     FROM jsonb_array_elements_text(a.famaIds) AS rid
     JOIN ranked r ON r.rn = CASE WHEN rid ~ '^[0-9]+$' THEN rid::int END),
    '[]'::jsonb
)
WHERE EXISTS (SELECT 1 FROM jsonb_array_elements_text(a.famaIds) rid WHERE rid ~ '^[0-9]+$');

WITH ranked AS (
    SELECT myId, ROW_NUMBER() OVER (ORDER BY rosterName) AS rn
    FROM roster
)
UPDATE audits a
SET intervieweeIds = COALESCE(
    (SELECT jsonb_agg(r.myId)
     FROM jsonb_array_elements_text(a.intervieweeIds) AS rid
     JOIN ranked r ON r.rn = CASE WHEN rid ~ '^[0-9]+$' THEN rid::int END),
    '[]'::jsonb
)
WHERE EXISTS (SELECT 1 FROM jsonb_array_elements_text(a.intervieweeIds) rid WHERE rid ~ '^[0-9]+$');

-- Create indexes for audits
CREATE INDEX idx_audits_stage ON audits(stage);
CREATE INDEX idx_audits_division ON audits(divisionId);
CREATE INDEX idx_audits_status ON audits(statusId);
CREATE INDEX idx_audits_lead_auditor ON audits(leadAuditorId);

-- Reset sequences
SELECT setval('audit_types_audittypeid_seq', (SELECT MAX(auditTypeId) FROM audit_types));
SELECT setval('int_ext_intextid_seq', (SELECT MAX(intExtId) FROM int_ext));
SELECT setval('functions_functionid_seq', (SELECT MAX(functionId) FROM functions));
SELECT setval('statuses_statusid_seq', (SELECT MAX(statusId) FROM statuses));
SELECT setval('severities_severityid_seq', (SELECT MAX(severityId) FROM severities));
SELECT setval('standards_standardid_seq', (SELECT MAX(standardId) FROM standards));
SELECT setval('programs_programid_seq', (SELECT MAX(programId) FROM programs));
SELECT setval('divisions_divisionid_seq', (SELECT MAX(divisionId) FROM divisions));
SELECT setval('sectors_sectorid_seq', (SELECT MAX(sectorId) FROM sectors));
SELECT setval('sites_siteid_seq', (SELECT MAX(siteId) FROM sites));
SELECT setval('business_units_businessunitid_seq', (SELECT MAX(businessUnitId) FROM business_units));
SELECT setval('operating_units_operatingunitid_seq', (SELECT MAX(operatingUnitId) FROM operating_units));
SELECT setval('auditors_auditorid_seq', (SELECT MAX(auditorId) FROM auditors));
SELECT setval('safety_equipment_safetyequipmentid_seq', (SELECT MAX(safetyEquipmentId) FROM safety_equipment));
SELECT setval('training_requirements_trainingrequirementid_seq', (SELECT MAX(trainingRequirementId) FROM training_requirements));
SELECT setval('props_propid_seq', (SELECT MAX(propId) FROM props));
SELECT setval('audits_scheduleid_seq', (SELECT MAX(scheduleId) FROM audits));

-- Verify data
SELECT 'Audit Types:', COUNT(*) FROM audit_types;
SELECT 'Functions:', COUNT(*) FROM functions;
SELECT 'Standards:', COUNT(*) FROM standards;
SELECT 'Programs:', COUNT(*) FROM programs;
SELECT 'Divisions:', COUNT(*) FROM divisions;
SELECT 'Sectors:', COUNT(*) FROM sectors;
SELECT 'Sites:', COUNT(*) FROM sites;
SELECT 'Business Units:', COUNT(*) FROM business_units;
SELECT 'Operating Units:', COUNT(*) FROM operating_units;
SELECT 'Roster:', COUNT(*) FROM roster;
SELECT 'Auditors:', COUNT(*) FROM auditors;
SELECT 'Safety Equipment:', COUNT(*) FROM safety_equipment;
SELECT 'Training Requirements:', COUNT(*) FROM training_requirements;
SELECT 'Props:', COUNT(*) FROM props;
SELECT 'Audits:', COUNT(*) FROM audits;
SELECT 'Nonconformances:', COUNT(*) FROM nonconformances;
