/*
NGAT Kubernetes consolidated database migration.

This is the single migration for the current Kubernetes-era NGAT improvements.
It is safe to rerun and performs all changes in one transaction.

Included:
1. Audit lifecycle support (cancel/archive/reactivate stage backup).
2. Division -> Business Unit -> Operating Unit -> Program hierarchy columns.
3. audits_r.createdat default repair (needed after SELECT INTO schema copies).
4. Legacy standard question types -> numeric standard IDs.
   - Exact standard-name matches use standards_r.
   - Legacy ISO9001 is explicitly mapped to standard ID 5.

Not included because they require no database change:
- Objective-evidence report/download UI.
- Multi-select keep-open behavior.
- Report/layout/filter UI changes.

Defaults to dev. Production requires changing BOTH @TargetSchema to N'dbo'
and @AllowDbo to 1 after normal production change review.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @TargetSchema SYSNAME = N'dev';
DECLARE @AllowDbo BIT = 0;

IF @TargetSchema NOT IN (N'dev', N'dbo')
    THROW 50200, 'Only dev or dbo audit schema is supported.', 1;

IF @TargetSchema = N'dbo' AND @AllowDbo <> 1
    THROW 50201, 'Production changes require explicit @AllowDbo=1.', 1;

IF SCHEMA_ID(@TargetSchema) IS NULL
    THROW 50202, 'Target audit schema does not exist.', 1;

DECLARE @AuditsTable NVARCHAR(260) = QUOTENAME(@TargetSchema) + N'.[audits_r]';
DECLARE @BusinessUnitsTable NVARCHAR(260) = QUOTENAME(@TargetSchema) + N'.[business_units_r]';
DECLARE @OperatingUnitsTable NVARCHAR(260) = QUOTENAME(@TargetSchema) + N'.[operating_units_r]';
DECLARE @ProgramsTable NVARCHAR(260) = QUOTENAME(@TargetSchema) + N'.[programs_r]';
DECLARE @QuestionsTable NVARCHAR(260) = QUOTENAME(@TargetSchema) + N'.[nonconformances_r]';
DECLARE @StandardsTable NVARCHAR(260) = QUOTENAME(@TargetSchema) + N'.[standards_r]';

IF OBJECT_ID(@AuditsTable, N'U') IS NULL
    THROW 50203, 'Target audits_r table does not exist.', 1;
IF OBJECT_ID(@BusinessUnitsTable, N'U') IS NULL
    THROW 50204, 'Target business_units_r table does not exist.', 1;
IF OBJECT_ID(@OperatingUnitsTable, N'U') IS NULL
    THROW 50205, 'Target operating_units_r table does not exist.', 1;
IF OBJECT_ID(@ProgramsTable, N'U') IS NULL
    THROW 50206, 'Target programs_r table does not exist.', 1;
IF OBJECT_ID(@QuestionsTable, N'U') IS NULL
    THROW 50207, 'Target nonconformances_r table does not exist.', 1;
IF OBJECT_ID(@StandardsTable, N'U') IS NULL
    THROW 50208, 'Target standards_r table does not exist.', 1;

-- Failed attempts can leave local temp tables in the same SSMS session.
DROP TABLE IF EXISTS #KubernetesLegacyTypeMapping;
DROP TABLE IF EXISTS #KubernetesChangedQuestions;

CREATE TABLE #KubernetesLegacyTypeMapping (
    old_type NVARCHAR(4000) COLLATE DATABASE_DEFAULT NOT NULL,
    standard_id INT NULL,
    matching_standards BIGINT NOT NULL,
    question_count BIGINT NOT NULL
);

CREATE TABLE #KubernetesChangedQuestions (
    ncid INT NOT NULL,
    scheduleid INT NOT NULL,
    old_type NVARCHAR(4000) NULL,
    new_type NVARCHAR(4000) NULL
);

DECLARE @Sql NVARCHAR(MAX);
DECLARE @CreatedAtConstraintName SYSNAME = N'DF_' + @TargetSchema + N'_audits_r_createdat';
DECLARE @ExpectedQuestionUpdates BIGINT = 0;
DECLARE @ActualQuestionUpdates BIGINT = 0;
DECLARE @HasLegacyIso9001 BIT = 0;
DECLARE @HasStandardId5 BIT = 0;

BEGIN TRY
    BEGIN TRANSACTION;

    /* ============================================================
       1. AUDIT LIFECYCLE
       ============================================================ */
    IF COL_LENGTH(@AuditsTable, N'stagebeforeinactive') IS NULL
    BEGIN
        SET @Sql =
            N'ALTER TABLE ' + @AuditsTable +
            N' ADD [stagebeforeinactive] INT NULL;';
        EXEC sys.sp_executesql @Sql;
    END;

    /* ============================================================
       2. ORGANIZATIONAL HIERARCHY
       Full chain: Division -> BU -> OU -> Program.
       Existing values are preserved; new columns are nullable.
       ============================================================ */
    IF COL_LENGTH(@BusinessUnitsTable, N'divisionid') IS NULL
    BEGIN
        SET @Sql =
            N'ALTER TABLE ' + @BusinessUnitsTable +
            N' ADD [divisionid] INT NULL;';
        EXEC sys.sp_executesql @Sql;
    END;

    IF COL_LENGTH(@OperatingUnitsTable, N'divisionid') IS NULL
    BEGIN
        SET @Sql =
            N'ALTER TABLE ' + @OperatingUnitsTable +
            N' ADD [divisionid] INT NULL;';
        EXEC sys.sp_executesql @Sql;
    END;

    IF COL_LENGTH(@OperatingUnitsTable, N'businessunitid') IS NULL
    BEGIN
        SET @Sql =
            N'ALTER TABLE ' + @OperatingUnitsTable +
            N' ADD [businessunitid] INT NULL;';
        EXEC sys.sp_executesql @Sql;
    END;

    IF COL_LENGTH(@ProgramsTable, N'divisionid') IS NULL
    BEGIN
        SET @Sql =
            N'ALTER TABLE ' + @ProgramsTable +
            N' ADD [divisionid] INT NULL;';
        EXEC sys.sp_executesql @Sql;
    END;

    IF COL_LENGTH(@ProgramsTable, N'businessunitid') IS NULL
    BEGIN
        SET @Sql =
            N'ALTER TABLE ' + @ProgramsTable +
            N' ADD [businessunitid] INT NULL;';
        EXEC sys.sp_executesql @Sql;
    END;

    IF COL_LENGTH(@ProgramsTable, N'operatingunitid') IS NULL
    BEGIN
        SET @Sql =
            N'ALTER TABLE ' + @ProgramsTable +
            N' ADD [operatingunitid] INT NULL;';
        EXEC sys.sp_executesql @Sql;
    END;

    /* ============================================================
       3. AUDIT CREATED-AT DEFAULT
       SELECT INTO does not preserve default constraints.
       Existing createdat values (including NULLs) are not changed.
       ============================================================ */
    IF COL_LENGTH(@AuditsTable, N'createdat') IS NULL
        THROW 50209, 'Target audits_r.createdat is missing.', 1;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.columns AS c
        INNER JOIN sys.tables AS t ON t.object_id = c.object_id
        INNER JOIN sys.schemas AS s ON s.schema_id = t.schema_id
        WHERE s.name = @TargetSchema
          AND t.name = N'audits_r'
          AND c.name = N'createdat'
          AND c.default_object_id <> 0
    )
    BEGIN
        IF EXISTS (
            SELECT 1
            FROM sys.objects AS o
            INNER JOIN sys.schemas AS s ON s.schema_id = o.schema_id
            WHERE s.name = @TargetSchema
              AND o.name = @CreatedAtConstraintName
        )
            THROW 50210, 'Intended audits_r.createdat default constraint name is already in use.', 1;

        SET @Sql =
            N'ALTER TABLE ' + @AuditsTable +
            N' ADD CONSTRAINT ' + QUOTENAME(@CreatedAtConstraintName) +
            N' DEFAULT (CURRENT_TIMESTAMP) FOR [createdat];';
        EXEC sys.sp_executesql @Sql;
    END;

    /* ============================================================
       4. LEGACY STANDARD QUESTION TYPES
       PEQ, ETQ, and already-numeric types are untouched.
       ============================================================ */

    -- If ISO9001 exists in legacy rows, the explicitly requested ID 5
    -- must actually exist in the selected schema before anything is changed.
    SET @Sql = N'
        SELECT @Found = CASE WHEN EXISTS (
            SELECT 1
            FROM ' + @QuestionsTable + N'
            WHERE UPPER(LTRIM(RTRIM(CONVERT(NVARCHAR(4000), [type])))) = N''ISO9001''
        ) THEN 1 ELSE 0 END;';

    EXEC sys.sp_executesql
        @Sql,
        N'@Found BIT OUTPUT',
        @Found = @HasLegacyIso9001 OUTPUT;

    IF @HasLegacyIso9001 = 1
    BEGIN
        SET @Sql = N'
            SELECT @Found = CASE WHEN EXISTS (
                SELECT 1
                FROM ' + @StandardsTable + N'
                WHERE standardId = 5
            ) THEN 1 ELSE 0 END;';

        EXEC sys.sp_executesql
            @Sql,
            N'@Found BIT OUTPUT',
            @Found = @HasStandardId5 OUTPUT;

        IF @HasStandardId5 <> 1
            THROW 50211, 'Legacy ISO9001 exists, but standard ID 5 is missing in the target schema.', 1;
    END;

    SET @Sql = N'
        INSERT INTO #KubernetesLegacyTypeMapping
            (old_type, standard_id, matching_standards, question_count)
        SELECT
            legacy.old_type,
            matches.standard_id,
            matches.matching_standards,
            legacy.question_count
        FROM (
            SELECT
                CONVERT(NVARCHAR(4000), nc.[type]) COLLATE DATABASE_DEFAULT AS old_type,
                COUNT_BIG(*) AS question_count
            FROM ' + @QuestionsTable + N' AS nc WITH (UPDLOCK, HOLDLOCK)
            WHERE nc.[type] IS NOT NULL
              AND LTRIM(RTRIM(nc.[type])) <> N''''
              AND UPPER(LTRIM(RTRIM(nc.[type]))) NOT IN (N''PEQ'', N''ETQ'')
              AND TRY_CONVERT(INT, LTRIM(RTRIM(nc.[type]))) IS NULL
            GROUP BY CONVERT(NVARCHAR(4000), nc.[type]) COLLATE DATABASE_DEFAULT
        ) AS legacy
        CROSS APPLY (
            SELECT
                COUNT_BIG(*) AS matching_standards,
                MIN(s.standardId) AS standard_id
            FROM ' + @StandardsTable + N' AS s
            WHERE UPPER(LTRIM(RTRIM(s.standardName))) =
                  UPPER(LTRIM(RTRIM(legacy.old_type)))
        ) AS matches;';

    EXEC sys.sp_executesql @Sql;

    -- Explicit legacy exception requested for NGAT.
    UPDATE #KubernetesLegacyTypeMapping
       SET standard_id = 5,
           matching_standards = 1
     WHERE UPPER(LTRIM(RTRIM(old_type))) = N'ISO9001';

    IF EXISTS (
        SELECT 1
        FROM #KubernetesLegacyTypeMapping
        WHERE matching_standards <> 1
           OR standard_id IS NULL
    )
    BEGIN
        SELECT
            @TargetSchema AS schema_name,
            old_type,
            standard_id,
            matching_standards,
            question_count,
            CASE
                WHEN matching_standards = 0 THEN N'NO MATCH'
                ELSE N'AMBIGUOUS MATCH'
            END AS mapping_status
        FROM #KubernetesLegacyTypeMapping
        WHERE matching_standards <> 1
           OR standard_id IS NULL
        ORDER BY old_type;

        THROW 50212, 'Unmapped or ambiguous legacy standard type; entire Kubernetes migration rolled back.', 1;
    END;

    SELECT
        @ExpectedQuestionUpdates = COALESCE(SUM(question_count), 0)
    FROM #KubernetesLegacyTypeMapping;

    SET @Sql = N'
        UPDATE nc
           SET [type] = CONVERT(NVARCHAR(20), map.standard_id)
        OUTPUT
            inserted.ncid,
            inserted.scheduleid,
            CONVERT(NVARCHAR(4000), deleted.[type]),
            CONVERT(NVARCHAR(4000), inserted.[type])
        INTO #KubernetesChangedQuestions
            (ncid, scheduleid, old_type, new_type)
        FROM ' + @QuestionsTable + N' AS nc
        INNER JOIN #KubernetesLegacyTypeMapping AS map
            ON CONVERT(NVARCHAR(4000), nc.[type]) COLLATE DATABASE_DEFAULT =
               map.old_type;';

    EXEC sys.sp_executesql @Sql;

    SELECT @ActualQuestionUpdates = COUNT_BIG(*)
    FROM #KubernetesChangedQuestions;

    IF @ActualQuestionUpdates <> @ExpectedQuestionUpdates
        THROW 50213, 'Updated standard-question row count differs from expected count; entire migration rolled back.', 1;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;

/* ================================================================
   VERIFICATION
   ================================================================ */
SELECT
    @TargetSchema AS schema_name,
    N'Kubernetes migration complete' AS result,
    @ActualQuestionUpdates AS legacy_standard_questions_updated;

SELECT
    s.name AS schema_name,
    t.name AS table_name,
    c.name AS column_name
FROM sys.columns AS c
INNER JOIN sys.tables AS t ON t.object_id = c.object_id
INNER JOIN sys.schemas AS s ON s.schema_id = t.schema_id
WHERE s.name = @TargetSchema
  AND (
        (t.name = N'audits_r' AND c.name IN (N'stagebeforeinactive', N'createdat'))
        OR
        (t.name = N'business_units_r' AND c.name = N'divisionid')
        OR
        (t.name = N'operating_units_r' AND c.name IN (N'divisionid', N'businessunitid'))
        OR
        (t.name = N'programs_r' AND c.name IN (N'divisionid', N'businessunitid', N'operatingunitid'))
      )
ORDER BY t.name, c.column_id;

SELECT
    @TargetSchema AS schema_name,
    old_type,
    standard_id AS new_type,
    question_count
FROM #KubernetesLegacyTypeMapping
ORDER BY old_type;

SELECT
    scheduleid,
    ncid,
    old_type,
    new_type
FROM #KubernetesChangedQuestions
ORDER BY scheduleid, ncid;
