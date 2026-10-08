const mapHomeLookaheadRow = (row) => ({
    scheduleId: row.scheduleid,
    title: row.title || 'Untitled Audit',
    expectedStartDate: row.expectedstartdate,
    auditorName: row.auditorname || 'TBD'
});

const parseNumberArray = (value) => {
    if (Array.isArray(value)) {
        return value.map(Number).filter(Number.isFinite);
    }
    if (value === null || value === undefined || value === '') {
        return [];
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return [];
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return parsed.map(Number).filter(Number.isFinite);
            }
        } catch {
            // Fall back to comma-delimited values used by some legacy rows.
        }
        return trimmed
            .replace(/^\[|\]$/g, '')
            .split(',')
            .map((item) => Number(String(item).trim()))
            .filter(Number.isFinite);
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? [numeric] : [];
};

const mapMetricsAuditRow = (row) => ({
    scheduleId: row.scheduleid,
    intExtId: row.intextid,
    functionId: parseNumberArray(row.functionid),
    stage: row.stage,
    expectedStartDate: row.expectedstartdate,
    expectedCompletionDate: row.expectedcompletiondate,
    startDate: row.startdate,
    divisionId: parseNumberArray(row.divisionid),
    programIds: parseNumberArray(row.programids),
    sectorId: row.sectorid,
    siteIds: parseNumberArray(row.siteids),
    businessUnitIds: parseNumberArray(row.businessunitids),
    operatingUnitIds: parseNumberArray(row.operatingunitids),
    leadAuditorId: row.leadauditorid,
    additionalAuditorIds: parseNumberArray(row.additionalauditorids),
    locked: Number(row.locked) === 1 ? 1 : 0,
    delayCause: row.delaycause,
    approvedAt: row.approvedat,
    submittedAt: row.submittedat
});

const mapMetricsFindingRow = (row) => ({
    scheduleId: row.scheduleid,
    type: row.type,
    section: row.section,
    subsection: row.subsection,
    findingType: row.findingtype,
    severity: row.severity
});

export const registerNgatReadRoutes = ({ app, pool }) => {
    // Home-page 30-day lookahead: keep this deliberately narrow so opening
    // NGAT does not download every audit and every auditor just to populate
    // the sidebar. The date predicates stay on the raw column so SQL Server
    // can use an index on expectedStartDate if one is present.
    app.get('/api/home-lookahead', async (_req, res) => {
        try {
            const result = await pool.query(`
                SELECT
                    a.scheduleid,
                    a.title,
                    a.expectedstartdate,
                    CASE
                        WHEN au.auditorid IS NULL THEN 'TBD'
                        WHEN NULLIF(LTRIM(RTRIM(au.lname)), '') IS NOT NULL
                             AND NULLIF(LTRIM(RTRIM(au.fname)), '') IS NOT NULL
                            THEN CONCAT(au.lname, ', ', au.fname)
                        ELSE COALESCE(
                            NULLIF(LTRIM(RTRIM(au.lname)), ''),
                            NULLIF(LTRIM(RTRIM(au.fname)), ''),
                            'TBD'
                        )
                    END AS auditorname
                FROM audits_r AS a
                LEFT JOIN auditors_r AS au
                    ON au.auditorid = a.leadauditorid
                WHERE a.stage <> -3
                  AND a.expectedstartdate >= CAST(GETDATE() AS date)
                  AND a.expectedstartdate < DATEADD(day, 31, CAST(GETDATE() AS date))
                ORDER BY a.expectedstartdate, a.scheduleid
            `);

            res.json(result.rows.map(mapHomeLookaheadRow));
        } catch (error) {
            console.error('Error fetching home lookahead:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Metrics only needs a small subset of each audit. Avoid the much wider
    // general /api/audits payload (comments, approvers, text fields, etc.).
    app.get('/api/metrics/audits', async (_req, res) => {
        try {
            const result = await pool.query(`
                SELECT
                    scheduleid,
                    intextid,
                    functionid,
                    stage,
                    expectedstartdate,
                    expectedcompletiondate,
                    startdate,
                    divisionid,
                    programids,
                    sectorid,
                    siteids,
                    businessunitids,
                    operatingunitids,
                    leadauditorid,
                    additionalauditorids,
                    CAST(locked AS INT) AS locked,
                    delaycause,
                    approvedat,
                    submittedat
                FROM audits_r
                WHERE stage <> -3
                ORDER BY scheduleid
            `);

            res.json(result.rows.map(mapMetricsAuditRow));
        } catch (error) {
            console.error('Error fetching metrics audits:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Metrics counts and groups findings but does not need response text,
    // evidence/file metadata, action items, or audit-detail fields.
    app.get('/api/metrics/findings', async (_req, res) => {
        try {
            const result = await pool.query(`
                SELECT
                    q.scheduleid,
                    q.[type],
                    q.section,
                    q.subsection,
                    f.findingtype,
                    f.severity
                FROM audit_questions_r AS q
                INNER JOIN audit_findings_r AS f
                    ON f.questionid = q.questionid
                INNER JOIN audits_r AS a
                    ON a.scheduleid = q.scheduleid
                WHERE a.stage <> -3
                ORDER BY q.scheduleid, q.sortorder, q.questionid, f.sortorder, f.findingid
            `);

            res.json(result.rows.map(mapMetricsFindingRow));
        } catch (error) {
            console.error('Error fetching metrics findings:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
};
