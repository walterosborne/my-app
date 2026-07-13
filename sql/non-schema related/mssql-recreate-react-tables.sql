-- Auto-generated MSSQL recreate script for *_r tables
-- Fill in the INSERT ... SELECT queries as needed.

IF OBJECT_ID('dbo.approvals_r', 'U') IS NOT NULL DROP TABLE dbo.approvals_r;
GO
CREATE TABLE dbo.approvals_r (
  approvalid INT IDENTITY(1,1) NOT NULL,
  scheduleid INT NOT NULL,
  status NVARCHAR(20) NOT NULL DEFAULT N'pending',
  requestedat DATETIME2 DEFAULT CURRENT_TIMESTAMP,
  approvedat DATETIME2,
  createdat DATETIME2 DEFAULT CURRENT_TIMESTAMP,
  updatedat DATETIME2 DEFAULT CURRENT_TIMESTAMP,
  approvermyid NVARCHAR(10),
  PRIMARY KEY (approvalid)
);
GO
SET IDENTITY_INSERT dbo.approvals_r ON;
-- TODO: INSERT INTO dbo.approvals_r (...)
--       SELECT ...
SET IDENTITY_INSERT dbo.approvals_r OFF;

IF OBJECT_ID('dbo.audit_types_r', 'U') IS NOT NULL DROP TABLE dbo.audit_types_r;
GO
CREATE TABLE dbo.audit_types_r (
  audittypeid INT IDENTITY(1,1) NOT NULL,
  audittypename NVARCHAR(50) NOT NULL,
  active INT DEFAULT 1,
  PRIMARY KEY (audittypeid)
);
GO
SET IDENTITY_INSERT dbo.audit_types_r ON;
-- TODO: INSERT INTO dbo.audit_types_r (...)
--       SELECT ...
SET IDENTITY_INSERT dbo.audit_types_r OFF;

IF OBJECT_ID('dbo.auditor_files_r', 'U') IS NOT NULL DROP TABLE dbo.auditor_files_r;
GO
CREATE TABLE dbo.auditor_files_r (
  fileid INT IDENTITY(1,1) NOT NULL,
  auditorid INT NOT NULL,
  filename NVARCHAR(MAX) NOT NULL,
  mimetype NVARCHAR(MAX),
  filesize INT,
  filehash NVARCHAR(MAX) NOT NULL,
  filedata VARBINARY(MAX) NOT NULL,
  createdat DATETIME2 DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (fileid)
);
GO
SET IDENTITY_INSERT dbo.auditor_files_r ON;
-- TODO: INSERT INTO dbo.auditor_files_r (...)
--       SELECT ...
SET IDENTITY_INSERT dbo.auditor_files_r OFF;

IF OBJECT_ID('dbo.auditors_r', 'U') IS NOT NULL DROP TABLE dbo.auditors_r;
GO
CREATE TABLE dbo.auditors_r (
  auditorid INT IDENTITY(1,1) NOT NULL,
  myid NVARCHAR(6),
  admin INT DEFAULT 0,
  divisionid INT,
  cuiapproved INT DEFAULT 0,
  active INT DEFAULT 1,
  fname NVARCHAR(100),
  lname NVARCHAR(100),
  PRIMARY KEY (auditorid)
);
GO
SET IDENTITY_INSERT dbo.auditors_r ON;
-- TODO: INSERT INTO dbo.auditors_r (...)
--       SELECT ...
SET IDENTITY_INSERT dbo.auditors_r OFF;

IF OBJECT_ID('dbo.auditor_program_assignments_r', 'U') IS NOT NULL DROP TABLE dbo.auditor_program_assignments_r;
GO
CREATE TABLE dbo.auditor_program_assignments_r (
  auditorid INT NOT NULL,
  programid INT NOT NULL,
  PRIMARY KEY (auditorid, programid)
);
GO
-- TODO: INSERT INTO dbo.auditor_program_assignments_r (...)
--       SELECT ...

