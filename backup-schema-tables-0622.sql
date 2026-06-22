/*
Copies every user table in a schema into a same-schema backup table
with the suffix `_backup_0622`.

Important:
- This copies columns and data via SELECT INTO.
- It does NOT copy indexes, keys, foreign keys, triggers, defaults, or permissions.
- It will fail and roll back if any target backup table already exists.

This script is currently set to `NORTHGRUM\N35589`.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @SchemaName sysname = N'NORTHGRUM\N35589';
DECLARE @BackupSuffix nvarchar(32) = N'_backup_0622';

IF NOT EXISTS (
    SELECT 1
    FROM sys.schemas
    WHERE name = @SchemaName
)
BEGIN
    THROW 50000, 'Source schema was not found. Check @SchemaName before running this script.', 1;
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.tables AS t
    INNER JOIN sys.schemas AS s
        ON s.schema_id = t.schema_id
    WHERE s.name = @SchemaName
)
BEGIN
    THROW 50001, 'No user tables were found in the source schema.', 1;
END;

DECLARE @Work TABLE (
    row_num int IDENTITY(1,1) PRIMARY KEY,
    source_table sysname NOT NULL,
    target_table sysname NOT NULL
);

INSERT INTO @Work (source_table, target_table)
SELECT
    t.name,
    CONCAT(t.name, @BackupSuffix)
FROM sys.tables AS t
INNER JOIN sys.schemas AS s
    ON s.schema_id = t.schema_id
WHERE s.name = @SchemaName
ORDER BY t.name;

DECLARE
    @CurrentRow int = 1,
    @MaxRow int = (SELECT MAX(row_num) FROM @Work),
    @SourceTable sysname,
    @TargetTable sysname,
    @Sql nvarchar(max);

BEGIN TRY
    BEGIN TRAN;

    WHILE @CurrentRow <= @MaxRow
    BEGIN
        SELECT
            @SourceTable = source_table,
            @TargetTable = target_table
        FROM @Work
        WHERE row_num = @CurrentRow;

        IF EXISTS (
            SELECT 1
            FROM sys.tables AS t
            INNER JOIN sys.schemas AS s
                ON s.schema_id = t.schema_id
            WHERE s.name = @SchemaName
              AND t.name = @TargetTable
        )
        BEGIN
            THROW 50002, 'A backup table already exists in the target schema. Remove or rename it before rerunning.', 1;
        END;

        SET @Sql =
            N'SELECT * INTO '
            + QUOTENAME(@SchemaName) + N'.' + QUOTENAME(@TargetTable)
            + N' FROM '
            + QUOTENAME(@SchemaName) + N'.' + QUOTENAME(@SourceTable)
            + N';';

        EXEC sys.sp_executesql @Sql;

        PRINT N'Created ' + QUOTENAME(@SchemaName) + N'.' + QUOTENAME(@TargetTable);

        SET @CurrentRow += 1;
    END;

    COMMIT TRAN;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRAN;
    END;
    THROW;
END CATCH;
