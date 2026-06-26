/*
Deletes every user table in the `Dev` schema.

Important:
- This permanently drops the tables.
- It only drops user tables in the target schema.
- It requires the target schema to already exist.
- It uses one DROP TABLE statement so foreign-key-linked tables in the same schema
  can be dropped together.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @SchemaName sysname = N'Dev';
DECLARE @DropList nvarchar(max);
DECLARE @Sql nvarchar(max);

IF NOT EXISTS (
    SELECT 1
    FROM sys.schemas
    WHERE name = @SchemaName
)
BEGIN
    THROW 50030, 'Target schema was not found. Check @SchemaName before running this script.', 1;
END;

SELECT
    @DropList = STRING_AGG(CAST(QUOTENAME(s.name) + N'.' + QUOTENAME(t.name) AS nvarchar(max)), N', ')
FROM sys.tables AS t
INNER JOIN sys.schemas AS s
    ON s.schema_id = t.schema_id
WHERE s.name = @SchemaName;

IF @DropList IS NULL OR LTRIM(RTRIM(@DropList)) = N''
BEGIN
    THROW 50031, 'No user tables were found in the target schema.', 1;
END;

BEGIN TRY
    BEGIN TRAN;

    SET @Sql = N'DROP TABLE ' + @DropList + N';';
    EXEC sys.sp_executesql @Sql;

    PRINT N'Dropped all user tables in schema ' + QUOTENAME(@SchemaName) + N'.';

    COMMIT TRAN;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRAN;
    END;
    THROW;
END CATCH;