IF OBJECT_ID('dbo.audits_r', 'U') IS NOT NULL DROP TABLE dbo.audits_r;
GO
CREATE TABLE dbo.audits_r (
  scheduleid INT IDENTITY(1,1) NOT NULL,
  title NVARCHAR(200) NOT NULL,
  audittypeid INT,
  intextid INT,
  functionid NVARCHAR(MAX) DEFAULT N'[]',
  standardids NVARCHAR(MAX) DEFAULT N'[]',
  statusid INT,
  expectedstartdate DATE,
  expectedcompletiondate DATE,
  startdate DATE,
  divisionid NVARCHAR(MAX) DEFAULT N'[]',
  programids NVARCHAR(MAX) DEFAULT N'[]',
  sectorid INT,
  siteids NVARCHAR(MAX) DEFAULT N'[]',
  businessunitids NVARCHAR(MAX) DEFAULT N'[]',
  operatingunitids NVARCHAR(MAX) DEFAULT N'[]',
  leadauditorid INT,
  additionalauditorids NVARCHAR(MAX) DEFAULT N'[]',
  comment NVARCHAR(MAX),
  scope NVARCHAR(MAX),
  safety INT DEFAULT 0,
  clearance INT DEFAULT 0,
  safetyequipmentids NVARCHAR(MAX) DEFAULT N'[]',
  trainingrequirementids NVARCHAR(MAX) DEFAULT N'[]',
  famaids NVARCHAR(MAX) DEFAULT N'[]',
  specialconsiderations NVARCHAR(MAX),
  overview NVARCHAR(MAX),
  evaluator NVARCHAR(100),
  relateditems NVARCHAR(MAX),
  programmanager NVARCHAR(100),
  maleadmanager NVARCHAR(100),
  cui INT DEFAULT 0,
  createdat DATETIME2 DEFAULT CURRENT_TIMESTAMP,
  updatedat DATETIME2 DEFAULT CURRENT_TIMESTAMP,
  intervieweeids NVARCHAR(MAX) DEFAULT N'[]',
  hash NVARCHAR(20),
  auditorstime INT,
  locked BIT DEFAULT 0,
  stage INT NOT NULL,
  delaycause INT,
  approvedat DATETIME2,
  approver NVARCHAR(10),
  additionalapprovers NVARCHAR(MAX) DEFAULT N'[]',
  submittedat DATETIME2,
  PRIMARY KEY (scheduleid)
);
GO
SET IDENTITY_INSERT dbo.audits_r ON;
-- TODO: INSERT INTO dbo.audits_r (...)
--       SELECT ...
SET IDENTITY_INSERT dbo.audits_r OFF;

IF OBJECT_ID('dbo.business_units_r', 'U') IS NOT NULL DROP TABLE dbo.business_units_r;
GO
CREATE TABLE dbo.business_units_r (
  businessunitid INT IDENTITY(1,1) NOT NULL,
  businessunitname NVARCHAR(100) NOT NULL,
  divisionid INT,
  active INT DEFAULT 1,
  PRIMARY KEY (businessunitid)
);
GO
SET IDENTITY_INSERT dbo.business_units_r ON;
-- TODO: INSERT INTO dbo.business_units_r (...)
--       SELECT ...
SET IDENTITY_INSERT dbo.business_units_r OFF;

IF OBJECT_ID('dbo.cars_r', 'U') IS NOT NULL DROP TABLE dbo.cars_r;
GO
CREATE TABLE dbo.cars_r (
  carid INT IDENTITY(1,1) NOT NULL,
  scheduleid INT NOT NULL,
  car NVARCHAR(255) NOT NULL,
  reviewer NVARCHAR(10),
  effective SMALLINT,
  PRIMARY KEY (carid)
);
GO
SET IDENTITY_INSERT dbo.cars_r ON;
-- TODO: INSERT INTO dbo.cars_r (...)
--       SELECT ...
SET IDENTITY_INSERT dbo.cars_r OFF;

IF OBJECT_ID('dbo.causes_r', 'U') IS NOT NULL DROP TABLE dbo.causes_r;
GO
CREATE TABLE dbo.causes_r (
  causeid INT IDENTITY(1,1) NOT NULL,
  cause NVARCHAR(200) NOT NULL,
  active INT DEFAULT 1,
  PRIMARY KEY (causeid)
);
GO
SET IDENTITY_INSERT dbo.causes_r ON;
-- TODO: INSERT INTO dbo.causes_r (...)
--       SELECT ...
SET IDENTITY_INSERT dbo.causes_r OFF;

IF OBJECT_ID('dbo.divisions_r', 'U') IS NOT NULL DROP TABLE dbo.divisions_r;
GO
CREATE TABLE dbo.divisions_r (
  divisionid INT IDENTITY(1,1) NOT NULL,
  divisionname NVARCHAR(100) NOT NULL,
  sectorid INT,
  active INT DEFAULT 1,
  leadid INT,
  PRIMARY KEY (divisionid)
);
GO
SET IDENTITY_INSERT dbo.divisions_r ON;
-- TODO: INSERT INTO dbo.divisions_r (...)
--       SELECT ...
SET IDENTITY_INSERT dbo.divisions_r OFF;

