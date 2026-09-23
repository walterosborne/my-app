/*
NGAT org hierarchy: DEV ONLY. Do not run the application version that depends
on these fields until the migration has completed in the dev audit database.

- Every ALTER is hardcoded to [dev]; no configurable schema or dbo override.
- Existing program / OU rows are NOT updated or backfilled.
- Nullable columns preserve historic entries until an administrator corrects them.
- New/edited records are validated by the application API, not by NOT NULL.
- Safe to rerun; transaction rolls back on error.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF SCHEMA_ID(N'dev') IS NULL
    THROW 50160, 'dev schema is missing; refusing migration.', 1;
IF OBJECT_ID(N'dev.programs_r', N'U') IS NULL
    THROW 50161, 'dev.programs_r is missing; refusing migration.', 1;
IF OBJECT_ID(N'dev.operating_units_r', N'U') IS NULL
    THROW 50162, 'dev.operating_units_r is missing; refusing migration.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    IF COL_LENGTH(N'dev.programs_r', N'businessunitid') IS NULL
        EXEC sys.sp_executesql N'ALTER TABLE [dev].[programs_r] ADD [businessunitid] INT NULL;';
    IF COL_LENGTH(N'dev.programs_r', N'operatingunitid') IS NULL
        EXEC sys.sp_executesql N'ALTER TABLE [dev].[programs_r] ADD [operatingunitid] INT NULL;';
    IF COL_LENGTH(N'dev.operating_units_r', N'businessunitid') IS NULL
        EXEC sys.sp_executesql N'ALTER TABLE [dev].[operating_units_r] ADD [businessunitid] INT NULL;';

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

SELECT s.name AS schema_name, t.name AS table_name, c.name AS column_name
FROM sys.columns AS c
JOIN sys.tables AS t ON t.object_id = c.object_id
JOIN sys.schemas AS s ON s.schema_id = t.schema_id
WHERE s.name = N'dev'
  AND ((t.name = N'programs_r' AND c.name IN (N'businessunitid', N'operatingunitid'))
    OR (t.name = N'operating_units_r' AND c.name = N'businessunitid'));
