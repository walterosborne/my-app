const mapHomeLookaheadRow = (row) => ({
    scheduleId: row.scheduleid,
    title: row.title || 'Untitled Audit',
    expectedStartDate: row.expectedstartdate,
    auditorName: row.auditorname || 'TBD'
});

const parseMaybeArray = (value) => {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined || value === '') return [];
    if (typeof value !== 'string') return [value];

    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
    } catch {
        // Some legacy rows use comma-delimited values rather than JSON.
    }

    return trimmed
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map((item) => String(item).trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
};

const parseNumberArray = (value) => parseMaybeArray(value)
    .map((item) => Number(item))
    .filter(Number.isFinite);

const parseStringArray = (value) => parseMaybeArray(value)
    .map((item) => String(item ?? '').trim())
    .filter(Boolean);

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

const mapEntryAuditRow = (row) => ({
    scheduleId: row.scheduleid,
    title: row.title,
    stage: row.stage,
    divisionId: parseNumberArray(row.divisionid),
    programIds: parseNumberArray(row.programids),
    leadAuditorId: row.leadauditorid,
    additionalAuditorIds: parseNumberArray(row.additionalauditorids),
    locked: Number(row.locked) === 1 ? 1 : 0,

    // Schedule Entry fields.
    auditTypeId: row.audittypeid,
    intExtId: row.intextid,
    functionId: row.functionid === undefined ? undefined : parseNumberArray(row.functionid),
    standardIds: row.standardids === undefined ? undefined : parseNumberArray(row.standardids),
    expectedStartDate: row.expectedstartdate,
    expectedCompletionDate: row.expectedcompletiondate,
    sectorId: row.sectorid,
    siteIds: row.siteids === undefined ? undefined : parseNumberArray(row.siteids),
    businessUnitIds: row.businessunitids === undefined ? undefined : parseNumberArray(row.businessunitids),
    operatingUnitIds: row.operatingunitids === undefined ? undefined : parseNumberArray(row.operatingunitids),
    comment: row.comment,

    // Planning fields.
    scope: row.scope,
    safety: row.safety,
    clearance: row.clearance,
    safetyEquipmentIds: row.safetyequipmentids === undefined ? undefined : parseNumberArray(row.safetyequipmentids),
    trainingRequirementIds: row.trainingrequirementids === undefined ? undefined : parseNumberArray(row.trainingrequirementids),
    famaIds: row.famaids === undefined ? undefined : parseStringArray(row.famaids),
    specialConsiderations: row.specialconsiderations,

    // Conduct Audit fields.
    startDate: row.startdate,
    intervieweeIds: row.intervieweeids === undefined ? undefined : parseStringArray(row.intervieweeids),
    overview: row.overview,
    evaluator: row.evaluator,
    relatedItems: row.relateditems,
    programManager: row.programmanager,
    maLeadManager: row.maleadmanager,
    cui: row.cui,
    delayCause: row.delaycause,
    auditorsTime: row.auditorstime,
    auditorstime: row.auditorstime
});

const mapReportAuditRow = (row) => ({
    scheduleId: row.scheduleid,
    title: row.title,
    stage: row.stage,
    divisionId: parseNumberArray(row.divisionid),
    programIds: parseNumberArray(row.programids),
    leadAuditorId: row.leadauditorid,
    additionalAuditorIds: parseNumberArray(row.additionalauditorids),
    intervieweeIds: parseStringArray(row.intervieweeids),
    cui: row.cui,
    locked: Number(row.locked) === 1 ? 1 : 0,
    approvedAt: row.approvedat,
    expectedStartDate: row.expectedstartdate,
    expectedCompletionDate: row.expectedcompletiondate
});

const canAdminEditAudit = ({ audit, userInfo }) => {
    if (!userInfo?.admin || !userInfo?.divisionid) return false;
    const auditDivisionIds = parseNumberArray(audit?.divisionId);
    return auditDivisionIds.includes(Number(userInfo.divisionid));
};

const canManageAudit = ({ audit, userInfo }) => {
    if (canAdminEditAudit({ audit, userInfo })) return true;
    if (!userInfo?.auditorid) return false;
    const auditorId = Number(userInfo.auditorid);
    return Number(audit?.leadAuditorId) === auditorId
        || parseNumberArray(audit?.additionalAuditorIds).includes(auditorId);
};

const canEditAudit = ({ audit, userInfo }) => (
    Number(audit?.stage) !== -2
    && Number(audit?.stage) !== -3
    && canManageAudit({ audit, userInfo })
);

const canViewAuditByProgram = ({ audit, userInfo }) => {
    if (!userInfo?.auditorid) return false;
    const userProgramIds = parseNumberArray(userInfo.programids ?? userInfo.programIds);
    const auditProgramIds = parseNumberArray(audit?.programIds);
    return userProgramIds.length > 0
        && auditProgramIds.some((programId) => userProgramIds.includes(programId));
};