IF OBJECT_ID('dbo.email_outbox_r', 'U') IS NOT NULL DROP TABLE dbo.email_outbox_r;
GO
CREATE TABLE dbo.email_outbox_r (
  emailid INT IDENTITY(1,1) NOT NULL,
  toaddress NVARCHAR(MAX) NOT NULL,
  subject NVARCHAR(MAX) NOT NULL,
  body NVARCHAR(MAX) NOT NULL,
  createdat DATETIME2 DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (emailid)
);
GO
SET IDENTITY_INSERT dbo.email_outbox_r ON;
-- TODO: INSERT INTO dbo.email_outbox_r (...)
--       SELECT ...
SET IDENTITY_INSERT dbo.email_outbox_r OFF;

IF OBJECT_ID('dbo.everytimequestions_r', 'U') IS NOT NULL DROP TABLE dbo.everytimequestions_r;
GO
CREATE TABLE dbo.everytimequestions_r (
  etqid INT IDENTITY(1,1) NOT NULL,
  question NVARCHAR(255) NOT NULL,
  divisionid INT NOT NULL,
  active INT DEFAULT 1,
  PRIMARY KEY (etqid)
);
GO
SET IDENTITY_INSERT dbo.everytimequestions_r ON;
-- TODO: INSERT INTO dbo.everytimequestions_r (...)
--       SELECT ...
SET IDENTITY_INSERT dbo.everytimequestions_r OFF;

IF OBJECT_ID('dbo.functions_r', 'U') IS NOT NULL DROP TABLE dbo.functions_r;
GO
CREATE TABLE dbo.functions_r (
  functionid INT IDENTITY(1,1) NOT NULL,
  functionname NVARCHAR(100) NOT NULL,
  active INT DEFAULT 1,
  PRIMARY KEY (functionid)
);
GO
SET IDENTITY_INSERT dbo.functions_r ON;
-- TODO: INSERT INTO dbo.functions_r (...)
--       SELECT ...
SET IDENTITY_INSERT dbo.functions_r OFF;

IF OBJECT_ID('dbo.int_ext_r', 'U') IS NOT NULL DROP TABLE dbo.int_ext_r;
GO
CREATE TABLE dbo.int_ext_r (
  intextid INT IDENTITY(1,1) NOT NULL,
  intextname NVARCHAR(20) NOT NULL,
  PRIMARY KEY (intextid)
);
GO
SET IDENTITY_INSERT dbo.int_ext_r ON;
-- TODO: INSERT INTO dbo.int_ext_r (...)
--       SELECT ...
SET IDENTITY_INSERT dbo.int_ext_r OFF;

IF OBJECT_ID('dbo.nonconformances_r', 'U') IS NOT NULL DROP TABLE dbo.nonconformances_r;
GO
CREATE TABLE dbo.nonconformances_r (
  ncid INT IDENTITY(1,1) NOT NULL,
  scheduleid INT NOT NULL,
  type NVARCHAR(20) NOT NULL,
  section INT,
  subsection INT,
  question NVARCHAR(MAX),
  response NVARCHAR(MAX),
  auditorcomment NVARCHAR(MAX),
  details NVARCHAR(MAX),
  ain NVARCHAR(50),
  division NVARCHAR(MAX) DEFAULT N'[]',
  sector NVARCHAR(MAX) DEFAULT N'[]',
  qma NVARCHAR(MAX) DEFAULT N'[]',
  other NVARCHAR(MAX) DEFAULT N'[]',
  files NVARCHAR(MAX) DEFAULT N'[]',
  createdat DATETIME2 DEFAULT CURRENT_TIMESTAMP,
  updatedat DATETIME2 DEFAULT CURRENT_TIMESTAMP,
  findingtype INT,
  severity INT,
  PRIMARY KEY (ncid)
);
GO
SET IDENTITY_INSERT dbo.nonconformances_r ON;
-- TODO: INSERT INTO dbo.nonconformances_r (...)
--       SELECT ...
SET IDENTITY_INSERT dbo.nonconformances_r OFF;

IF OBJECT_ID('dbo.operating_units_r', 'U') IS NOT NULL DROP TABLE dbo.operating_units_r;
GO
CREATE TABLE dbo.operating_units_r (
  operatingunitid INT IDENTITY(1,1) NOT NULL,
  operatingunitname NVARCHAR(100) NOT NULL,
  divisionid INT,
  active INT DEFAULT 1,
  PRIMARY KEY (operatingunitid)
);
GO
SET IDENTITY_INSERT dbo.operating_units_r ON;
-- TODO: INSERT INTO dbo.operating_units_r (...)
--       SELECT ...
SET IDENTITY_INSERT dbo.operating_units_r OFF;

