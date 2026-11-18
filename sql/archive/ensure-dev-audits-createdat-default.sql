/*
Restore the creation-date default for the NGAT dev audit table after SELECT INTO.
SELECT INTO does not copy defaults from dbo; this script changes dev only.

- Idempotent: leaves an existing default alone, regardless of its name.
- Refuses to run if dev.audits_r or createdat is missing.
- Does not touch dbo or modify any existing audit rows/NULL dates.
- Run in the same database that contains the dev audit schema.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID(N'dev.audits_r', N'U') IS NULL
BEGIN
    THROW 50130, 'dev.audits_r was not found; refusing to modify any other schema.', 1;
END;

IF COL_LENGTH(N'dev.audits_r', N'createdat') IS NULL
BEGIN
    THROW 50131, 'dev.audits_r.createdat was not found.', 1;
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.columns AS c
    WHERE c.object_id = OBJECT_ID(N'dev.audits_r', N'U')
      AND c.name = N'createdat'
      AND c.default_object_id <> 0
)
BEGIN
    IF OBJECT_ID(N'dev.DF_dev_audits_r_createdat', N'D') IS NOT NULL
    BEGIN
        THROW 50132, 'The intended default constraint name is already in use; no changes made.', 1;
    END;

    ALTER TABLE [dev].[audits_r]
        ADD CONSTRAINT [DF_dev_audits_r_createdat]
        DEFAULT (CURRENT_TIMESTAMP) FOR [createdat];
END;

SELECT
    s.name AS schema_name,
    t.name AS table_name,
    c.name AS column_name,
    dc.name AS default_constraint_name,
    dc.definition AS default_definition
FROM sys.columns AS c
INNER JOIN sys.tables AS t ON t.object_id = c.object_id
INNER JOIN sys.schemas AS s ON s.schema_id = t.schema_id
LEFT JOIN sys.default_constraints AS dc ON dc.object_id = c.default_object_id
WHERE s.name = N'dev'
  AND t.name = N'audits_r'
  AND c.name = N'createdat';
