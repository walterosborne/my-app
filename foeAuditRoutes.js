import crypto from 'crypto';

const normalizeKey = (value) => String(value ?? '').replace(/[^a-z0-9]/gi, '').toLowerCase();

const readValue = (row, ...candidateNames) => {
    if (!row) return undefined;
    const candidates = new Set(candidateNames.map(normalizeKey));
    const key = Object.keys(row).find((rowKey) => candidates.has(normalizeKey(rowKey)));
    return key === undefined ? undefined : row[key];
};

const parseSiteIds = (value) => {
    if (Array.isArray(value)) {
        return value.map(Number).filter(Number.isFinite);
    }
    if (value === null || value === undefined || value === '') {
        return [];
    }
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed)
            ? parsed.map(Number).filter(Number.isFinite)
            : [];
    } catch {
        return [];
    }
};

const mapSite = (row) => ({
    siteId: Number(readValue(row, 'SiteID')),
    siteName: readValue(row, 'Site') ?? '',
    parentDivisionId: readValue(row, 'ParentDiv') ?? null,
    active: Number(readValue(row, 'Archive') ?? 0) === 1 ? 0 : 1
});

const mapAuditArea = (row) => ({
    auditAreaId: Number(readValue(row, 'AuditAreaID')),
    name: readValue(row, 'AuditArea') ?? '',
    parentSiteId: Number(readValue(row, 'Parent')),
    team: readValue(row, 'Team') ?? '',
    manager: readValue(row, 'Manager') ?? '',
    active: Number(readValue(row, 'Archive') ?? 0) === 1 ? 0 : 1
});

const mapDivision = (row) => ({
    divisionId: Number(readValue(row, 'DivisionID')),
    divisionName: readValue(row, 'Division') ?? '',
    active: Number(readValue(row, 'Archive') ?? 0) === 1 ? 0 : 1
});

const mapShift = (row) => ({
    shiftId: Number(readValue(row, 'ShiftID')),
    shiftName: readValue(row, 'Shift') ?? '',
    active: Number(readValue(row, 'Archive') ?? 0) === 1 ? 0 : 1
});

const mapCustomer = (row) => ({
    customerId: Number(readValue(row, 'CustomerID')),
    customerName: readValue(row, 'Customer') ?? '',
    active: Number(readValue(row, 'Archive') ?? 0) === 1 ? 0 : 1
});

const mapDiscrepancyType = (row) => ({
    number: readValue(row, 'Number', 'Discrepancy Type Number') ?? '',
    description: readValue(row, 'Description', 'Discrepancy Type Description') ?? '',
    foeElement: readValue(row, 'FOE Element', 'Discrepancy Type FOE Element') ?? null,
    riskCategory: readValue(row, 'Risk Category', 'Discrepancy Type Risk Category') ?? null
});

const mapFinding = (row, descriptionsByNumber = new Map()) => {
    const number = readValue(row, 'Discrepancy Type Number', 'Number') ?? '';
    return {
        id: readValue(row, 'ID') ?? null,
        title: readValue(row, 'Title') ?? null,
        number,
        quantity: Number(readValue(row, 'Discrepancy Type Quantity', 'Quantity') ?? 0),
        comment: readValue(row, 'Discrepancy Type Comment', 'Comment') ?? '',
        foeElement: readValue(row, 'Discrepancy Type FOE Element', 'FOE Element') ?? null,
        riskCategory: readValue(row, 'Discrepancy Type Risk Category', 'Risk Category') ?? null,
        description: descriptionsByNumber.get(String(number)) ?? ''
    };
};

