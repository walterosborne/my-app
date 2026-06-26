/*
Deletes tables in a target schema whose names contain `_backup` twice.

Examples this will match:
- table_backup_backup
- table_backup_0622_backup_0622

Important:
- This permanently drops the matched tables.
- It only drops tables in the target schema.
- It only targets tables whose names contain `_backup` two or more times.
- It drops foreign keys owned by the matched tables before dropping them.
- It will stop if tables in another schema still reference the matched tables.

Preview query:
DECLARE @SchemaName sysname = N'dev';

SELECT s.name AS schema_name, t.name AS table_name
FROM sys.tables t
JOIN sys.schemas s ON s.schema_id = t.schema_id
WHERE s.name = @SchemaName
  AND t.name LIKE N'%[_]backup%[_]backup%'
ORDER BY t.name;
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @SchemaName sysname = N'dev';
DECLARE @DropList nvarchar(max);
DECLARE @InternalFkDropSql nvarchar(max);
DECLARE @ExternalReferenceList nvarchar(max);
DECLARE @Sql nvarchar(max);

IF NOT EXISTS (
    SELECT 1
    FROM sys.schemas
    WHERE name = @SchemaName
)
BEGIN
    THROW 50040, 'Target schema was not found. Check @SchemaName before running this script.', 1;
END;

SELECT
    @DropList = STRING_AGG(
        CAST(QUOTENAME(s.name) + N'.' + QUOTENAME(t.name) AS nvarchar(max)),
        N', '
    )
FROM sys.tables AS t
INNER JOIN sys.schemas AS s
    ON s.schema_id = t.schema_id
WHERE s.name = @SchemaName
  AND t.name LIKE N'%[_]backup%[_]backup%';

IF @DropList IS NULL OR LTRIM(RTRIM(@DropList)) = N''
BEGIN
    THROW 50041, 'No tables containing `_backup` twice were found in the target schema.', 1;
END;

SELECT
    @ExternalReferenceList = STRING_AGG(
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
WHERE referenced_schema.name = @SchemaName
  AND referenced_table.name LIKE N'%[_]backup%[_]backup%'
  AND parent_schema.name <> @SchemaName;

IF @ExternalReferenceList IS NOT NULL AND LTRIM(RTRIM(@ExternalReferenceList)) <> N''
BEGIN
    SELECT @ExternalReferenceList AS ExternalReferencingForeignKeys;
    THROW 50042, 'Cannot drop matched tables because tables in other schemas still reference them.', 1;
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
WHERE parent_schema.name = @SchemaName
  AND parent_table.name LIKE N'%[_]backup%[_]backup%';

BEGIN TRY
    BEGIN TRAN;

    IF @InternalFkDropSql IS NOT NULL AND LTRIM(RTRIM(@InternalFkDropSql)) <> N''
    BEGIN
        EXEC sys.sp_executesql @InternalFkDropSql;
        PRINT N'Dropped foreign keys owned by matched tables in schema ' + QUOTENAME(@SchemaName) + N'.';
    END;

    SET @Sql = N'DROP TABLE ' + @DropList + N';';
    EXEC sys.sp_executesql @Sql;

    PRINT N'Dropped all tables containing `_backup` twice in schema ' + QUOTENAME(@SchemaName) + N'.';

    COMMIT TRAN;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRAN;
    END;
    THROW;
END CATCH;
