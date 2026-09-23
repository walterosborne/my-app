/*
Run BEFORE the matching backend starts. Defaults to dev only.
To apply in production, deliberately set @TargetSchema=N'dbo' AND @AllowDbo=1
after normal production change review. Existing rows and dates are untouched.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @TargetSchema SYSNAME = N'dev';
DECLARE @AllowDbo BIT = 0;

IF @TargetSchema NOT IN (N'dev', N'dbo')
    THROW 50140, 'Only dev or dbo audit schema is supported.', 1;
IF @TargetSchema = N'dbo' AND @AllowDbo <> 1
    THROW 50141, 'Production changes require explicit @AllowDbo=1.', 1;

DECLARE @QualifiedTable NVARCHAR(260) = QUOTENAME(@TargetSchema) + N'.[audits_r]';
IF OBJECT_ID(@QualifiedTable, N'U') IS NULL
    THROW 50142, 'Target audits_r does not exist; no changes made.', 1;

IF COL_LENGTH(@QualifiedTable, N'stagebeforeinactive') IS NULL
BEGIN
    DECLARE @Sql NVARCHAR(MAX) =
        N'ALTER TABLE ' + @QualifiedTable + N' ADD [stagebeforeinactive] INT NULL;';
    EXEC sys.sp_executesql @Sql;
END;

SELECT s.name AS schema_name, t.name AS table_name, c.name AS stage_backup_column
FROM sys.columns c
JOIN sys.tables t ON t.object_id = c.object_id
JOIN sys.schemas s ON s.schema_id = t.schema_id
WHERE s.name = @TargetSchema AND t.name = N'audits_r'
  AND c.name = N'stagebeforeinactive';
