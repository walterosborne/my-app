/*
Copies every user table with `_r` in its name from dbo into dev by creating the dev tables
with SELECT INTO.

Important:
- Source schema is currently set to `dbo`.
- Target schema is currently set to `dev`.
- This creates target tables and copies data in one step.
- It does NOT copy indexes, keys, foreign keys, triggers, defaults, or permissions.
- It only includes tables whose names contain `_r`.
- It excludes tables whose names contain `_backup`.
- It will fail and roll back if any target table already exists in the target schema.
- It requires the target schema itself to already exist.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @SourceSchema sysname = N'dbo';
DECLARE @TargetSchema sysname = N'dev';
DECLARE @UnsafeDboTargetList nvarchar(max);

IF NOT EXISTS (
    SELECT 1
    FROM sys.schemas
    WHERE name = @SourceSchema
)
BEGIN
    THROW 50020, 'Source schema was not found. Check @SourceSchema before running this script.', 1;
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.schemas
    WHERE name = @TargetSchema
)
BEGIN
    THROW 50021, 'Target schema was not found. Check @TargetSchema before running this script.', 1;
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.tables AS t
    INNER JOIN sys.schemas AS s
        ON s.schema_id = t.schema_id
    WHERE s.name = @SourceSchema
      AND t.name LIKE '%[_]r%'
      AND t.name NOT LIKE '%[_]backup%'
)
BEGIN
    THROW 50022, 'No eligible _r tables were found in the source schema.', 1;
END;

DECLARE @Work TABLE (
    row_num int IDENTITY(1,1) PRIMARY KEY,
    source_table sysname NOT NULL
);

INSERT INTO @Work (source_table)
SELECT t.name
FROM sys.tables AS t
INNER JOIN sys.schemas AS s
    ON s.schema_id = t.schema_id
WHERE s.name = @SourceSchema
  AND t.name LIKE '%[_]r%'
  AND t.name NOT LIKE '%[_]backup%'
ORDER BY t.name;

SELECT
    @UnsafeDboTargetList = STRING_AGG(CAST(QUOTENAME(source_table) AS nvarchar(max)), N', ')
FROM @Work
WHERE @TargetSchema = N'dbo'
  AND source_table NOT LIKE N'%[_]backup%';

IF @UnsafeDboTargetList IS NOT NULL AND LTRIM(RTRIM(@UnsafeDboTargetList)) <> N''
BEGIN
    SELECT @UnsafeDboTargetList AS UnsafeDboTargetTables;
    THROW 50024, 'Refusing to create non-backup tables in dbo. Only _backup tables may be targeted in dbo.', 1;
END;

DECLARE
    @CurrentRow int = 1,
    @MaxRow int = (SELECT MAX(row_num) FROM @Work),
    @SourceTable sysname,
    @Sql nvarchar(max);

BEGIN TRY
    BEGIN TRAN;

    WHILE @CurrentRow <= @MaxRow
    BEGIN
        SELECT
            @SourceTable = source_table
        FROM @Work
        WHERE row_num = @CurrentRow;

        IF EXISTS (
            SELECT 1
            FROM sys.tables AS t
            INNER JOIN sys.schemas AS s
                ON s.schema_id = t.schema_id
            WHERE s.name = @TargetSchema
              AND t.name = @SourceTable
        )
        BEGIN
            THROW 50023, 'A target table already exists in the target schema. Remove or rename it before rerunning.', 1;
        END;

        SET @Sql =
            N'SELECT * INTO '
            + QUOTENAME(@TargetSchema) + N'.' + QUOTENAME(@SourceTable)
            + N' FROM '
            + QUOTENAME(@SourceSchema) + N'.' + QUOTENAME(@SourceTable)
            + N';';

        EXEC sys.sp_executesql @Sql;

        PRINT N'Created ' + QUOTENAME(@TargetSchema) + N'.' + QUOTENAME(@SourceTable)
            + N' from ' + QUOTENAME(@SourceSchema) + N'.' + QUOTENAME(@SourceTable);

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