const mapAudit = (row) => {
    const draftValue = readValue(row, 'Draft');
    return {
        title: readValue(row, 'Title') ?? null,
        auditAreaId: readValue(row, 'AuditAreaID') ?? null,
        divisionId: readValue(row, 'DivisionID') ?? null,
        foeCategory: readValue(row, 'FOE Category') ?? null,
        auditDate: readValue(row, 'Audit Date') ?? null,
        auditorName: readValue(row, 'AuditorNameResolved', 'Auditor Name') ?? '',
        siteId: readValue(row, 'SiteID') ?? null,
        program: readValue(row, 'ProgramName', 'Program') ?? null,
        customer: readValue(row, 'Customer') ?? null,
        onProduct: readValue(row, 'On Product') ?? null,
        toolBoxNumber: readValue(row, 'Tool Box Number') ?? null,
        model: readValue(row, 'Model') ?? null,
        type: readValue(row, 'Type') ?? null,
        effectivity: readValue(row, 'Ship') ?? null,
        shift: readValue(row, 'Shift') ?? null,
        auditNote: readValue(row, 'Audit Note') ?? null,
        team: readValue(row, 'Team') ?? null,
        sector: readValue(row, 'Sector') ?? null,
        created: readValue(row, 'Created') ?? null,
        createdBy: readValue(row, 'Created By') ?? null,
        userId: readValue(row, 'UserID') ?? null,
        draft: draftValue === true || Number(draftValue) === 1,
        siteName: readValue(row, 'SiteName') ?? '',
        divisionName: readValue(row, 'DivisionName') ?? '',
        auditAreaName: readValue(row, 'AuditAreaName') ?? '',
        auditAreaTeam: readValue(row, 'AuditAreaTeam') ?? '',
        auditAreaManager: readValue(row, 'AuditAreaManager') ?? ''
    };
};

const getCurrentFoeAuditor = async (req, pool, getCurrentUserInfo) => {
    const identity = await getCurrentUserInfo(req);
    if (!identity?.myid) return null;

    const result = await pool.query(
        [
            'SELECT TOP 1 [UserID], [Name], [MyID], [Approved], [Lead], [Admin], [Archive]',
            'FROM [dbo].[FodeAuditors]',
            'WHERE LOWER(LTRIM(RTRIM([MyID]))) = LOWER(LTRIM(RTRIM($1)))'
        ].join('\n'),
        [identity.myid]
    );
    const row = result.rows[0];
    if (!row || Number(readValue(row, 'Archive') ?? 0) === 1) return null;

    return {
        userId: Number(readValue(row, 'UserID')),
        name: readValue(row, 'Name') ?? identity.rostername ?? '',
        myId: readValue(row, 'MyID') ?? identity.myid,
        approvedSiteIds: parseSiteIds(readValue(row, 'Approved')),
        leadSiteIds: parseSiteIds(readValue(row, 'Lead')),
        isAdmin: Number(readValue(row, 'Admin') ?? 0) === 1
    };
};

const getDiscrepancyTypes = async (pool) => {
    const result = await pool.query('SELECT * FROM [dbo].[FodeDTS]');
    return result.rows
        .map(mapDiscrepancyType)
        .sort((left, right) => String(left.number).localeCompare(String(right.number), undefined, { numeric: true }));
};

const getFindingRows = async (pool) => {
    const [findingResult, discrepancyTypes] = await Promise.all([
        pool.query('SELECT * FROM [dbo].[FodeFindings] ORDER BY [Title], [ID]'),
        getDiscrepancyTypes(pool)
    ]);
    const descriptionsByNumber = new Map(
        discrepancyTypes.map((row) => [String(row.number), row.description || ''])
    );
    return findingResult.rows.map((row) => mapFinding(row, descriptionsByNumber));
};

const getAuditRows = async (pool) => {
    const result = await pool.query(
        [
            'SELECT',
            '    a.*,',
            '    COALESCE(au.[Name], a.[Auditor Name]) AS [AuditorNameResolved],',
            '    s.[Site] AS [SiteName],',
            '    d.[Division] AS [DivisionName],',
            '    aa.[AuditArea] AS [AuditAreaName],',
            '    aa.[Team] AS [AuditAreaTeam],',
            '    aa.[Manager] AS [AuditAreaManager],',
            '    p.[Program] AS [ProgramName]',
            'FROM [dbo].[FodeAudits] a',
            'LEFT JOIN [dbo].[FodeAuditors] au ON au.[UserID] = a.[UserID]',
            'LEFT JOIN [dbo].[FodeSites] s ON s.[SiteID] = a.[SiteID]',
            'LEFT JOIN [dbo].[FodeDivisions] d ON d.[DivisionID] = a.[DivisionID]',
            'LEFT JOIN [dbo].[FodeAuditAreas] aa ON aa.[AuditAreaID] = a.[AuditAreaID]',
            'LEFT JOIN [dbo].[FodePrograms] p ON p.[ProgramID] = a.[ProgramID]',
            'ORDER BY a.[Audit Date] DESC, a.[Title] DESC'
        ].join('\n')
    );
    return result.rows.map(mapAudit);
};

