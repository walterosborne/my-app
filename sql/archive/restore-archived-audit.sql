/*
Administrator-only restoration of one archived audit. Review the Schedule ID first.
Run against the audit database. Defaults to dev; dbo requires explicit opt-in.
No INSERT/DELETE and no changes to any other audit or related finding rows.

Requires sql/add-audit-lifecycle-stage.sql to have been run beforehand.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @TargetSchema SYSNAME = N'dev';
DECLARE @AllowDbo BIT = 0;
DECLARE @ScheduleId INT = NULL; -- Set the specific archived Schedule ID before execution.

IF @TargetSchema NOT IN (N'dev', N'dbo')
    THROW 50150, 'Only dev or dbo audit schema is supported.', 1;
IF @TargetSchema = N'dbo' AND @AllowDbo <> 1
    THROW 50151, 'Production restoration requires explicit @AllowDbo=1.', 1;
IF @ScheduleId IS NULL OR @ScheduleId <= 0
    THROW 50152, 'Set @ScheduleId to a positive archived audit ID.', 1;

DECLARE @Table NVARCHAR(260) = QUOTENAME(@TargetSchema) + N'.[audits_r]';
IF OBJECT_ID(@Table, N'U') IS NULL
   OR COL_LENGTH(@Table, N'stagebeforeinactive') IS NULL
    THROW 50153, 'Target table or prior stage column is missing.', 1;

DECLARE @Affected INT = 0;
DECLARE @Sql NVARCHAR(MAX) = N'
    UPDATE ' + @Table + N'
       SET stage = stagebeforeinactive,
           stagebeforeinactive = NULL,
           updatedat = CURRENT_TIMESTAMP
     WHERE scheduleid = @AuditId
       AND stage = -3
       AND stagebeforeinactive IN (-1, 1, 2, 3, 4);
    SET @RowsChanged = @@ROWCOUNT;';

BEGIN TRY
    BEGIN TRANSACTION;
    EXEC sys.sp_executesql
        @Sql,
        N'@AuditId INT, @RowsChanged INT OUTPUT',
        @AuditId = @ScheduleId,
        @RowsChanged = @Affected OUTPUT;
    IF @Affected <> 1
        THROW 50154, 'No eligible archived audit found; no changes made.', 1;
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

SELECT @TargetSchema AS schema_name, @ScheduleId AS restored_schedule_id;
