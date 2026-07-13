/*
Lists all tables whose names do not contain `_r`.

Notes:
- This is read-only. It does not modify any tables.
- Leave @SchemaName as NULL to search every schema.
- Set @SchemaName to a specific schema name to narrow the results.

Examples:
- N'dbo'
- N'dev'
- N'stag'
*/

SET NOCOUNT ON;

DECLARE @SchemaName sysname = NULL;

SELECT
    s.name AS schema_name,
    t.name AS table_name
FROM sys.tables AS t
INNER JOIN sys.schemas AS s
    ON s.schema_id = t.schema_id
WHERE t.name NOT LIKE N'%[_]r%'
  AND (@SchemaName IS NULL OR s.name = @SchemaName)
ORDER BY s.name, t.name;
