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
5. Normalized audit question/finding model for multiple responses per question.
   - Creates audit_questions_r and audit_findings_r.
   - Migrates every existing nonconformances_r row to one question + one finding.
   - Preserves each legacy ncid as the migrated finding ID.

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
DECLARE @AuditQuestionsTable NVARCHAR(260) = QUOTENAME(@TargetSchema) + N'.[audit_questions_r]';
DECLARE @AuditFindingsTable NVARCHAR(260) = QUOTENAME(@TargetSchema) + N'.[audit_findings_r]';

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

    /* ============================================================
       5. NORMALIZED QUESTION / FINDING MODEL
       A question can now own zero or many findings/responses.
       The legacy nonconformances_r table remains in place as migration
       history; the Kubernetes app reads/writes the normalized tables.
       ============================================================ */
    IF OBJECT_ID(@AuditQuestionsTable, N'U') IS NULL
    BEGIN
        SET @Sql = N'
            CREATE TABLE ' + @AuditQuestionsTable + N' (
                questionid INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                scheduleid INT NOT NULL,
                [type] NVARCHAR(20) NOT NULL,
                sourceid INT NULL,
                section INT NULL,
                subsection INT NULL,
                question NVARCHAR(MAX) NULL,
                sortorder INT NOT NULL CONSTRAINT [DF_' + @TargetSchema + N'_audit_questions_sortorder] DEFAULT (0),
                createdat DATETIME2 NOT NULL CONSTRAINT [DF_' + @TargetSchema + N'_audit_questions_createdat] DEFAULT (CURRENT_TIMESTAMP),
                updatedat DATETIME2 NOT NULL CONSTRAINT [DF_' + @TargetSchema + N'_audit_questions_updatedat] DEFAULT (CURRENT_TIMESTAMP)
            );';
        EXEC sys.sp_executesql @Sql;
    END;

    IF OBJECT_ID(@AuditFindingsTable, N'U') IS NULL
    BEGIN
        SET @Sql = N'
            CREATE TABLE ' + @AuditFindingsTable + N' (
                findingid INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                questionid INT NOT NULL,
                findingtype INT NULL,
                response NVARCHAR(MAX) NULL,
                auditorcomment NVARCHAR(MAX) NULL,
                details NVARCHAR(MAX) NULL,
                ain NVARCHAR(50) NULL,
                division NVARCHAR(MAX) NOT NULL CONSTRAINT [DF_' + @TargetSchema + N'_audit_findings_division] DEFAULT (N''[]''),
                sector NVARCHAR(MAX) NOT NULL CONSTRAINT [DF_' + @TargetSchema + N'_audit_findings_sector] DEFAULT (N''[]''),
                qma NVARCHAR(MAX) NOT NULL CONSTRAINT [DF_' + @TargetSchema + N'_audit_findings_qma] DEFAULT (N''[]''),
                other NVARCHAR(MAX) NOT NULL CONSTRAINT [DF_' + @TargetSchema + N'_audit_findings_other] DEFAULT (N''[]''),
                files NVARCHAR(MAX) NOT NULL CONSTRAINT [DF_' + @TargetSchema + N'_audit_findings_files] DEFAULT (N''[]''),
                severity INT NULL,
                sortorder INT NOT NULL CONSTRAINT [DF_' + @TargetSchema + N'_audit_findings_sortorder] DEFAULT (0),
                createdat DATETIME2 NOT NULL CONSTRAINT [DF_' + @TargetSchema + N'_audit_findings_createdat] DEFAULT (CURRENT_TIMESTAMP),
                updatedat DATETIME2 NOT NULL CONSTRAINT [DF_' + @TargetSchema + N'_audit_findings_updatedat] DEFAULT (CURRENT_TIMESTAMP)
            );';
        EXEC sys.sp_executesql @Sql;
    END;

    -- Refuse to continue if a partially-created normalized table is missing
    -- a required column. This prevents silently creating incompatible data.
    IF COL_LENGTH(@AuditQuestionsTable, N'questionid') IS NULL
       OR COL_LENGTH(@AuditQuestionsTable, N'scheduleid') IS NULL
       OR COL_LENGTH(@AuditQuestionsTable, N'type') IS NULL
       OR COL_LENGTH(@AuditQuestionsTable, N'sourceid') IS NULL
       OR COL_LENGTH(@AuditQuestionsTable, N'section') IS NULL
       OR COL_LENGTH(@AuditQuestionsTable, N'subsection') IS NULL
       OR COL_LENGTH(@AuditQuestionsTable, N'question') IS NULL
       OR COL_LENGTH(@AuditQuestionsTable, N'sortorder') IS NULL
       OR COL_LENGTH(@AuditQuestionsTable, N'createdat') IS NULL
       OR COL_LENGTH(@AuditQuestionsTable, N'updatedat') IS NULL
        THROW 50214, 'audit_questions_r exists but does not match the Kubernetes schema.', 1;

    IF COL_LENGTH(@AuditFindingsTable, N'findingid') IS NULL
       OR COL_LENGTH(@AuditFindingsTable, N'questionid') IS NULL
       OR COL_LENGTH(@AuditFindingsTable, N'findingtype') IS NULL
       OR COL_LENGTH(@AuditFindingsTable, N'response') IS NULL
       OR COL_LENGTH(@AuditFindingsTable, N'auditorcomment') IS NULL
       OR COL_LENGTH(@AuditFindingsTable, N'details') IS NULL
       OR COL_LENGTH(@AuditFindingsTable, N'ain') IS NULL
       OR COL_LENGTH(@AuditFindingsTable, N'division') IS NULL
       OR COL_LENGTH(@AuditFindingsTable, N'sector') IS NULL
       OR COL_LENGTH(@AuditFindingsTable, N'qma') IS NULL
       OR COL_LENGTH(@AuditFindingsTable, N'other') IS NULL
       OR COL_LENGTH(@AuditFindingsTable, N'files') IS NULL
       OR COL_LENGTH(@AuditFindingsTable, N'severity') IS NULL
       OR COL_LENGTH(@AuditFindingsTable, N'sortorder') IS NULL
       OR COL_LENGTH(@AuditFindingsTable, N'createdat') IS NULL
       OR COL_LENGTH(@AuditFindingsTable, N'updatedat') IS NULL
        THROW 50215, 'audit_findings_r exists but does not match the Kubernetes schema.', 1;

    -- SELECT INTO schema copies drop defaults. Restore the timestamp defaults
    -- required by normal application inserts when these tables already exist.
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(@AuditQuestionsTable)
          AND name = N'createdat' AND default_object_id <> 0
    )
    BEGIN
        SET @Sql = N'ALTER TABLE ' + @AuditQuestionsTable +
            N' ADD CONSTRAINT [DF_' + @TargetSchema +
            N'_audit_questions_createdat] DEFAULT (CURRENT_TIMESTAMP) FOR [createdat];';
        EXEC sys.sp_executesql @Sql;
    END;

    IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(@AuditQuestionsTable)
          AND name = N'updatedat' AND default_object_id <> 0
    )
    BEGIN
        SET @Sql = N'ALTER TABLE ' + @AuditQuestionsTable +
            N' ADD CONSTRAINT [DF_' + @TargetSchema +
            N'_audit_questions_updatedat] DEFAULT (CURRENT_TIMESTAMP) FOR [updatedat];';
        EXEC sys.sp_executesql @Sql;
    END;

    IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(@AuditFindingsTable)
          AND name = N'createdat' AND default_object_id <> 0
    )
    BEGIN
        SET @Sql = N'ALTER TABLE ' + @AuditFindingsTable +
            N' ADD CONSTRAINT [DF_' + @TargetSchema +
            N'_audit_findings_createdat] DEFAULT (CURRENT_TIMESTAMP) FOR [createdat];';
        EXEC sys.sp_executesql @Sql;
    END;

    IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(@AuditFindingsTable)
          AND name = N'updatedat' AND default_object_id <> 0
    )
    BEGIN
        SET @Sql = N'ALTER TABLE ' + @AuditFindingsTable +
            N' ADD CONSTRAINT [DF_' + @TargetSchema +
            N'_audit_findings_updatedat] DEFAULT (CURRENT_TIMESTAMP) FOR [updatedat];';
        EXEC sys.sp_executesql @Sql;
    END;

    -- Preserve legacy identifiers on first migration. Each current legacy
    -- record becomes one question with one finding, exactly as it exists today.
    SET @Sql = N'
        SET IDENTITY_INSERT ' + @AuditQuestionsTable + N' ON;

        INSERT INTO ' + @AuditQuestionsTable + N'
            (questionid, scheduleid, [type], sourceid, section, subsection,
             question, sortorder, createdat, updatedat)
        SELECT
            nc.ncid,
            nc.scheduleid,
            nc.[type],
            NULL,
            nc.section,
            nc.subsection,
            nc.question,
            ROW_NUMBER() OVER (PARTITION BY nc.scheduleid ORDER BY nc.ncid),
            COALESCE(nc.createdat, CURRENT_TIMESTAMP),
            COALESCE(nc.updatedat, nc.createdat, CURRENT_TIMESTAMP)
        FROM ' + @QuestionsTable + N' AS nc
        WHERE NOT EXISTS (
            SELECT 1
            FROM ' + @AuditQuestionsTable + N' AS q
            WHERE q.questionid = nc.ncid
        );

        SET IDENTITY_INSERT ' + @AuditQuestionsTable + N' OFF;

        SET IDENTITY_INSERT ' + @AuditFindingsTable + N' ON;

        INSERT INTO ' + @AuditFindingsTable + N'
            (findingid, questionid, findingtype, response, auditorcomment,
             details, ain, division, sector, qma, other, files, severity,
             sortorder, createdat, updatedat)
        SELECT
            nc.ncid,
            nc.ncid,
            nc.findingtype,
            nc.response,
            nc.auditorcomment,
            nc.details,
            nc.ain,
            COALESCE(nc.division, N''[]''),
            COALESCE(nc.sector, N''[]''),
            COALESCE(nc.qma, N''[]''),
            COALESCE(nc.other, N''[]''),
            COALESCE(nc.files, N''[]''),
            nc.severity,
            1,
            COALESCE(nc.createdat, CURRENT_TIMESTAMP),
            COALESCE(nc.updatedat, nc.createdat, CURRENT_TIMESTAMP)
        FROM ' + @QuestionsTable + N' AS nc
        WHERE NOT EXISTS (
            SELECT 1
            FROM ' + @AuditFindingsTable + N' AS f
            WHERE f.findingid = nc.ncid
        );

        SET IDENTITY_INSERT ' + @AuditFindingsTable + N' OFF;';
    EXEC sys.sp_executesql @Sql;

    -- Indexes are idempotent and intentionally created after the legacy load.
    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(@AuditQuestionsTable)
          AND name = N'IX_audit_questions_schedule'
    )
    BEGIN
        SET @Sql = N'CREATE INDEX [IX_audit_questions_schedule] ON ' +
            @AuditQuestionsTable + N' ([scheduleid], [sortorder], [questionid]);';
        EXEC sys.sp_executesql @Sql;
    END;

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(@AuditFindingsTable)
          AND name = N'IX_audit_findings_question'
    )
    BEGIN
        SET @Sql = N'CREATE INDEX [IX_audit_findings_question] ON ' +
            @AuditFindingsTable + N' ([questionid], [sortorder], [findingid]);';
        EXEC sys.sp_executesql @Sql;
    END;

    DECLARE @FindingFkName SYSNAME = N'FK_' + @TargetSchema + N'_audit_findings_question';
    IF NOT EXISTS (
        SELECT 1
        FROM sys.foreign_keys
        WHERE parent_object_id = OBJECT_ID(@AuditFindingsTable)
          AND name = @FindingFkName
    )
    BEGIN
        SET @Sql = N'ALTER TABLE ' + @AuditFindingsTable +
            N' ADD CONSTRAINT ' + QUOTENAME(@FindingFkName) +
            N' FOREIGN KEY ([questionid]) REFERENCES ' + @AuditQuestionsTable +
            N' ([questionid]) ON DELETE CASCADE;';
        EXEC sys.sp_executesql @Sql;
    END;

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

SET @Sql = N'
    SELECT
        @SchemaName AS schema_name,
        (SELECT COUNT_BIG(*) FROM ' + @AuditQuestionsTable + N') AS audit_questions,
        (SELECT COUNT_BIG(*) FROM ' + @AuditFindingsTable + N') AS audit_findings,
        (SELECT COUNT_BIG(*) FROM ' + @QuestionsTable + N') AS legacy_rows;';
EXEC sys.sp_executesql
    @Sql,
    N'@SchemaName SYSNAME',
    @SchemaName = @TargetSchema;

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
