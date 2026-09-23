/*
NGAT standard question type migration.

Converts legacy standard-name values (for example, AS9100) in
nonconformances_r.[type] to the matching standards_r.standardId as text.
PEQ, ETQ, and already-numeric types are left untouched. Question content,
findings, responses, and objective evidence are not modified.

Defaults to dev. To deliberately target production, change BOTH
@TargetSchema to N'dbo' and @AllowDbo to 1 after change review.

Run in the NGAT audit database. Re-runnable; fails and rolls back if any
legacy type has zero or multiple matching standards.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @TargetSchema SYSNAME = N'dev';
DECLARE @AllowDbo BIT = 0;

IF @TargetSchema NOT IN (N'dev', N'dbo')
    THROW 50170, 'Only dev or dbo audit schema is supported.', 1;
IF @TargetSchema = N'dbo' AND @AllowDbo <> 1
    THROW 50171, 'Production changes require explicit @AllowDbo=1.', 1;
IF SCHEMA_ID(@TargetSchema) IS NULL
    THROW 50172, 'Target audit schema does not exist.', 1;

DECLARE @QuestionsTable NVARCHAR(260) = QUOTENAME(@TargetSchema) + N'.[nonconformances_r]';
DECLARE @StandardsTable NVARCHAR(260) = QUOTENAME(@TargetSchema) + N'.[standards_r]';

IF OBJECT_ID(@QuestionsTable, N'U') IS NULL
    THROW 50173, 'Target nonconformances_r table does not exist.', 1;
IF OBJECT_ID(@StandardsTable, N'U') IS NULL
    THROW 50174, 'Target standards_r table does not exist.', 1;

CREATE TABLE #LegacyTypeMapping (
    old_type NVARCHAR(4000) COLLATE DATABASE_DEFAULT NOT NULL,
    standard_id INT NULL,
    matching_standards BIGINT NOT NULL,
    question_count BIGINT NOT NULL
);

CREATE TABLE #ChangedQuestions (
    ncid INT NOT NULL,
    scheduleid INT NOT NULL,
    old_type NVARCHAR(4000) NULL,
    new_type NVARCHAR(4000) NULL
);

DECLARE @Sql NVARCHAR(MAX) = N'
    INSERT INTO #LegacyTypeMapping (old_type, standard_id, matching_standards, question_count)
    SELECT legacy.old_type, matches.standard_id,
           matches.matching_standards, legacy.question_count
    FROM (
        SELECT CONVERT(NVARCHAR(4000), nc.[type]) COLLATE DATABASE_DEFAULT AS old_type,
               COUNT_BIG(*) AS question_count
        FROM ' + @QuestionsTable + N' AS nc WITH (UPDLOCK, HOLDLOCK)
        WHERE nc.[type] IS NOT NULL
          AND LTRIM(RTRIM(nc.[type])) <> N''''
          AND UPPER(LTRIM(RTRIM(nc.[type]))) NOT IN (N''PEQ'', N''ETQ'')
          AND TRY_CONVERT(INT, LTRIM(RTRIM(nc.[type]))) IS NULL
        GROUP BY CONVERT(NVARCHAR(4000), nc.[type]) COLLATE DATABASE_DEFAULT
    ) AS legacy
    CROSS APPLY (
        SELECT COUNT_BIG(*) AS matching_standards,
               MIN(s.standardId) AS standard_id
        FROM ' + @StandardsTable + N' AS s
        WHERE UPPER(LTRIM(RTRIM(s.standardName))) =
              UPPER(LTRIM(RTRIM(legacy.old_type)))
    ) AS matches;

    SELECT @SchemaName AS schema_name, old_type, standard_id,
           matching_standards, question_count,
           CASE WHEN matching_standards = 1 THEN N''OK''
                WHEN matching_standards = 0 THEN N''NO MATCH''
                ELSE N''AMBIGUOUS MATCH'' END AS mapping_status
    FROM #LegacyTypeMapping
    ORDER BY old_type;

    IF EXISTS (
        SELECT 1
        FROM #LegacyTypeMapping
        WHERE matching_standards <> 1 OR standard_id IS NULL
    )
        THROW 50175, ''Unmapped or ambiguous legacy standard type; nothing was changed.'', 1;

    UPDATE nc
       SET [type] = CONVERT(NVARCHAR(20), map.standard_id)
    OUTPUT inserted.ncid, inserted.scheduleid,
           CONVERT(NVARCHAR(4000), deleted.[type]),
           CONVERT(NVARCHAR(4000), inserted.[type])
      INTO #ChangedQuestions (ncid, scheduleid, old_type, new_type)
    FROM ' + @QuestionsTable + N' AS nc
    INNER JOIN #LegacyTypeMapping AS map
       ON CONVERT(NVARCHAR(4000), nc.[type]) COLLATE DATABASE_DEFAULT = map.old_type;

    IF (SELECT COUNT_BIG(*) FROM #ChangedQuestions) <>
       (SELECT COALESCE(SUM(question_count), 0) FROM #LegacyTypeMapping)
        THROW 50176, ''Updated row count differs from mapping count; rolling back.'', 1;
';

BEGIN TRY
    BEGIN TRANSACTION;

    EXEC sys.sp_executesql
        @Sql,
        N'@SchemaName SYSNAME',
        @SchemaName = @TargetSchema;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

SELECT @TargetSchema AS schema_name,
       COUNT_BIG(*) AS questions_updated
FROM #ChangedQuestions;

SELECT scheduleid, ncid, old_type, new_type
FROM #ChangedQuestions
ORDER BY scheduleid, ncid;
