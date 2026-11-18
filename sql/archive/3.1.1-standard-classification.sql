/*
NGAT 3.1.1 — Internal / External standards classification.

Run manually against the NGAT audit database.
Defaults to [dev].[standards_r]. Production changes require BOTH:
  @TargetSchema = N'dbo' and @AllowDbo = 1.

Existing standards are deliberately left NULL (unclassified) instead of
guessing whether they are internal or external. Admins can classify them
in NGAT's Standards Management page.

Idempotent: safe to rerun; no existing standards or selections are deleted.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @TargetSchema SYSNAME = N'dev';
DECLARE @AllowDbo BIT = 0;

IF @TargetSchema NOT IN (N'dev', N'dbo')
    THROW 50320, 'NGAT 3.1.1 supports only dev and dbo schemas.', 1;

IF @TargetSchema = N'dbo' AND @AllowDbo <> 1
    THROW 50321, 'Production changes require explicit @AllowDbo = 1.', 1;

IF SCHEMA_ID(@TargetSchema) IS NULL
    THROW 50322, 'Target schema does not exist.', 1;

DECLARE @TableName NVARCHAR(260) = QUOTENAME(@TargetSchema) + N'.[standards_r]';
DECLARE @TableId INT = OBJECT_ID(@TableName, N'U');

IF @TableId IS NULL
    THROW 50323, 'standards_r does not exist in the selected schema.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = @TableId AND name = N'standardScope'
    )
    BEGIN
        EXEC (N'ALTER TABLE ' + @TableName + N' ADD [standardScope] NVARCHAR(8) NULL;');
    END;

    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = @TableId
          AND name = N'standardScope'
          AND (system_type_id <> TYPE_ID(N'nvarchar') OR max_length <> 16)
    )
        THROW 50324, 'Existing standardScope column has an unexpected type or length.', 1;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE parent_object_id = @TableId
          AND name = N'CK_standards_r_standardScope'
    )
    BEGIN
        EXEC (
            N'ALTER TABLE ' + @TableName +
            N' WITH CHECK ADD CONSTRAINT [CK_standards_r_standardScope]' +
            N' CHECK ([standardScope] IS NULL OR [standardScope] IN (N''Internal'', N''External''));'
        );
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

EXEC (
    N'SELECT [standardId], [standardName], [standardScope] FROM '
    + @TableName + N' ORDER BY [standardName];'
);
