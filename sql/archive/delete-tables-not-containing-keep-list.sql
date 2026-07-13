/*
Deletes tables in a target schema whose names do NOT contain any of:
- Fode
- _r
- ISO9001
- ISO14001
- Links

Important:
- This permanently drops the matched tables.
- It only drops tables in the target schema.
- It stops if any table outside the matched set still references a matched table.
- It refuses to drop non-backup tables in dbo.

Preview query:
DECLARE @SchemaName sysname = N'dev';

SELECT s.name AS schema_name, t.name AS table_name
FROM sys.tables AS t
INNER JOIN sys.schemas AS s
    ON s.schema_id = t.schema_id
WHERE s.name = @SchemaName
  AND t.name NOT LIKE N'%Fode%'
  AND t.name NOT LIKE N'%[_]r%'
  AND t.name NOT LIKE N'%ISO9001%'
  AND t.name NOT LIKE N'%ISO14001%'
  AND t.name NOT LIKE N'%Links%'
ORDER BY t.name;
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @SchemaName sysname = N'dev';
DECLARE @DropList nvarchar(max);
DECLARE @InternalFkDropSql nvarchar(max);
DECLARE @BlockingReferenceList nvarchar(max);
DECLARE @UnsafeDboDropList nvarchar(max);
DECLARE @Sql nvarchar(max);

IF NOT EXISTS (
    SELECT 1
    FROM sys.schemas
    WHERE name = @SchemaName
)
BEGIN
    THROW 50050, 'Target schema was not found. Check @SchemaName before running this script.', 1;
END;

IF OBJECT_ID('tempdb..#MatchedTables') IS NOT NULL
BEGIN
    DROP TABLE #MatchedTables;
END;

CREATE TABLE #MatchedTables (
    object_id int NOT NULL PRIMARY KEY,
    schema_name sysname NOT NULL,
    table_name sysname NOT NULL
);

INSERT INTO #MatchedTables (object_id, schema_name, table_name)
SELECT
    t.object_id,
    s.name,
    t.name
FROM sys.tables AS t
INNER JOIN sys.schemas AS s
    ON s.schema_id = t.schema_id
WHERE s.name = @SchemaName
  AND t.name NOT LIKE N'%Fode%'
  AND t.name NOT LIKE N'%[_]r%'
  AND t.name NOT LIKE N'%ISO9001%'
  AND t.name NOT LIKE N'%ISO14001%'
  AND t.name NOT LIKE N'%Links%';

IF NOT EXISTS (
    SELECT 1
    FROM #MatchedTables
)
BEGIN
    THROW 50051, 'No matching tables were found in the target schema.', 1;
END;

SELECT
    @UnsafeDboDropList = STRING_AGG(CAST(QUOTENAME(table_name) AS nvarchar(max)), N', ')
FROM #MatchedTables
WHERE schema_name = N'dbo'
  AND table_name NOT LIKE N'%[_]backup%';

IF @UnsafeDboDropList IS NOT NULL AND LTRIM(RTRIM(@UnsafeDboDropList)) <> N''
BEGIN
    SELECT @UnsafeDboDropList AS UnsafeDboDropTables;
    THROW 50052, 'Refusing to drop non-backup tables in dbo.', 1;
END;

SELECT
    @BlockingReferenceList = STRING_AGG(
        CAST(
            QUOTENAME(parent_schema.name) + N'.' + QUOTENAME(parent_table.name)
            + N' -> '
            + QUOTENAME(referenced_schema.name) + N'.' + QUOTENAME(referenced_table.name)
            + N' (' + QUOTENAME(fk.name) + N')'
            AS nvarchar(max)
        ),
        N'; '
    )
FROM sys.foreign_keys AS fk
INNER JOIN sys.tables AS parent_table
    ON parent_table.object_id = fk.parent_object_id
INNER JOIN sys.schemas AS parent_schema
    ON parent_schema.schema_id = parent_table.schema_id
INNER JOIN sys.tables AS referenced_table
    ON referenced_table.object_id = fk.referenced_object_id
INNER JOIN sys.schemas AS referenced_schema
    ON referenced_schema.schema_id = referenced_table.schema_id
INNER JOIN #MatchedTables AS matched
    ON matched.object_id = referenced_table.object_id
LEFT JOIN #MatchedTables AS matched_parent
    ON matched_parent.object_id = parent_table.object_id
WHERE matched_parent.object_id IS NULL;

IF @BlockingReferenceList IS NOT NULL AND LTRIM(RTRIM(@BlockingReferenceList)) <> N''
BEGIN
    SELECT @BlockingReferenceList AS BlockingForeignKeys;
    THROW 50053, 'Cannot drop matched tables because other tables still reference them.', 1;
END;

SELECT
    @InternalFkDropSql = STRING_AGG(
        CAST(
            N'ALTER TABLE '
            + QUOTENAME(parent_schema.name) + N'.' + QUOTENAME(parent_table.name)
            + N' DROP CONSTRAINT ' + QUOTENAME(fk.name)
            AS nvarchar(max)
        ),
        N'; '
    )
FROM sys.foreign_keys AS fk
INNER JOIN sys.tables AS parent_table
    ON parent_table.object_id = fk.parent_object_id
INNER JOIN sys.schemas AS parent_schema
    ON parent_schema.schema_id = parent_table.schema_id
INNER JOIN #MatchedTables AS matched_parent
    ON matched_parent.object_id = parent_table.object_id;

SELECT
    @DropList = STRING_AGG(
        CAST(QUOTENAME(schema_name) + N'.' + QUOTENAME(table_name) AS nvarchar(max)),
        N', '
    )
FROM #MatchedTables;

BEGIN TRY
    BEGIN TRAN;

    IF @InternalFkDropSql IS NOT NULL AND LTRIM(RTRIM(@InternalFkDropSql)) <> N''
    BEGIN
        EXEC sys.sp_executesql @InternalFkDropSql;
        PRINT N'Dropped foreign keys owned by matched tables in schema ' + QUOTENAME(@SchemaName) + N'.';
    END;

    SET @Sql = N'DROP TABLE ' + @DropList + N';';
    EXEC sys.sp_executesql @Sql;

    PRINT N'Dropped all matched tables in schema ' + QUOTENAME(@SchemaName) + N'.';

    COMMIT TRAN;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRAN;
    END;
    THROW;
END CATCH;
