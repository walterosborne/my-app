/*
Copies eligible user tables from one schema to another by creating new target tables
with SELECT INTO.

Eligible tables:
- names ending in `_r`, or
- names beginning with `Fode` / `fode`

Excluded tables:
- any table whose name contains `backup`

Important:
- Source schema is controlled by @SourceSchema.
- Target schema is controlled by @TargetSchema.
- The target schema must already exist.
- This creates target tables and copies data in one step.
- It does NOT copy indexes, keys, foreign keys, triggers, defaults, or permissions.
- It will fail and roll back if any target table already exists in the target schema.
- It refuses to create non-backup tables in dbo.

Preview query:
DECLARE @SourceSchema sysname = N'dbo';
DECLARE @TargetSchema sysname = N'dev';

SELECT
    source_schema.name AS source_schema_name,
    source_table.name AS source_table_name,
    target_schema.name AS target_schema_name
FROM sys.tables AS source_table
INNER JOIN sys.schemas AS source_schema
    ON source_schema.schema_id = source_table.schema_id
CROSS JOIN (
    SELECT name
    FROM sys.schemas
    WHERE name = @TargetSchema
) AS target_schema
WHERE source_schema.name = @SourceSchema
  AND (
        source_table.name LIKE N'%[_]r'
        OR LOWER(source_table.name) LIKE N'fode%'
      )
  AND LOWER(source_table.name) NOT LIKE N'%backup%'
ORDER BY source_table.name;
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @SourceSchema sysname = N'dbo';
DECLARE @TargetSchema sysname = N'dev';
DECLARE @UnsafeDboTargetList nvarchar(max);

IF @SourceSchema = @TargetSchema
BEGIN
    THROW 50110, 'Source and target schemas must be different.', 1;
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.schemas
    WHERE name = @SourceSchema
)
BEGIN
    THROW 50111, 'Source schema was not found. Check @SourceSchema before running this script.', 1;
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.schemas
    WHERE name = @TargetSchema
)
BEGIN
    THROW 50112, 'Target schema was not found. Check @TargetSchema before running this script.', 1;
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.tables AS t
    INNER JOIN sys.schemas AS s
        ON s.schema_id = t.schema_id
    WHERE s.name = @SourceSchema
      AND (
            t.name LIKE N'%[_]r'
            OR LOWER(t.name) LIKE N'fode%'
          )
      AND LOWER(t.name) NOT LIKE N'%backup%'
)
BEGIN
    THROW 50113, 'No eligible _r or Fode tables were found in the source schema.', 1;
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
  AND (
        t.name LIKE N'%[_]r'
        OR LOWER(t.name) LIKE N'fode%'
      )
  AND LOWER(t.name) NOT LIKE N'%backup%'
ORDER BY t.name;

SELECT
    @UnsafeDboTargetList = STRING_AGG(CAST(QUOTENAME(source_table) AS nvarchar(max)), N', ')
FROM @Work
WHERE @TargetSchema = N'dbo'
  AND LOWER(source_table) NOT LIKE N'%backup%';

IF @UnsafeDboTargetList IS NOT NULL AND LTRIM(RTRIM(@UnsafeDboTargetList)) <> N''
BEGIN
    SELECT @UnsafeDboTargetList AS UnsafeDboTargetTables;
    THROW 50114, 'Refusing to create non-backup tables in dbo. Only _backup tables may be targeted in dbo.', 1;
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
            THROW 50115, 'A target table already exists in the target schema. Remove or rename it before rerunning.', 1;
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