IF OBJECT_ID('dbo.programs_r', 'U') IS NOT NULL DROP TABLE dbo.programs_r;
GO
CREATE TABLE dbo.programs_r (
  programid INT IDENTITY(1,1) NOT NULL,
  programname NVARCHAR(100) NOT NULL,
  divisionid INT,
  active INT DEFAULT 1,
  PRIMARY KEY (programid)
);
GO
SET IDENTITY_INSERT dbo.programs_r ON;
-- TODO: INSERT INTO dbo.programs_r (...)
--       SELECT ...
SET IDENTITY_INSERT dbo.programs_r OFF;

IF OBJECT_ID('dbo.props_r', 'U') IS NOT NULL DROP TABLE dbo.props_r;
GO
CREATE TABLE dbo.props_r (
  propid INT IDENTITY(1,1) NOT NULL,
  prop NVARCHAR(200) NOT NULL,
  sectorid INT,
  divisionid INT,
  siteid INT,
  buid INT,
  ouid INT,
  programid INT,
  proptypeid INT,
  active INT DEFAULT 1,
  PRIMARY KEY (propid)
);
GO
SET IDENTITY_INSERT dbo.props_r ON;
-- TODO: INSERT INTO dbo.props_r (...)
--       SELECT ...
SET IDENTITY_INSERT dbo.props_r OFF;

IF OBJECT_ID('dbo.riskfactors_r', 'U') IS NOT NULL DROP TABLE dbo.riskfactors_r;
GO
CREATE TABLE dbo.riskfactors_r (
  riskfactorid INT IDENTITY(1,1) NOT NULL,
  riskfactor NVARCHAR(255) NOT NULL,
  PRIMARY KEY (riskfactorid)
);
GO
SET IDENTITY_INSERT dbo.riskfactors_r ON;
-- TODO: INSERT INTO dbo.riskfactors_r (...)
--       SELECT ...
SET IDENTITY_INSERT dbo.riskfactors_r OFF;

IF OBJECT_ID('dbo.riskratings_r', 'U') IS NOT NULL DROP TABLE dbo.riskratings_r;
GO
CREATE TABLE dbo.riskratings_r (
  riskratingid INT IDENTITY(1,1) NOT NULL,
  processarea NVARCHAR(255) NOT NULL,
  [year] INT NOT NULL,
  risktypeid INT NOT NULL,
  sectorid INT NULL,
  divisionid INT NULL,
  siteid INT NULL,
  buid INT NULL,
  ouid INT NULL,
  programid INT NULL,
  subcategoryid INT NOT NULL,
  rating INT NOT NULL,
  PRIMARY KEY (riskratingid)
);
GO
SET IDENTITY_INSERT dbo.riskratings_r ON;
-- TODO: INSERT INTO dbo.riskratings_r (...)
--       SELECT ...
SET IDENTITY_INSERT dbo.riskratings_r OFF;

IF OBJECT_ID('dbo.roster_r', 'U') IS NOT NULL DROP TABLE dbo.roster_r;
GO
CREATE TABLE dbo.roster_r (
  rostername NVARCHAR(100) NOT NULL,
  networkid NVARCHAR(6),
  myid NVARCHAR(6) NOT NULL,
  email NVARCHAR(200),
  PRIMARY KEY (myid)
);
GO
-- TODO: INSERT INTO dbo.roster_r (...)
--       SELECT ...

IF OBJECT_ID('dbo.safety_equipment_r', 'U') IS NOT NULL DROP TABLE dbo.safety_equipment_r;
GO
CREATE TABLE dbo.safety_equipment_r (
  safetyequipmentid INT IDENTITY(1,1) NOT NULL,
  safetyequipmentname NVARCHAR(100) NOT NULL,
  active INT DEFAULT 1,
  PRIMARY KEY (safetyequipmentid)
);
GO
SET IDENTITY_INSERT dbo.safety_equipment_r ON;
-- TODO: INSERT INTO dbo.safety_equipment_r (...)
--       SELECT ...
SET IDENTITY_INSERT dbo.safety_equipment_r OFF;