const attachFindings = (audits, findings) => {
    const findingsByTitle = new Map();
    findings.forEach((finding) => {
        const key = String(finding.title);
        if (!findingsByTitle.has(key)) findingsByTitle.set(key, []);
        findingsByTitle.get(key).push(finding);
    });
    return audits.map((audit) => ({
        ...audit,
        findings: findingsByTitle.get(String(audit.title)) || []
    }));
};

const rollback = async (client, context) => {
    if (!client) return;
    try {
        await client.query('ROLLBACK');
    } catch (error) {
        console.error('Error rolling back ' + context + ':', error);
    }
};

export const registerFoeAuditRoutes = ({ app, pool, getCurrentUserInfo }) => {
    app.get('/api/foe-audit-workspace', async (req, res) => {
        try {
            const currentUser = await getCurrentFoeAuditor(req, pool, getCurrentUserInfo);
            if (!currentUser) {
                return res.json({
                    currentUser: null,
                    sites: [],
                    auditAreas: [],
                    divisions: [],
                    shifts: [],
                    customers: [],
                    discrepancyTypes: [],
                    myAudits: [],
                    drafts: [],
                    reviewAudits: []
                });
            }

            const [
                sitesResult,
                auditAreasResult,
                divisionsResult,
                shiftsResult,
                customersResult,
                discrepancyTypes,
                audits,
                findings
            ] = await Promise.all([
                pool.query('SELECT [SiteID], [Site], [ParentDiv], [Archive] FROM [dbo].[FodeSites] ORDER BY [Site]'),
                pool.query('SELECT [AuditAreaID], [AuditArea], [Parent], [Archive], [Team], [Manager] FROM [dbo].[FodeAuditAreas] ORDER BY [AuditArea]'),
                pool.query('SELECT [DivisionID], [Division], [Archive] FROM [dbo].[FodeDivisions] ORDER BY [Division]'),
                pool.query('SELECT [ShiftID], [Shift], [Archive] FROM [dbo].[FodeShifts] ORDER BY [Shift]'),
                pool.query('SELECT [CustomerID], [Customer], [Archive] FROM [dbo].[FodeCustomers] ORDER BY [Customer]'),
                getDiscrepancyTypes(pool),
                getAuditRows(pool),
                getFindingRows(pool)
            ]);

            const auditsWithFindings = attachFindings(audits, findings);
            const currentUserId = Number(currentUser.userId);
            const leadSiteIds = new Set((currentUser.leadSiteIds || []).map(Number));

            const myAudits = auditsWithFindings.filter(
                (audit) => !audit.draft && Number(audit.userId) === currentUserId
            );
            const drafts = auditsWithFindings.filter(
                (audit) => audit.draft && Number(audit.userId) === currentUserId
            );
            const reviewAudits = currentUser.leadSiteIds.length > 0
                ? auditsWithFindings.filter(
                    (audit) => !audit.draft && leadSiteIds.has(Number(audit.siteId))
                )
                : myAudits;

            return res.json({
                currentUser,
                sites: sitesResult.rows.map(mapSite),
                auditAreas: auditAreasResult.rows.map(mapAuditArea),
                divisions: divisionsResult.rows.map(mapDivision),
                shifts: shiftsResult.rows.map(mapShift),
                customers: customersResult.rows.map(mapCustomer),
                discrepancyTypes,
                myAudits,
                drafts,
                reviewAudits
            });
        } catch (error) {
            console.error('Error fetching FOE audit workspace:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    });

    app.get('/api/foe-report-data', async (_req, res) => {
        try {
            const [audits, findings] = await Promise.all([
                getAuditRows(pool),
                getFindingRows(pool)
            ]);
            return res.json({ audits, findings });
        } catch (error) {
            console.error('Error fetching FOE report data:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    });

    app.post('/api/foe-audits', async (req, res) => {
        let client = null;
        try {
            const currentUser = await getCurrentFoeAuditor(req, pool, getCurrentUserInfo);
            if (!currentUser) {
                return res.status(403).json({ success: false, error: 'FOE auditor access is required.' });
            }

            const requestedTitle = req.body?.title;
            const isDraft = Boolean(req.body?.draft);
            const rawSiteId = req.body?.siteId;
            const rawAuditAreaId = req.body?.auditAreaId;
            const siteId = rawSiteId === null || rawSiteId === undefined || rawSiteId === ''
                ? null
                : Number(rawSiteId);
            const auditAreaId = rawAuditAreaId === null || rawAuditAreaId === undefined || rawAuditAreaId === ''
                ? null
                : Number(rawAuditAreaId);
            const foeCategory = req.body?.foeCategory;
            const auditDate = req.body?.auditDate || null;
            const auditNote = req.body?.auditNote == null ? null : String(req.body.auditNote);

            if (siteId !== null && !Number.isFinite(siteId)) {
                return res.status(400).json({ success: false, error: 'Site is invalid.' });
            }
            if (auditAreaId !== null && !Number.isFinite(auditAreaId)) {
                return res.status(400).json({ success: false, error: 'Audit Area is invalid.' });
            }
            if (
                !isDraft
                && (
                    !siteId
                    || !auditAreaId
                    || foeCategory === null
                    || foeCategory === undefined
                    || foeCategory === ''
                    || !auditDate
                )
            ) {
                return res.status(400).json({
                    success: false,
                    error: 'Site, Audit Area, FOE Category, and Audit Date are required.'
                });
            }
            if (auditNote && auditNote.length > 350) {
                return res.status(400).json({ success: false, error: 'Audit Note is too long. Max 350 characters.' });
            }

            const existingAudits = requestedTitle !== null && requestedTitle !== undefined && requestedTitle !== ''
                ? await getAuditRows(pool)
                : [];
            const existingAudit = existingAudits.find(
                (audit) => String(audit.title) === String(requestedTitle)
            );

            if (requestedTitle !== null && requestedTitle !== undefined && requestedTitle !== '' && !existingAudit) {
                return res.status(404).json({ success: false, error: 'FOE audit not found.' });
            }

            if (existingAudit) {
                if (existingAudit.draft) {
                    if (Number(existingAudit.userId) !== Number(currentUser.userId)) {
                        return res.status(403).json({ success: false, error: 'You can only edit your own FOE drafts.' });
                    }
                } else if (!(currentUser.leadSiteIds || []).map(Number).includes(Number(existingAudit.siteId))) {
                    return res.status(403).json({
                        success: false,
                        error: 'Only lead auditors can edit completed FOE audits for their lead sites.'
                    });
                }
            }

            const permittedSiteIds = new Set([
                ...(currentUser.approvedSiteIds || []),
                ...(currentUser.leadSiteIds || [])
            ].map(Number));
            if (siteId !== null && !permittedSiteIds.has(siteId)) {
                return res.status(403).json({
                    success: false,
                    error: 'You are not approved to audit the selected site.'
                });
            }

            if (
                existingAudit
                && !existingAudit.draft
                && (siteId === null || !(currentUser.leadSiteIds || []).map(Number).includes(siteId))
            ) {
                return res.status(403).json({
                    success: false,
                    error: 'Completed audits must remain within a site you lead.'
                });
            }

            const [siteResult, areaResult, discrepancyTypes] = await Promise.all([
                siteId === null
                    ? Promise.resolve({ rows: [] })
                    : pool.query('SELECT [SiteID], [Site], [ParentDiv], [Archive] FROM [dbo].[FodeSites] WHERE [SiteID] = $1', [siteId]),
                auditAreaId === null
                    ? Promise.resolve({ rows: [] })
                    : pool.query('SELECT [AuditAreaID], [AuditArea], [Parent], [Archive], [Team], [Manager] FROM [dbo].[FodeAuditAreas] WHERE [AuditAreaID] = $1', [auditAreaId]),
                getDiscrepancyTypes(pool)
            ]);
            const siteRow = siteResult.rows[0] || null;
            const areaRow = areaResult.rows[0] || null;

            if (siteId !== null && !siteRow) {
                return res.status(400).json({ success: false, error: 'Selected FOE site does not exist.' });
            }
            if (auditAreaId !== null && !areaRow) {
                return res.status(400).json({ success: false, error: 'Selected Audit Area does not exist.' });
            }
            if (
                siteId !== null
                && auditAreaId !== null
                && Number(readValue(areaRow, 'Parent')) !== siteId
            ) {
                return res.status(400).json({
                    success: false,
                    error: 'Selected Audit Area does not belong to the selected Site.'
                });
            }

            const isNewAudit = !existingAudit;
            if (isNewAudit && siteRow && Number(readValue(siteRow, 'Archive') ?? 0) === 1) {
                return res.status(400).json({
                    success: false,
                    error: 'Archived FOE sites cannot be used for new audits.'
                });
            }
            if (isNewAudit && areaRow && Number(readValue(areaRow, 'Archive') ?? 0) === 1) {
                return res.status(400).json({
                    success: false,
                    error: 'Archived Audit Areas cannot be used for new audits.'
                });
            }

            const divisionId = siteRow ? Number(readValue(siteRow, 'ParentDiv')) || null : null;
            if (!isDraft && !divisionId) {
                return res.status(400).json({
                    success: false,
                    error: 'The selected FOE site does not have a parent Division.'
                });
            }

            client = await pool.connect();
            await client.query('BEGIN');

            let title = existingAudit?.title ?? null;
            if (title === null || title === undefined || title === '') {
                const hash = crypto.randomBytes(10).toString('hex').toUpperCase();
                const titleInsert = await client.query(
                    'INSERT INTO [dbo].[FodeTitleHash] ([Hash], [Created]) VALUES ($1, GETDATE()) RETURNING [Title]',
                    [hash]
                );
                title = readValue(titleInsert.rows[0], 'Title');
                if (title === null || title === undefined || title === '') {
                    const titleLookup = await client.query(
                        'SELECT MAX([Title]) AS [Title] FROM [dbo].[FodeTitleHash] WHERE [Hash] = $1',
                        [hash]
                    );
                    title = readValue(titleLookup.rows[0], 'Title');
                }
            }

            if (title === null || title === undefined || title === '') {
                throw new Error('Unable to generate a FOE audit title.');
            }

            const createdValue = existingAudit?.created || new Date();
            const ownerUserId = existingAudit?.userId || currentUser.userId;
            const auditorName = existingAudit?.auditorName || currentUser.name;

            if (existingAudit) {
                await client.query('DELETE FROM [dbo].[FodeFindings] WHERE [Title] = $1', [title]);
                await client.query('DELETE FROM [dbo].[FodeAudits] WHERE [Title] = $1', [title]);
            }

            const insertSql = [
                'INSERT INTO [dbo].[FodeAudits] (',
                '    [Title], [AuditAreaID], [DivisionID], [FOE Category], [Audit Date],',
                '    [Auditor Name], [SiteID], [Program], [Customer], [On Product],',
                '    [Tool Box Number], [Model], [Type], [Ship], [Shift], [Audit Note],',
                '    [Team], [Sub Team 1], [Sub Team 2], [Sector], [Division],',
                '    [Site Mfg Lead], [Program Manager], [Team Manager],',
                '    [Sub Team 1 Manager], [Sub Team 2 Manager], [Sector Manager],',
                '    [Division Manager], [Audit Area Manager], [Created], [Created By],',
                '    [UserID], [Draft]',
                ') VALUES (',
                '    $1, $2, $3, $4, $5,',
                '    $6, $7, $8, $9, $10,',
                '    $11, $12, $13, $14, $15, $16,',
                '    $17, $18, $19, $20, $21,',
                '    $22, $23, $24, $25, $26, $27,',
                '    $28, $29, $30, $31, $32, $33',
                ')'
            ].join('\n');

            await client.query(insertSql, [
                Number(title),
                auditAreaId,
                divisionId,
                foeCategory === null || foeCategory === undefined || foeCategory === '' ? null : String(foeCategory),
                auditDate,
                auditorName,
                siteId,
                null,
                req.body?.customer || null,
                req.body?.onProduct || null,
                req.body?.toolBoxNumber || null,
                req.body?.model || null,
                req.body?.type || null,
                req.body?.effectivity || null,
                req.body?.shift || null,
                auditNote,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                createdValue,
                null,
                Number(ownerUserId),
                isDraft ? 1 : null
            ]);

            const definitionsByNumber = new Map(
                discrepancyTypes.map((definition) => [String(definition.number), definition])
            );
            const submittedFindings = Array.isArray(req.body?.findings) ? req.body.findings : [];
            let findingIndex = 0;

            for (const finding of submittedFindings) {
                const quantity = Math.max(0, Math.trunc(Number(finding?.quantity || 0)));
                if (!Number.isFinite(quantity) || quantity <= 0) continue;

                const number = String(finding?.number ?? '');
                const definition = definitionsByNumber.get(number);
                if (!definition) continue;

                const findingId = String(Number(title) + findingIndex + 1);
                findingIndex += 1;

                await client.query(
                    [
                        'INSERT INTO [dbo].[FodeFindings] (',
                        '    [ID], [Title], [Discrepancy Type Number], [Discrepancy Type Quantity],',
                        '    [Discrepancy Type Comment], [Discrepancy Type FOE Element],',
                        '    [Discrepancy Type Risk Category]',
                        ') VALUES ($1, $2, $3, $4, $5, $6, $7)'
                    ].join('\n'),
                    [
                        findingId,
                        Number(title),
                        number,
                        quantity,
                        finding?.comment ? String(finding.comment) : null,
                        definition.foeElement,
                        definition.riskCategory
                    ]
                );
            }

            await client.query('COMMIT');
            client.release();
            client = null;

            return res.json({ success: true, title: Number(title), draft: isDraft });
        } catch (error) {
            await rollback(client, 'FOE audit save');
            client?.release?.();
            console.error('Error saving FOE audit:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    });

    app.delete('/api/foe-audits/:title', async (req, res) => {
        let client = null;
        try {
            const currentUser = await getCurrentFoeAuditor(req, pool, getCurrentUserInfo);
            if (!currentUser) {
                return res.status(403).json({ success: false, error: 'FOE auditor access is required.' });
            }

            const audit = (await getAuditRows(pool)).find(
                (row) => String(row.title) === String(req.params.title)
            );
            if (!audit) {
                return res.status(404).json({ success: false, error: 'FOE audit not found.' });
            }

            const canDeleteDraft = audit.draft
                && Number(audit.userId) === Number(currentUser.userId);
            const canDeleteCompleted = !audit.draft
                && (currentUser.leadSiteIds || []).map(Number).includes(Number(audit.siteId));

            if (!canDeleteDraft && !canDeleteCompleted) {
                return res.status(403).json({
                    success: false,
                    error: audit.draft
                        ? 'You can only delete your own FOE drafts.'
                        : 'Only lead auditors can delete completed FOE audits for their lead sites.'
                });
            }

            client = await pool.connect();
            await client.query('BEGIN');
            await client.query('DELETE FROM [dbo].[FodeFindings] WHERE [Title] = $1', [audit.title]);
            await client.query('DELETE FROM [dbo].[FodeAudits] WHERE [Title] = $1', [audit.title]);
            await client.query('COMMIT');
            client.release();
            client = null;

            return res.json({ success: true, title: audit.title });
        } catch (error) {
            await rollback(client, 'FOE audit delete');
            client?.release?.();
            console.error('Error deleting FOE audit:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    });
};
