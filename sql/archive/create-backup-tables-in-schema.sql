/*
Copies eligible user tables in one schema into same-schema backup tables
with the suffix `_backup`.

Eligible tables:
- names ending in `_r`, or
- names beginning with `Fode` / `fode`

Excluded tables:
- any table whose name contains `backup`

Important:
- Source schema is controlled by @SchemaName.
- This copies columns and data via SELECT INTO.
- It does NOT copy indexes, keys, foreign keys, triggers, defaults, or permissions.
- It overwrites any existing target backup table by dropping it first.
- It refuses to create non-backup tables in dbo.
- Because target tables always end in `_backup`, dbo backups remain allowed.

Preview query:
DECLARE @SchemaName sysname = N'dev';
DECLARE @BackupSuffix nvarchar(32) = N'_backup';

SELECT
    source_schema.name AS schema_name,
    source_table.name AS source_table_name,
    CONCAT(source_table.name, @BackupSuffix) AS target_backup_table_name
FROM sys.tables AS source_table
INNER JOIN sys.schemas AS source_schema
    ON source_schema.schema_id = source_table.schema_id
WHERE source_schema.name = @SchemaName
  AND (
        source_table.name LIKE N'%[_]r'
        OR LOWER(source_table.name) LIKE N'fode%'
      )
  AND LOWER(source_table.name) NOT LIKE N'%backup%'
ORDER BY source_table.name;
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @SchemaName sysname = N'dev';
DECLARE @BackupSuffix nvarchar(32) = N'_backup';
DECLARE @UnsafeDboTargetList nvarchar(max);

IF NOT EXISTS (
    SELECT 1
    FROM sys.schemas
    WHERE name = @SchemaName
)
BEGIN
    THROW 50120, 'Source schema was not found. Check @SchemaName before running this script.', 1;
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.tables AS t
    INNER JOIN sys.schemas AS s
        ON s.schema_id = t.schema_id
    WHERE s.name = @SchemaName
      AND (
            t.name LIKE N'%[_]r'
            OR LOWER(t.name) LIKE N'fode%'
          )
      AND LOWER(t.name) NOT LIKE N'%backup%'
)
BEGIN
    THROW 50121, 'No eligible _r or Fode tables were found in the source schema.', 1;
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
  AND (
        t.name LIKE N'%[_]r'
        OR LOWER(t.name) LIKE N'fode%'
      )
  AND LOWER(t.name) NOT LIKE N'%backup%'
ORDER BY t.name;

SELECT
    @UnsafeDboTargetList = STRING_AGG(CAST(QUOTENAME(target_table) AS nvarchar(max)), N', ')
FROM @Work
WHERE @SchemaName = N'dbo'
  AND target_table NOT LIKE N'%[_]backup';

IF @UnsafeDboTargetList IS NOT NULL AND LTRIM(RTRIM(@UnsafeDboTargetList)) <> N''
BEGIN
    SELECT @UnsafeDboTargetList AS UnsafeDboTargetTables;
    THROW 50122, 'Refusing to create non-backup tables in dbo. Only _backup targets are allowed in dbo.', 1;
END;

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
            SET @Sql =
                N'DROP TABLE '
                + QUOTENAME(@SchemaName) + N'.' + QUOTENAME(@TargetTable)
                + N';';

            EXEC sys.sp_executesql @Sql;

            PRINT N'Dropped existing ' + QUOTENAME(@SchemaName) + N'.' + QUOTENAME(@TargetTable);
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