IF OBJECT_ID('dbo.sectors_r', 'U') IS NOT NULL DROP TABLE dbo.sectors_r;
GO
CREATE TABLE dbo.sectors_r (
  sectorid INT IDENTITY(1,1) NOT NULL,
  sectorname NVARCHAR(100) NOT NULL,
  PRIMARY KEY (sectorid)
);
GO
SET IDENTITY_INSERT dbo.sectors_r ON;
-- TODO: INSERT INTO dbo.sectors_r (...)
--       SELECT ...
SET IDENTITY_INSERT dbo.sectors_r OFF;

IF OBJECT_ID('dbo.severities_r', 'U') IS NOT NULL DROP TABLE dbo.severities_r;
GO
CREATE TABLE dbo.severities_r (
  severityid INT IDENTITY(1,1) NOT NULL,
  severity NVARCHAR(50) NOT NULL,
  PRIMARY KEY (severityid)
);
GO
SET IDENTITY_INSERT dbo.severities_r ON;
-- TODO: INSERT INTO dbo.severities_r (...)
--       SELECT ...
SET IDENTITY_INSERT dbo.severities_r OFF;

IF OBJECT_ID('dbo.sites_r', 'U') IS NOT NULL DROP TABLE dbo.sites_r;
GO
CREATE TABLE dbo.sites_r (
  siteid INT IDENTITY(1,1) NOT NULL,
  divisionid INT,
  address NVARCHAR(200),
  city NVARCHAR(100),
  state NVARCHAR(50),
  country NVARCHAR(100),
  active INT DEFAULT 1,
  PRIMARY KEY (siteid)
);
GO
SET IDENTITY_INSERT dbo.sites_r ON;
-- TODO: INSERT INTO dbo.sites_r (...)
--       SELECT ...
SET IDENTITY_INSERT dbo.sites_r OFF;

IF OBJECT_ID('dbo.standard_texts_r', 'U') IS NOT NULL DROP TABLE dbo.standard_texts_r;
GO
CREATE TABLE dbo.standard_texts_r (
  standardid INT NOT NULL,
  section INT NOT NULL,
  subsection INT NOT NULL,
  text NVARCHAR(MAX) NOT NULL
);
GO
-- TODO: INSERT INTO dbo.standard_texts_r (...)
--       SELECT ...

IF OBJECT_ID('dbo.standards_r', 'U') IS NOT NULL DROP TABLE dbo.standards_r;
GO
CREATE TABLE dbo.standards_r (
  standardid INT IDENTITY(1,1) NOT NULL,
  standardname NVARCHAR(100) NOT NULL,
  PRIMARY KEY (standardid)
);
GO
SET IDENTITY_INSERT dbo.standards_r ON;
-- TODO: INSERT INTO dbo.standards_r (...)
--       SELECT ...
SET IDENTITY_INSERT dbo.standards_r OFF;

IF OBJECT_ID('dbo.statuses_r', 'U') IS NOT NULL DROP TABLE dbo.statuses_r;
GO
CREATE TABLE dbo.statuses_r (
  statusid INT IDENTITY(1,1) NOT NULL,
  statusname NVARCHAR(50) NOT NULL,
  PRIMARY KEY (statusid)
);
GO
SET IDENTITY_INSERT dbo.statuses_r ON;
-- TODO: INSERT INTO dbo.statuses_r (...)
--       SELECT ...
SET IDENTITY_INSERT dbo.statuses_r OFF;

IF OBJECT_ID('dbo.subcategories_r', 'U') IS NOT NULL DROP TABLE dbo.subcategories_r;
GO
CREATE TABLE dbo.subcategories_r (
  subcategoryid INT IDENTITY(1,1) NOT NULL,
  riskfactorid INT NOT NULL,
  subcategory NVARCHAR(255) NOT NULL,
  PRIMARY KEY (subcategoryid)
);
GO
SET IDENTITY_INSERT dbo.subcategories_r ON;
-- TODO: INSERT INTO dbo.subcategories_r (...)
--       SELECT ...
SET IDENTITY_INSERT dbo.subcategories_r OFF;

IF OBJECT_ID('dbo.training_requirements_r', 'U') IS NOT NULL DROP TABLE dbo.training_requirements_r;
GO
CREATE TABLE dbo.training_requirements_r (
  trainingrequirementid INT IDENTITY(1,1) NOT NULL,
  trainingrequirementname NVARCHAR(100) NOT NULL,
  active INT DEFAULT 1,
  PRIMARY KEY (trainingrequirementid)
);
GO
SET IDENTITY_INSERT dbo.training_requirements_r ON;
-- TODO: INSERT INTO dbo.training_requirements_r (...)
--       SELECT ...
SET IDENTITY_INSERT dbo.training_requirements_r OFF;
