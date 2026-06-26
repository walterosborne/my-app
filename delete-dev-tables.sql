/*
Deletes every user table in the `Dev` schema.

Important:
- This permanently drops the tables.
- It only drops user tables in the target schema.
- It requires the target schema to already exist.
- It drops foreign keys owned by tables in the target schema before dropping tables.
- It will stop if tables in another schema still reference tables in the target schema.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @SchemaName sysname = N'Dev';
DECLARE @DropList nvarchar(max);
DECLARE @InternalFkDropSql nvarchar(max);
DECLARE @ExternalReferenceList nvarchar(max);
DECLARE @UnsafeDboDropList nvarchar(max);
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

SELECT
    @UnsafeDboDropList = STRING_AGG(CAST(QUOTENAME(t.name) AS nvarchar(max)), N', ')
FROM sys.tables AS t
INNER JOIN sys.schemas AS s
    ON s.schema_id = t.schema_id
WHERE s.name = @SchemaName
  AND s.name = N'dbo'
  AND t.name NOT LIKE N'%[_]backup%';

IF @UnsafeDboDropList IS NOT NULL AND LTRIM(RTRIM(@UnsafeDboDropList)) <> N''
BEGIN
    SELECT @UnsafeDboDropList AS UnsafeDboDropTables;
    THROW 50033, 'Refusing to drop non-backup tables in dbo. Only _backup tables may be removed from dbo with this script.', 1;
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
  AND parent_schema.name <> @SchemaName;

IF @ExternalReferenceList IS NOT NULL AND LTRIM(RTRIM(@ExternalReferenceList)) <> N''
BEGIN
    SELECT @ExternalReferenceList AS ExternalReferencingForeignKeys;
    THROW 50032, 'Cannot drop target schema tables because tables in other schemas still reference them.', 1;
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
WHERE parent_schema.name = @SchemaName;

BEGIN TRY
    BEGIN TRAN;

    IF @InternalFkDropSql IS NOT NULL AND LTRIM(RTRIM(@InternalFkDropSql)) <> N''
    BEGIN
        EXEC sys.sp_executesql @InternalFkDropSql;
        PRINT N'Dropped foreign keys owned by tables in schema ' + QUOTENAME(@SchemaName) + N'.';
    END;

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