const canAccessAudit = ({ audit, userInfo, report = false, approverScheduleIds = new Set() }) => {
    if (!userInfo || Number(audit?.stage) === -3) return false;

    const myId = userInfo.myid;
    const isAuditor = canManageAudit({ audit, userInfo });
    const isProgramAuditor = canViewAuditByProgram({ audit, userInfo });
    const isAdmin = canAdminEditAudit({ audit, userInfo });

    if (!report) return isAuditor || isAdmin || isProgramAuditor;

    const isInterviewee = Boolean(
        myId && audit?.approvedAt && parseStringArray(audit?.intervieweeIds).includes(String(myId))
    );
    const isApprover = Boolean(
        myId && approverScheduleIds.has(Number(audit?.scheduleId)) && (audit?.locked || audit?.approvedAt)
    );

    return isAuditor || isAdmin || isProgramAuditor || isInterviewee || isApprover;
};

const ENTRY_COMMON_FIELDS = [
    'scheduleid',
    'title',
    'stage',
    'divisionid',
    'programids',
    'leadauditorid',
    'additionalauditorids',
    'CAST(locked AS INT) AS locked'
];

const ENTRY_FIELDS_BY_TYPE = {
    schedule: [
        'audittypeid', 'intextid', 'functionid', 'standardids',
        'expectedstartdate', 'expectedcompletiondate', 'sectorid', 'siteids',
        'businessunitids', 'operatingunitids', 'comment'
    ],
    planning: [
        'scope', 'safety', 'clearance', 'safetyequipmentids',
        'trainingrequirementids', 'famaids', 'specialconsiderations'
    ],
    results: [
        'standardids', 'expectedstartdate', 'startdate', 'intervieweeids',
        'overview', 'evaluator', 'relateditems', 'programmanager', 'maleadmanager',
        'cui', 'delaycause', 'auditorstime'
    ],
    nonconformities: []
};

const normalizeEntryType = (value) => {
    const type = String(value || '').trim().toLowerCase();
    if (type === 'nonconformaties') return 'nonconformities';
    return Object.prototype.hasOwnProperty.call(ENTRY_FIELDS_BY_TYPE, type) ? type : 'summary';
};

export const registerNgatReadRoutes = ({ app, pool, getCurrentUserInfo }) => {
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

    // Entry pages only need the fields used by their audit picker and their
    // current workflow step. Do not send every audit column just to draw the
    // first screen. The selected audit's heavier child data is loaded by the
    // workflow page only when it is actually needed.
    app.get('/api/entry-audits', async (req, res) => {
        const startedAt = Date.now();
        try {
            const userInfo = await getCurrentUserInfo(req);
            if (!userInfo) return res.json([]);

            const type = normalizeEntryType(req.query.type);
            const typeFields = ENTRY_FIELDS_BY_TYPE[type] || [];
            const fields = [...ENTRY_COMMON_FIELDS, ...typeFields];
            const result = await pool.query(`
                SELECT ${fields.join(', ')}
                FROM audits_r
                WHERE stage <> -3
                ORDER BY scheduleid
            `);

            const audits = result.rows
                .map(mapEntryAuditRow)
                .filter((audit) => canAccessAudit({ audit, userInfo }))
                .map((audit) => ({
                    ...audit,
                    canEdit: canEditAudit({ audit, userInfo }),
                    canManage: canManageAudit({ audit, userInfo })
                }));

            res.set('Server-Timing', `entry-audits;dur=${Date.now() - startedAt}`);
            res.json(audits);
        } catch (error) {
            console.error('Error fetching entry audit summaries:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Individual Audit Report needs a dropdown/list of audits, but it should
    // not download the complete record for every accessible audit. The client
    // combines this compact list with one full /api/audits/:id read.
    app.get('/api/report-audits', async (req, res) => {
        const startedAt = Date.now();
        try {
            const userInfo = await getCurrentUserInfo(req);
            if (!userInfo) return res.json([]);

            const auditPromise = pool.query(`
                SELECT
                    scheduleid,
                    title,
                    stage,
                    divisionid,
                    programids,
                    leadauditorid,
                    additionalauditorids,
                    intervieweeids,
                    cui,
                    CAST(locked AS INT) AS locked,
                    approvedat,
                    expectedstartdate,
                    expectedcompletiondate
                FROM audits_r
                WHERE stage <> -3
                ORDER BY scheduleid
            `);
            const approvalsPromise = userInfo.myid
                ? pool.query('SELECT scheduleid FROM approvals_r WHERE approvermyid = $1', [userInfo.myid])
                : Promise.resolve({ rows: [] });

            const [auditResult, approvalsResult] = await Promise.all([auditPromise, approvalsPromise]);
            const approverScheduleIds = new Set(
                approvalsResult.rows.map((row) => Number(row.scheduleid)).filter(Number.isFinite)
            );

            const audits = auditResult.rows
                .map(mapReportAuditRow)
                .filter((audit) => canAccessAudit({
                    audit,
                    userInfo,
                    report: true,
                    approverScheduleIds
                }))
                .map((audit) => ({
                    ...audit,
                    canEdit: canEditAudit({ audit, userInfo }),
                    canManage: canManageAudit({ audit, userInfo })
                }));

            res.set('Server-Timing', `report-audits;dur=${Date.now() - startedAt}`);
            res.json(audits);
        } catch (error) {
            console.error('Error fetching report audit summaries:', error);
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
