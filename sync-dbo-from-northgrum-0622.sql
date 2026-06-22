/*
Overwrites dbo tables with data from matching tables in [NORTHGRUM\N35589].

Scope safeguards:
- Only touches tables that exist in BOTH dbo and [NORTHGRUM\N35589].
- Excludes tables whose names contain `_backup_`.
- Does not create, drop, or rename any tables.
- Does not touch tables that exist only in dbo or only in [NORTHGRUM\N35589].

Implementation notes:
- This copies data only. It does not recreate schema objects.
- It disables constraints only on the dbo tables it is syncing, then re-enables them.
- It excludes computed and rowversion/timestamp columns from INSERT lists.
- It preserves identity values when needed.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @SourceSchema sysname = N'NORTHGRUM\N35589';
DECLARE @TargetSchema sysname = N'dbo';

IF NOT EXISTS (
    SELECT 1
    FROM sys.schemas
    WHERE name = @SourceSchema
)
BEGIN
    THROW 50010, 'Source schema not found. Check @SourceSchema before running.', 1;
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.schemas
    WHERE name = @TargetSchema
)
BEGIN
    THROW 50011, 'Target schema not found. Check @TargetSchema before running.', 1;
END;

DECLARE @Work TABLE (
    row_num int IDENTITY(1,1) PRIMARY KEY,
    table_name sysname NOT NULL,
    has_identity bit NOT NULL
);

INSERT INTO @Work (table_name, has_identity)
SELECT
    target_table.name,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM sys.columns AS c
            WHERE c.object_id = target_table.object_id
              AND c.is_identity = 1
        ) THEN 1
        ELSE 0
    END
FROM sys.tables AS target_table
INNER JOIN sys.schemas AS target_schema
    ON target_schema.schema_id = target_table.schema_id
INNER JOIN sys.tables AS source_table
    ON source_table.name = target_table.name
INNER JOIN sys.schemas AS source_schema
    ON source_schema.schema_id = source_table.schema_id
WHERE target_schema.name = @TargetSchema
  AND source_schema.name = @SourceSchema
  AND target_table.name NOT LIKE '%[_]backup[_]%'
ORDER BY target_table.name;

IF NOT EXISTS (SELECT 1 FROM @Work)
BEGIN
    THROW 50012, 'No matching tables were found between source and target schemas.', 1;
END;

DECLARE
    @CurrentRow int = 1,
    @MaxRow int = (SELECT MAX(row_num) FROM @Work),
    @TableName sysname,
    @HasIdentity bit,
    @SourceObjectId int,
    @TargetObjectId int,
    @ColumnList nvarchar(max),
    @Sql nvarchar(max);

BEGIN TRY
    BEGIN TRAN;

    WHILE @CurrentRow <= @MaxRow
    BEGIN
        SELECT
            @TableName = table_name,
            @HasIdentity = has_identity
        FROM @Work
        WHERE row_num = @CurrentRow;

        SELECT
            @SourceObjectId = source_table.object_id,
            @TargetObjectId = target_table.object_id
        FROM sys.tables AS target_table
        INNER JOIN sys.schemas AS target_schema
            ON target_schema.schema_id = target_table.schema_id
        INNER JOIN sys.tables AS source_table
            ON source_table.name = target_table.name
        INNER JOIN sys.schemas AS source_schema
            ON source_schema.schema_id = source_table.schema_id
        WHERE target_schema.name = @TargetSchema
          AND source_schema.name = @SourceSchema
          AND target_table.name = @TableName;

        SELECT
            @ColumnList = STRING_AGG(QUOTENAME(target_col.name), N', ')
        FROM sys.columns AS target_col
        INNER JOIN sys.columns AS source_col
            ON source_col.object_id = @SourceObjectId
           AND source_col.name = target_col.name
        INNER JOIN sys.types AS target_type
            ON target_type.user_type_id = target_col.user_type_id
        WHERE target_col.object_id = @TargetObjectId
          AND target_col.is_computed = 0
          AND target_col.generated_always_type = 0
          AND source_col.is_computed = 0
          AND source_col.generated_always_type = 0
          AND target_type.name NOT IN (N'timestamp', N'rowversion');

        IF @ColumnList IS NULL OR LTRIM(RTRIM(@ColumnList)) = N''
        BEGIN
            THROW 50013, 'No common writable columns were found for one of the matched tables.', 1;
        END;

        SET @Sql = N'
ALTER TABLE ' + QUOTENAME(@TargetSchema) + N'.' + QUOTENAME(@TableName) + N' NOCHECK CONSTRAINT ALL;
DELETE FROM ' + QUOTENAME(@TargetSchema) + N'.' + QUOTENAME(@TableName) + N';
' + CASE
        WHEN @HasIdentity = 1 THEN
            N'SET IDENTITY_INSERT ' + QUOTENAME(@TargetSchema) + N'.' + QUOTENAME(@TableName) + N' ON;
INSERT INTO ' + QUOTENAME(@TargetSchema) + N'.' + QUOTENAME(@TableName) + N' (' + @ColumnList + N')
SELECT ' + @ColumnList + N'
FROM ' + QUOTENAME(@SourceSchema) + N'.' + QUOTENAME(@TableName) + N';
SET IDENTITY_INSERT ' + QUOTENAME(@TargetSchema) + N'.' + QUOTENAME(@TableName) + N' OFF;'
        ELSE
            N'INSERT INTO ' + QUOTENAME(@TargetSchema) + N'.' + QUOTENAME(@TableName) + N' (' + @ColumnList + N')
SELECT ' + @ColumnList + N'
FROM ' + QUOTENAME(@SourceSchema) + N'.' + QUOTENAME(@TableName) + N';'
    END + N'
ALTER TABLE ' + QUOTENAME(@TargetSchema) + N'.' + QUOTENAME(@TableName) + N' WITH CHECK CHECK CONSTRAINT ALL;';

        EXEC sys.sp_executesql @Sql;

        PRINT N'Synced ' + QUOTENAME(@TargetSchema) + N'.' + QUOTENAME(@TableName)
            + N' from ' + QUOTENAME(@SourceSchema) + N'.' + QUOTENAME(@TableName);

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
