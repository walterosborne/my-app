import express from 'express';
import sql from 'mssql';
import cors from 'cors';
import multer from 'multer';
import crypto from 'crypto';
import archiver from 'archiver';
import nodemailer from 'nodemailer';

const app = express();
app.use(cors());
app.use(express.json());

const sqlConfig = {
    server: `tcp:${process.env.auditserver || ''}`,
    database: process.env.auditdb || '',
    user: process.env.user || '',
    password: process.env.password || '',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

const sqlPool = new sql.ConnectionPool(sqlConfig);
const sqlPoolPromise = sqlPool.connect();

const normalizeRow = (row) => {
    if (!row) return row;
    return Object.entries(row).reduce((acc, [key, value]) => {
        acc[key.toLowerCase()] = value;
        return acc;
    }, {});
};

const formatResult = (result) => ({
    rows: (result?.recordset ?? []).map(normalizeRow),
    rowCount: Array.isArray(result?.rowsAffected) ? (result.rowsAffected[0] || 0) : 0
});

const applyReturningClause = (queryText) => {
    const match = queryText.match(/\sRETURNING\s+([\s\S]+)$/i);
    if (!match) return queryText;
    const returning = match[1].trim();
    let base = queryText.slice(0, match.index).trim();
    const output = returning
        .split(',')
        .map((col) => `inserted.${col.trim()}`)
        .join(', ');

    if (/^INSERT/i.test(base)) {
        base = base.replace(/\)\s*VALUES/i, `) OUTPUT ${output} VALUES`);
        return base;
    }

    if (/^UPDATE/i.test(base)) {
        const whereIndex = base.toUpperCase().indexOf(' WHERE ');
        if (whereIndex >= 0) {
            return `${base.slice(0, whereIndex)} OUTPUT ${output}${base.slice(whereIndex)}`;
        }
        return `${base} OUTPUT ${output}`;
    }

    return base;
};

const prepareSql = (queryText) => {
    let sqlText = applyReturningClause(queryText);
    sqlText = sqlText.replace(/\$(\d+)/g, '@p$1');
    sqlText = sqlText.replace(/([A-Za-z0-9_]+)::int\b/gi, 'CAST($1 AS int)');
    sqlText = sqlText.replace(/@p(\d+)::int\b/gi, 'CAST(@p$1 AS int)');
    return sqlText;
};

const runQuery = async (request, queryText, params = []) => {
    const sqlText = prepareSql(queryText);
    params.forEach((value, idx) => {
        request.input(`p${idx + 1}`, value);
    });
    const result = await request.query(sqlText);
    return formatResult(result);
};

const pool = {
    query: async (queryText, params = []) => {
        const poolConn = await sqlPoolPromise;
        const request = poolConn.request();
        return runQuery(request, queryText, params);
    },
    connect: async () => {
        const poolConn = await sqlPoolPromise;
        const transaction = new sql.Transaction(poolConn);
        let inTransaction = false;

        return {
            query: async (queryText, params = []) => {
                const trimmed = queryText.trim().toUpperCase();
                if (trimmed === 'BEGIN') {
                    if (!inTransaction) {
                        await transaction.begin();
                        inTransaction = true;
                    }
                    return { rows: [], rowCount: 0 };
                }
                if (trimmed === 'COMMIT') {
                    if (inTransaction) {
                        await transaction.commit();
                        inTransaction = false;
                    }
                    return { rows: [], rowCount: 0 };
                }
                if (trimmed === 'ROLLBACK') {
                    if (inTransaction) {
                        await transaction.rollback();
                        inTransaction = false;
                    }
                    return { rows: [], rowCount: 0 };
                }

                const request = inTransaction ? new sql.Request(transaction) : poolConn.request();
                return runQuery(request, queryText, params);
            },
            release: () => { }
        };
    }
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }
});

const SMTP_HOST = 'replace me';
const SMTP_PORT = 25;
const SMTP_FROM = 'NGAT@ngc.com';
const smtpTransport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false
});

//const HARD_CODED_NETWORK_ID = 'Z12345'; // auditor test Jaime Lopez, no audits
//const HARD_CODED_NETWORK_ID = 'B00002'; // auditor test Jennifer Brown, has audits
//const HARD_CODED_NETWORK_ID = 'R12345'; // roster non-auditor approver test Alex Nguyen
//const HARD_CODED_NETWORK_ID = 'A00001'; // roster non-auditor auditee test Anderson Michael
const HARD_CODED_NETWORK_ID = 'E00001'; // Auditor and admin John Smith

const getNetworkIdFromRequest = (req) => {
    // const networkId = req.get('X-Auth-Header');
    // return networkId;
    return HARD_CODED_NETWORK_ID;
};

const getCurrentUserInfo = async (req) => {
    const networkId = getNetworkIdFromRequest(req);
    if (!networkId) return null;
    const result = await pool.query(
        `SELECT TOP 1 r.rostername, r.myid, r.networkid, a.auditorid, a.divisionid, COALESCE(a.admin, 0) AS admin
         FROM roster_r r
         LEFT JOIN auditors_r a ON a.myid = r.myid
         WHERE r.networkid = $1`,
        [networkId]
    );
    return result.rows[0] ?? null;
};

const getCurrentAuditorId = async (req) => {
    const userInfo = await getCurrentUserInfo(req);
    return userInfo?.auditorid ?? null;
};

const sanitizeFilename = (name) => {
    return String(name || 'file').replace(/[/\\]/g, '_').replace(/"/g, '');
};

const sendSmtpEmail = async ({ toAddress, subject, body }) => {
    if (!SMTP_HOST || SMTP_HOST === 'replace me') {
        console.warn('SMTP host not configured. Skipping SMTP send.');
        return;
    }
    await smtpTransport.sendMail({
        from: SMTP_FROM,
        to: toAddress,
        subject,
        html: body
    });
};

const queueEmail = async (client, { toAddress, subject, body }) => {
    try {
        await sendSmtpEmail({ toAddress, subject, body });
    } catch (error) {
        console.error('SMTP send failed:', error);
    }
    await client.query(
        `INSERT INTO email_outbox_r (toAddress, subject, body)
         VALUES ($1, $2, $3)`,
        [toAddress, subject, body]
    );
};

const buildApprovalEmail = ({ approverName, auditTitle, scheduleId, approvalLink, reviewLink }) => {
    const safeApprover = approverName || 'Approver';
    const safeTitle = auditTitle || `Audit ${scheduleId}`;
    const subject = `Approval Request: ${safeTitle} (Schedule ID ${scheduleId})`;
    const body = `
<div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5;">
  <p>Hello ${safeApprover},</p>
  <p>You have been selected as an approver for the audit below. Please review and confirm your approval.</p>
  <div style="padding: 12px 16px; background: #f3f4f6; border-radius: 6px; margin: 16px 0;">
    <strong>Audit:</strong> ${safeTitle}<br />
    <strong>Schedule ID:</strong> ${scheduleId}
  </div>
  <p>
    <a href="${reviewLink}" style="background: #e5e7eb; color: #1f2937; padding: 10px 14px; border-radius: 6px; text-decoration: none; margin-top: 8px; display: inline-block;">
      Review Audit
    </a>
    <a href="${approvalLink}" style="background: green; color: #ffffff; padding: 10px 14px; border-radius: 6px; text-decoration: none; margin-top: 8px; margin-left: 12px;  display: inline-block;">
      Approve
    </a>
</div>
`.trim();
    return { subject, body };
};

const buildNewAuditNotificationEmail = ({ auditTitle, scheduleId, reviewLink, planLink }) => {
    const safeTitle = auditTitle || `Audit ${scheduleId}`;
    const subject = auditTitle
        ? `Audit ${scheduleId} - ${auditTitle} has been created!`
        : `Audit ${scheduleId} has been created!`;
    const body = `
<div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5;">
  <h1 style="font-size: 24px; margin-bottom: 6px;">Audit ${scheduleId} has been created!</h1>
  <h2 style="font-size: 18px; color: #1d4ed8; margin-top: 0;">You have completed step 1/5 of the NGAT auditing process</h2>
  <p style="font-size: 16px; margin-bottom: 12px;">${safeTitle}</p>
  <a href="${reviewLink}" style="background: #e5e7eb; color: #1f2937; padding: 10px 16px; border-radius: 6px; text-decoration: none; margin-bottom: 16px; display: inline-block;">
    Review the audit
  </a>
  <h3 style="font-size: 16px; color: #1e293b; margin-top: 24px;">Next Steps</h3>
  <p style="margin-top: 4px; margin-bottom: 16px;">
    Finalize the planning details, prepare to conduct the audit, and capture any nonconformities that arise during the engagement.
  </p>
  <a href="${planLink}" style="background: #1d4ed8; color: #ffffff; padding: 10px 16px; border-radius: 6px; text-decoration: none; margin-bottom: 16px; display: inline-block;">
    Plan the audit
  </a>
  <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
    You are receiving this email because you are listed as an auditor for this audit.
  </p>
</div>
`.trim();
    return { subject, body };
};

const buildEditAuditNotificationEmail = ({ scheduleId, reviewLink, planLink, auditTitle }) => {
    const subject = auditTitle
        ? `Audit ${scheduleId} - ${auditTitle} has been edited`
        : `Audit ${scheduleId} has been edited`;
    const body = `
<div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5;">
  <h1 style="font-size: 24px; margin-bottom: 12px;">Audit ${scheduleId} has been edited</h1>
  <p>You are receiving this email because you are listed as an auditor for this audit.</p>
  <div style="margin-top: 16px;">
    <a href="${reviewLink}" style="background: #e5e7eb; color: #1f2937; padding: 10px 16px; border-radius: 6px; text-decoration: none; margin-right: 12px; display: inline-block;">
      Review changes
    </a>
    <a href="${planLink}" style="background: #1d4ed8; color: #ffffff; padding: 10px 16px; border-radius: 6px; text-decoration: none; display: inline-block;">
      Plan the audit
    </a>
  </div>
</div>
`.trim();
    return { subject, body };
};

const escapeHtml = (value) => {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

const buildAuditorAccessRequestEmail = ({
    requestName,
    requestMyId,
    requestEmail,
    divisionName,
    reason,
    approveLink
}) => {
    const safeName = escapeHtml(requestName || 'Requester');
    const safeMyId = escapeHtml(requestMyId || 'Unknown');
    const safeDivision = escapeHtml(divisionName || 'your division');
    const safeReason = escapeHtml(reason || 'No reason provided.');
    const subject = `${requestName || 'User'} (${requestMyId || 'Unknown'}) auditor access request`;

    const mailtoSubject = `More information needed for auditor request (${requestMyId || 'Unknown'})`;
    const mailtoBody = `I am the division lead for ${divisionName || 'your division'}, and would like more information about your auditor approval request.`;
    const mailtoLink = `mailto:${encodeURIComponent(requestEmail || '')}?subject=${encodeURIComponent(mailtoSubject)}&body=${encodeURIComponent(mailtoBody)}`;

    const body = `
<div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5;">
  <h1 style="font-size: 22px; margin-bottom: 8px;">${safeName} (${safeMyId}) is requesting to be an auditor</h1>
  <h2 style="font-size: 16px; margin: 12px 0 6px;">Reason for request:</h2>
  <p style="margin-top: 0;">${safeReason}</p>
  <div style="margin-top: 16px;">
    <a href="${approveLink}" style="background: green; color: #ffffff; padding: 10px 16px; border-radius: 6px; text-decoration: none; margin-right: 12px; display: inline-block;">
      Click here to approve this request
    </a>
    <a href="${mailtoLink}" target="_blank" rel="noreferrer" style="background: #dc2626; color: #ffffff; padding: 10px 16px; border-radius: 6px; text-decoration: none; display: inline-block;">
      Request more information
    </a>
  </div>
  <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
    You are receiving this email because you are listed as the division lead for ${safeDivision}.
  </p>
</div>
`.trim();

    return { subject, body };
};

const formatAuditorName = (firstName, lastName) => {
    const safeFirst = String(firstName ?? '').trim();
    const safeLast = String(lastName ?? '').trim();
    if (safeLast && safeFirst) {
        return `${safeLast}, ${safeFirst}`;
    }
    return safeLast || safeFirst || '';
};

const parseAuditorName = (auditorName) => {
    if (!auditorName) {
        return { firstName: '', lastName: '' };
    }
    const [rawLast = '', rawFirst = ''] = String(auditorName).split(',');
    return {
        firstName: rawFirst.trim(),
        lastName: rawLast.trim()
    };
};

const parseMaybeJsonArray = (value) => {
    if (Array.isArray(value)) {
        return value;
    }
    if (value === null || value === undefined) {
        return [];
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
            return [];
        }
        try {
            const parsed = JSON.parse(trimmed);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }
    return [];
};

const normalizeNumberArray = (value) => {
    return parseMaybeJsonArray(value)
        .map((item) => {
            if (typeof item === 'number') return item;
            if (typeof item === 'string' && item.trim() !== '') {
                const num = Number(item);
                return Number.isFinite(num) ? num : null;
            }
            return null;
        })
        .filter((item) => item !== null);
};

const normalizeStringArray = (value) => {
    return parseMaybeJsonArray(value)
        .map((item) => String(item).trim())
        .filter((item) => item.length > 0);
};

const parseAuditRow = (row) => {
    const additionalAuditors = normalizeStringArray(row.additionalauditors);
    return {
        scheduleId: row.scheduleid,
        title: row.title,
        auditTypeId: row.audittypeid,
        intExtId: row.intextid,
        functionId: row.functionid,
        standardIds: normalizeNumberArray(row.standardids),
        statusId: row.statusid,
        stage: row.stage,
        expectedStartDate: row.expectedstartdate,
        expectedCompletionDate: row.expectedcompletiondate,
        startDate: row.startdate,
        divisionId: row.divisionid,
        programIds: normalizeNumberArray(row.programids),
        sectorId: row.sectorid,
        siteIds: normalizeNumberArray(row.siteids),
        businessUnitIds: normalizeNumberArray(row.businessunitids),
        operatingUnitIds: normalizeNumberArray(row.operatingunitids),
        leadAuditorId: row.leadauditorid,
        leadauditorid: row.leadauditorid,
        additionalAuditorIds: normalizeNumberArray(row.additionalauditorids),
        locked: row.locked,
        comment: row.comment,
        scope: row.scope,
        safety: row.safety,
        clearance: row.clearance,
        safetyEquipmentIds: normalizeNumberArray(row.safetyequipmentids),
        trainingRequirementIds: normalizeNumberArray(row.trainingrequirementids),
        famaIds: normalizeStringArray(row.famaids),
        intervieweeIds: normalizeStringArray(row.intervieweeids),
        specialConsiderations: row.specialconsiderations,
        overview: row.overview,
        evaluator: row.evaluator,
        relatedItems: row.relateditems,
        programManager: row.programmanager,
        maLeadManager: row.maleadmanager,
        delayCause: row.delaycause,
        auditorsTime: row.auditorstime,
        auditorstime: row.auditorstime,
        previousCarsEffective: row.previouscarseffective,
        previouscarseffective: row.previouscarseffective,
        approver: row.approver,
        leadAuditor: row.leadauditor,
        additionalAuditors,
        additionalauditors: additionalAuditors,
        approvedAt: row.approvedat,
        submittedAt: row.submittedat,
        createdAt: row.createdat,
        updatedAt: row.updatedat
    };
};

const canAccessAudit = ({ audit, userInfo, report = false, approverScheduleIds = new Set() }) => {
    if (!userInfo) return false;

    const auditorId = userInfo.auditorid;
    const myId = userInfo.myid;
    const isAuditor = Boolean(
        auditorId &&
        (audit.leadAuditorId === auditorId || (audit.additionalAuditorIds || []).includes(auditorId))
    );

    const isAdmin = Boolean(
        userInfo.admin && userInfo.divisionid && audit.divisionId === userInfo.divisionid
    );

    if (!report) {
        return isAuditor || isAdmin;
    }

    const isInterviewee = Boolean(
        myId && audit.approvedAt && (audit.intervieweeIds || []).includes(myId)
    );

    const isApprover = Boolean(
        myId && approverScheduleIds.has(audit.scheduleId) && (audit.locked || audit.approvedAt)
    );

    return isAuditor || isAdmin || isInterviewee || isApprover;
};

// Test database connection
sqlPoolPromise
    .then(async () => {
        await pool.query('SELECT GETDATE()');
        console.log('Database connected successfully');
    })
    .catch((err) => {
        console.error('Database connection error:', err);
    });

// Get nonconformances for a specific schedule
app.get('/api/nonconformances/:scheduleId', async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const result = await pool.query(
            'SELECT * FROM nonconformances_r WHERE scheduleId = $1 ORDER BY ncId',
            [parseInt(scheduleId)]
        );

        // Parse array fields back to arrays and convert column names to camelCase
        const nonconformances = result.rows.map(nc => ({
            ncId: nc.ncid,
            scheduleId: nc.scheduleid,
            type: nc.type,
            findingType: nc.findingtype,
            severity: nc.severity,
            section: nc.section,
            subsection: nc.subsection,
            question: nc.question,
            response: nc.response,
            auditorComment: nc.auditorcomment,
            details: nc.details,
            ncDetails: nc.ncdetails,
            AIN: nc.ain,
            division: parseMaybeJsonArray(nc.division),
            sector: parseMaybeJsonArray(nc.sector),
            qma: parseMaybeJsonArray(nc.qma),
            other: parseMaybeJsonArray(nc.other),
            files: parseMaybeJsonArray(nc.files),
            createdAt: nc.createdat,
            updatedAt: nc.updatedat
        }));

        res.json(nonconformances);
    } catch (error) {
        console.error('Error fetching nonconformances:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get files for current auditor
app.get('/api/auditor-files', async (req, res) => {
    try {
        const auditorId = await getCurrentAuditorId(req);
        if (!auditorId) {
            return res.status(403).json({ success: false, error: 'User is not an auditor.' });
        }

        const result = await pool.query(
            `SELECT fileId, fileName, mimeType, fileSize, createdAt
             FROM auditor_files_r
             WHERE auditorId = $1
             ORDER BY createdAt DESC`,
            [auditorId]
        );

        const files = result.rows.map((row) => ({
            fileId: row.fileid,
            fileName: row.filename,
            mimeType: row.mimetype,
            fileSize: row.filesize,
            createdAt: row.createdat
        }));

        res.json(files);
    } catch (error) {
        console.error('Error fetching auditor files:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Upload file for current auditor
app.post('/api/auditor-files', upload.single('file'), async (req, res) => {
    try {
        const auditorId = await getCurrentAuditorId(req);
        if (!auditorId) {
            return res.status(403).json({ success: false, error: 'User is not an auditor.' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded.' });
        }

        const fileName = sanitizeFilename(req.file.originalname);
        const duplicateCheck = await pool.query(
            `SELECT fileId FROM auditor_files_r WHERE auditorId = $1 AND fileName = $2`,
            [auditorId, fileName]
        );

        if (duplicateCheck.rowCount > 0) {
            return res.status(409).json({ success: false, error: 'A file with that name already exists.' });
        }

        const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

        const insertResult = await pool.query(
            `INSERT INTO auditor_files_r (auditorId, fileName, mimeType, fileSize, fileHash, fileData)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING fileId, fileName, mimeType, fileSize, createdAt`,
            [
                auditorId,
                fileName,
                req.file.mimetype,
                req.file.size,
                fileHash,
                req.file.buffer
            ]
        );

        const saved = insertResult.rows[0];
        res.json({
            fileId: saved.fileid,
            fileName: saved.filename,
            mimeType: saved.mimetype,
            fileSize: saved.filesize,
            createdAt: saved.createdat
        });
    } catch (error) {
        console.error('Error uploading auditor file:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Download file for current auditor
app.get('/api/auditor-files/:fileId/download', async (req, res) => {
    try {
        const auditorId = await getCurrentAuditorId(req);
        if (!auditorId) {
            return res.status(403).json({ success: false, error: 'User is not an auditor.' });
        }

        const { fileId } = req.params;
        const result = await pool.query(
            `SELECT fileName, mimeType, fileData
             FROM auditor_files_r
             WHERE fileId = $1 AND auditorId = $2`,
            [Number(fileId), auditorId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'File not found.' });
        }

        const row = result.rows[0];
        const safeName = sanitizeFilename(row.filename);
        res.setHeader('Content-Type', row.mimetype || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
        res.send(row.filedata);
    } catch (error) {
        console.error('Error downloading auditor file:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Download all objective evidence files for an audit (zip)
app.get('/api/audits/:scheduleId/objective-evidence.zip', async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const auditId = parseInt(scheduleId, 10);
        const userInfo = await getCurrentUserInfo(req);

        if (!userInfo || Number.isNaN(auditId)) {
            return res.status(404).json({ success: false, error: 'Audit not found' });
        }

        const auditResult = await pool.query(
            `SELECT *, locked::int as locked FROM audits_r WHERE scheduleid = $1`,
            [auditId]
        );
        if (auditResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Audit not found' });
        }

        const audit = parseAuditRow(auditResult.rows[0]);
        let approverScheduleIds = new Set();
        if (userInfo.myid) {
            const approvalsResult = await pool.query(
                'SELECT scheduleid FROM approvals_r WHERE scheduleid = $1 AND approvermyid = $2',
                [auditId, userInfo.myid]
            );
            if (approvalsResult.rows.length > 0) {
                approverScheduleIds.add(auditId);
            }
        }

        if (!canAccessAudit({ audit, userInfo, report: true, approverScheduleIds })) {
            return res.status(404).json({ success: false, error: 'Audit not found' });
        }

        const ncResult = await pool.query(
            'SELECT files FROM nonconformances_r WHERE scheduleId = $1',
            [auditId]
        );
        const fileIdSet = new Set();
        ncResult.rows.forEach((row) => {
            const ids = parseMaybeJsonArray(row.files);
            ids.forEach((id) => {
                const parsed = Number(id);
                if (Number.isFinite(parsed)) {
                    fileIdSet.add(parsed);
                }
            });
        });

        const fileIds = Array.from(fileIdSet);
        if (fileIds.length === 0) {
            return res.status(404).json({ success: false, error: 'No objective evidence files found.' });
        }

        const fileIdPlaceholders = fileIds.map((_, idx) => `$${idx + 1}`).join(', ');
        const filesResult = await pool.query(
            `SELECT fileId, fileName, mimeType, fileData
             FROM auditor_files_r
             WHERE fileId IN (${fileIdPlaceholders})`,
            fileIds
        );

        if (filesResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'No objective evidence files found.' });
        }

        const zipName = `audit-${auditId}-objective-evidence.zip`;
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.on('error', (err) => {
            console.error('Error creating zip:', err);
            if (!res.headersSent) {
                res.status(500).json({ success: false, error: 'Failed to create zip.' });
            } else {
                res.end();
            }
        });
        archive.pipe(res);

        filesResult.rows.forEach((file) => {
            const safeName = sanitizeFilename(file.filename || `file-${file.fileid}`);
            archive.append(file.filedata, { name: safeName });
        });

        await archive.finalize();
    } catch (error) {
        console.error('Error building objective evidence zip:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get current user info based on networkId header mapping
app.get('/api/current-user', async (req, res) => {
    try {
        const row = await getCurrentUserInfo(req);
        if (!row) {
            return res.json({
                name: 'User',
                myId: null,
                networkId: null,
                auditorId: null,
                divisionId: null,
                isAdmin: false
            });
        }
        res.json({
            name: row.rostername,
            myId: row.myid,
            networkId: row.networkid,
            auditorId: row.auditorid,
            divisionId: row.divisionid,
            isAdmin: Boolean(row.admin)
        });
    } catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Request auditor access (queue email to division lead)
app.post('/api/request-auditor-access', async (req, res) => {
    const client = await pool.connect();
    try {
        const userInfo = await getCurrentUserInfo(req);
        if (!userInfo?.myid) {
            return res.status(400).json({ success: false, error: 'User not found.' });
        }

        const { divisionId, reason } = req.body;
        const parsedDivisionId = parseInt(divisionId, 10);
        if (!parsedDivisionId || !reason || !String(reason).trim()) {
            return res.status(400).json({ success: false, error: 'Division and reason are required.' });
        }

        const rosterResult = await client.query(
            'SELECT rostername, email, myid FROM roster_r WHERE myid = $1',
            [userInfo.myid]
        );
        const requester = rosterResult.rows[0];
        if (!requester?.email) {
            return res.status(400).json({ success: false, error: 'Requester email not found.' });
        }

        const divisionResult = await client.query(
            'SELECT divisionname, leadid FROM divisions_r WHERE divisionid = $1',
            [parsedDivisionId]
        );
        const division = divisionResult.rows[0];
        if (!division?.leadid) {
            return res.status(400).json({ success: false, error: 'Division lead not configured.' });
        }

        const leadResult = await client.query(
            `SELECT TOP 1 r.email, r.rostername
             FROM auditors_r a
             JOIN roster_r r ON r.myid = a.myid
             WHERE a.auditorid = $1`,
            [division.leadid]
        );
        const lead = leadResult.rows[0];
        if (!lead?.email) {
            return res.status(400).json({ success: false, error: 'Division lead email not found.' });
        }

        const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
        const approveLink = `${appBaseUrl}/admin?myid=${encodeURIComponent(requester.myid || '')}`;
        const { subject, body } = buildAuditorAccessRequestEmail({
            requestName: requester.rostername,
            requestMyId: requester.myid,
            requestEmail: requester.email,
            divisionName: division.divisionname,
            reason,
            approveLink
        });

        await queueEmail(client, {
            toAddress: lead.email,
            subject,
            body
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error requesting auditor access:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// Get all nonconformances
app.get('/api/nonconformances', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM nonconformances_r ORDER BY ncId');

        // Parse array fields back to arrays and convert column names to camelCase
        const nonconformances = result.rows.map(nc => ({
            ncId: nc.ncid,
            scheduleId: nc.scheduleid,
            type: nc.type,
            findingType: nc.findingtype,
            severity: nc.severity,
            section: nc.section,
            subsection: nc.subsection,
            question: nc.question,
            response: nc.response,
            auditorComment: nc.auditorcomment,
            details: nc.details,
            ncDetails: nc.ncdetails,
            AIN: nc.ain,
            division: parseMaybeJsonArray(nc.division),
            sector: parseMaybeJsonArray(nc.sector),
            qma: parseMaybeJsonArray(nc.qma),
            other: parseMaybeJsonArray(nc.other),
            files: parseMaybeJsonArray(nc.files),
            createdAt: nc.createdat,
            updatedAt: nc.updatedat
        }));

        res.json(nonconformances);
    } catch (error) {
        console.error('Error fetching all nonconformances:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Save nonconformances for a specific schedule
app.post('/api/save-nonconformances', async (req, res) => {
    const client = await pool.connect();

    try {
        const { scheduleId, nonconformances } = req.body;

        await client.query('BEGIN');

        // Delete existing nonconformances for this schedule
        await client.query('DELETE FROM nonconformances_r WHERE scheduleId = $1', [scheduleId]);

        // Insert new/updated nonconformances
        for (const nc of nonconformances) {
            await client.query(
                `INSERT INTO nonconformances_r 
        (scheduleId, type, findingType, section, subsection, question, response, auditorComment, details, ncDetails, AIN, division, sector, qma, other, files)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
                [
                    nc.scheduleId,
                    nc.type,
                    nc.findingType !== undefined ? nc.findingType : null,
                    nc.section,
                    nc.subsection,
                    nc.question || '',
                    nc.response || '',
                    nc.auditorComment || '',
                    nc.details || '',
                    nc.ncDetails || '',
                    nc.AIN || '',
                    JSON.stringify(nc.division || []),
                    JSON.stringify(nc.sector || []),
                    JSON.stringify(nc.qma || []),
                    JSON.stringify(nc.other || []),
                    JSON.stringify(nc.files || [])
                ]
            );
        }

        await client.query('COMMIT');

        res.json({ success: true, message: 'Nonconformances saved successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saving nonconformances:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// Update nonconformance details (for Nonconformities page)
app.post('/api/update-nonconformance-details', async (req, res) => {
    const client = await pool.connect();

    try {
        const { ncId, details, severity, ncDetails, actionItemNumber } = req.body;

        await client.query(
            `UPDATE nonconformances_r 
            SET details = $1, severity = $2, ncDetails = $3, ain = $4, updatedat = CURRENT_TIMESTAMP
            WHERE ncid = $5`,
            [details || '', severity || null, ncDetails || '', actionItemNumber || '', ncId]
        );

        res.json({ success: true, message: 'Nonconformance details updated successfully' });
    } catch (error) {
        console.error('Error updating nonconformance details:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// ==================== LOOKUP TABLE ENDPOINTS ====================

// Get all audit types
app.get('/api/audit-types', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM audit_types_r ORDER BY auditTypeId');
        const data = result.rows.map(row => ({
            auditTypeId: row.audittypeid,
            auditTypeName: row.audittypename,
            active: row.active
        }));
        res.json(data);
    } catch (error) {
        console.error('Error fetching audit types:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/audit-types', async (req, res) => {
    const { auditTypeName, active = 1 } = req.body;
    if (!auditTypeName) {
        return res.status(400).json({ success: false, error: 'auditTypeName is required.' });
    }
    try {
        const existing = await pool.query(
            'SELECT auditTypeId FROM audit_types_r WHERE LOWER(TRIM(auditTypeName)) = LOWER(TRIM($1))',
            [auditTypeName]
        );
        if (existing.rowCount > 0) {
            return res.status(409).json({ success: false, error: 'An audit type with that name already exists.' });
        }
        const insert = await pool.query(
            'INSERT INTO audit_types_r (auditTypeName, active) VALUES ($1, $2) RETURNING auditTypeId, auditTypeName, active',
            [auditTypeName, active]
        );
        res.status(201).json(insert.rows[0]);
    } catch (error) {
        console.error('Error creating audit type:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/audit-types/:auditTypeId', async (req, res) => {
    const { auditTypeId } = req.params;
    const { auditTypeName, active = 1 } = req.body;
    if (!auditTypeName) {
        return res.status(400).json({ success: false, error: 'auditTypeName is required.' });
    }
    try {
        const conflict = await pool.query(
            'SELECT auditTypeId FROM audit_types_r WHERE LOWER(TRIM(auditTypeName)) = LOWER(TRIM($1)) AND auditTypeId <> $2',
            [auditTypeName, auditTypeId]
        );
        if (conflict.rowCount > 0) {
            return res.status(409).json({ success: false, error: 'An audit type with that name already exists.' });
        }
        const update = await pool.query(
            'UPDATE audit_types_r SET auditTypeName = $1, active = $2 WHERE auditTypeId = $3 RETURNING auditTypeId, auditTypeName, active',
            [auditTypeName, active, auditTypeId]
        );
        if (update.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Audit type not found.' });
        }
        res.json(update.rows[0]);
    } catch (error) {
        console.error('Error updating audit type:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all int/ext
app.get('/api/int-ext', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM int_ext_r ORDER BY intExtId');
        const data = result.rows.map(row => ({
            intExtId: row.intextid,
            intExtName: row.intextname
        }));
        res.json(data);
    } catch (error) {
        console.error('Error fetching int/ext:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all functions
app.get('/api/functions', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM functions_r ORDER BY functionId');
        const data = result.rows.map(row => ({
            functionId: row.functionid,
            functionName: row.functionname,
            active: row.active
        }));
        res.json(data);
    } catch (error) {
        console.error('Error fetching functions:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/functions', async (req, res) => {
    const { functionName, active = 1 } = req.body;
    if (!functionName) {
        return res.status(400).json({ success: false, error: 'functionName is required.' });
    }
    try {
        const existing = await pool.query(
            'SELECT functionId FROM functions_r WHERE LOWER(TRIM(functionName)) = LOWER(TRIM($1))',
            [functionName]
        );
        if (existing.rowCount > 0) {
            return res.status(409).json({ success: false, error: 'A function with that name already exists.' });
        }
        const insert = await pool.query(
            'INSERT INTO functions_r (functionName, active) VALUES ($1, $2) RETURNING functionId, functionName, active',
            [functionName, active]
        );
        res.status(201).json(insert.rows[0]);
    } catch (error) {
        console.error('Error creating function:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/functions/:functionId', async (req, res) => {
    const { functionId } = req.params;
    const { functionName, active = 1 } = req.body;
    if (!functionName) {
        return res.status(400).json({ success: false, error: 'functionName is required.' });
    }
    try {
        const conflict = await pool.query(
            'SELECT functionId FROM functions_r WHERE LOWER(TRIM(functionName)) = LOWER(TRIM($1)) AND functionId <> $2',
            [functionName, functionId]
        );
        if (conflict.rowCount > 0) {
            return res.status(409).json({ success: false, error: 'A function with that name already exists.' });
        }
        const update = await pool.query(
            'UPDATE functions_r SET functionName = $1, active = $2 WHERE functionId = $3 RETURNING functionId, functionName, active',
            [functionName, active, functionId]
        );
        if (update.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Function not found.' });
        }
        res.json(update.rows[0]);
    } catch (error) {
        console.error('Error updating function:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all statuses
app.get('/api/statuses', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM statuses_r ORDER BY statusId');
        const data = result.rows.map(row => ({
            statusId: row.statusid,
            statusName: row.statusname
        }));
        res.json(data);
    } catch (error) {
        console.error('Error fetching statuses:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all standards
app.get('/api/standards', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM standards_r ORDER BY standardId');
        const data = result.rows.map(row => ({
            standardId: row.standardid,
            standardName: row.standardname
        }));
        res.json(data);
    } catch (error) {
        console.error('Error fetching standards:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all standard texts
app.get('/api/standard-texts', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT standardid, section, subsection, text
             FROM standard_texts_r
             ORDER BY standardid, section, subsection`
        );
        const data = result.rows.map(row => ({
            standardId: row.standardid,
            section: row.section,
            subsection: row.subsection,
            text: row.text
        }));
        res.json(data);
    } catch (error) {
        console.error('Error fetching standard texts:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all programs
app.get('/api/programs', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM programs_r ORDER BY programId');
        const data = result.rows.map(row => ({
            programId: row.programid,
            programName: row.programname,
            divisionId: row.divisionid,
            active: row.active
        }));
        res.json(data);
    } catch (error) {
        console.error('Error fetching programs:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/programs', async (req, res) => {
    const { programName, divisionId, active = 1 } = req.body;
    if (!programName || !divisionId) {
        return res.status(400).json({ success: false, error: 'programName and divisionId are required.' });
    }
    try {
        const existing = await pool.query(
            'SELECT programId FROM programs_r WHERE LOWER(TRIM(programName)) = LOWER(TRIM($1)) AND divisionId = $2',
            [programName, divisionId]
        );
        if (existing.rowCount > 0) {
            return res.status(409).json({ success: false, error: 'A program with that name already exists for this division.' });
        }
        const insert = await pool.query(
            'INSERT INTO programs_r (programName, divisionId, active) VALUES ($1, $2, $3) RETURNING programId, programName, divisionId, active',
            [programName, divisionId, active]
        );
        res.status(201).json(insert.rows[0]);
    } catch (error) {
        console.error('Error creating program:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/programs/:programId', async (req, res) => {
    const { programId } = req.params;
    const { programName, divisionId, active = 1 } = req.body;
    if (!programName || !divisionId) {
        return res.status(400).json({ success: false, error: 'programName and divisionId are required.' });
    }
    try {
        const conflict = await pool.query(
            'SELECT programId FROM programs_r WHERE LOWER(TRIM(programName)) = LOWER(TRIM($1)) AND divisionId = $2 AND programId <> $3',
            [programName, divisionId, programId]
        );
        if (conflict.rowCount > 0) {
            return res.status(409).json({ success: false, error: 'A program with that name already exists for this division.' });
        }
        const update = await pool.query(
            'UPDATE programs_r SET programName = $1, divisionId = $2, active = $3 WHERE programId = $4 RETURNING programId, programName, divisionId, active',
            [programName, divisionId, active, programId]
        );
        if (update.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Program not found.' });
        }
        res.json(update.rows[0]);
    } catch (error) {
        console.error('Error updating program:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create division
app.post('/api/divisions', async (req, res) => {
    const { divisionName, sectorId, active = 1 } = req.body;
    if (!divisionName || !sectorId) {
        return res.status(400).json({ success: false, error: 'divisionName and sectorId are required.' });
    }
    try {
        const conflict = await pool.query(
            'SELECT divisionId FROM divisions_r WHERE LOWER(TRIM(divisionName)) = LOWER(TRIM($1))',
            [divisionName]
        );
        if (conflict.rowCount > 0) {
            return res.status(409).json({ success: false, error: 'A division with that name already exists.' });
        }
        const insert = await pool.query(
            'INSERT INTO divisions_r (divisionName, sectorId, active) VALUES ($1, $2, $3) RETURNING divisionId, divisionName, sectorId, active',
            [divisionName, sectorId, active]
        );
        res.json(insert.rows[0]);
    } catch (error) {
        console.error('Error creating division:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update division
app.put('/api/divisions/:divisionId', async (req, res) => {
    const { divisionId } = req.params;
    const { divisionName, sectorId, active = 1 } = req.body;
    if (!divisionName || !sectorId) {
        return res.status(400).json({ success: false, error: 'divisionName and sectorId are required.' });
    }
    try {
        const conflict = await pool.query(
            'SELECT divisionId FROM divisions_r WHERE LOWER(TRIM(divisionName)) = LOWER(TRIM($1)) AND divisionId <> $2',
            [divisionName, divisionId]
        );
        if (conflict.rowCount > 0) {
            return res.status(409).json({ success: false, error: 'A division with that name already exists.' });
        }
        const update = await pool.query(
            'UPDATE divisions_r SET divisionName = $1, sectorId = $2, active = $3 WHERE divisionId = $4 RETURNING divisionId, divisionName, sectorId, active',
            [divisionName, sectorId, active, divisionId]
        );
        if (update.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Division not found.' });
        }
        res.json(update.rows[0]);
    } catch (error) {
        console.error('Error updating division:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all divisions
app.get('/api/divisions', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM divisions_r ORDER BY divisionId');
        const data = result.rows.map(row => ({
            divisionId: row.divisionid,
            divisionName: row.divisionname,
            sectorId: row.sectorid,
            active: row.active
        }));
        res.json(data);
    } catch (error) {
        console.error('Error fetching divisions:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all sectors
app.get('/api/sectors', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM sectors_r ORDER BY sectorId');
        const data = result.rows.map(row => ({
            sectorId: row.sectorid,
            sectorName: row.sectorname
        }));
        res.json(data);
    } catch (error) {
        console.error('Error fetching sectors:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all sites
app.get('/api/sites', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM sites_r ORDER BY siteId');
        const data = result.rows.map(row => ({
            siteId: row.siteid,
            address: row.address,
            city: row.city,
            state: row.state,
            country: row.country,
            divisionId: row.divisionid,
            active: row.active
        }));
        res.json(data);
    } catch (error) {
        console.error('Error fetching sites:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/sites', async (req, res) => {
    const { address, city, state, country, divisionId, active = 1 } = req.body;
    if (!address || !city || !state || !country || !divisionId) {
        return res.status(400).json({ success: false, error: 'address, city, state, country, and divisionId are required.' });
    }
    try {
        const existing = await pool.query(
            `SELECT siteId FROM sites_r
             WHERE LOWER(TRIM(address)) = LOWER(TRIM($1))
               AND LOWER(TRIM(COALESCE(city, ''))) = LOWER(TRIM($2))
               AND LOWER(TRIM(COALESCE(state, ''))) = LOWER(TRIM($3))
               AND LOWER(TRIM(COALESCE(country, ''))) = LOWER(TRIM($4))`,
            [address, city, state, country]
        );
        if (existing.rowCount > 0) {
            return res.status(409).json({ success: false, error: 'A site with that address already exists.' });
        }
        const insert = await pool.query(
            'INSERT INTO sites_r (address, city, state, country, divisionId, active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING siteId, address, city, state, country, divisionId, active',
            [address, city, state, country, divisionId, active]
        );
        res.status(201).json(insert.rows[0]);
    } catch (error) {
        console.error('Error creating site:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/sites/:siteId', async (req, res) => {
    const { siteId } = req.params;
    const { address, city, state, country, divisionId, active = 1 } = req.body;
    if (!address || !city || !state || !country || !divisionId) {
        return res.status(400).json({ success: false, error: 'address, city, state, country, and divisionId are required.' });
    }
    try {
        const conflict = await pool.query(
            `SELECT siteId FROM sites_r
             WHERE LOWER(TRIM(address)) = LOWER(TRIM($1))
               AND LOWER(TRIM(COALESCE(city, ''))) = LOWER(TRIM($2))
               AND LOWER(TRIM(COALESCE(state, ''))) = LOWER(TRIM($3))
               AND LOWER(TRIM(COALESCE(country, ''))) = LOWER(TRIM($4))
               AND siteId <> $5`,
            [address, city, state, country, siteId]
        );
        if (conflict.rowCount > 0) {
            return res.status(409).json({ success: false, error: 'A site with that address already exists.' });
        }
        const update = await pool.query(
            'UPDATE sites_r SET address = $1, city = $2, state = $3, country = $4, divisionId = $5, active = $6 WHERE siteId = $7 RETURNING siteId, address, city, state, country, divisionId, active',
            [address, city, state, country, divisionId, active, siteId]
        );
        if (update.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Site not found.' });
        }
        res.json(update.rows[0]);
    } catch (error) {
        console.error('Error updating site:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all business units
app.get('/api/business-units', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM business_units_r ORDER BY businessUnitId');
        const data = result.rows.map(row => ({
            businessUnitId: row.businessunitid,
            businessUnitName: row.businessunitname,
            divisionId: row.divisionid,
            active: row.active
        }));
        res.json(data);
    } catch (error) {
        console.error('Error fetching business units:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/business-units', async (req, res) => {
    const { businessUnitName, divisionId, active = 1 } = req.body;
    if (!businessUnitName || !divisionId) {
        return res.status(400).json({ success: false, error: 'businessUnitName and divisionId are required.' });
    }
    try {
        const existing = await pool.query(
            'SELECT businessUnitId FROM business_units_r WHERE LOWER(TRIM(businessUnitName)) = LOWER(TRIM($1))',
            [businessUnitName]
        );
        if (existing.rowCount > 0) {
            return res.status(409).json({ success: false, error: 'A business unit with that name already exists.' });
        }
        const insert = await pool.query(
            'INSERT INTO business_units_r (businessUnitName, divisionId, active) VALUES ($1, $2, $3) RETURNING businessUnitId, businessUnitName, divisionId, active',
            [businessUnitName, divisionId, active]
        );
        res.status(201).json(insert.rows[0]);
    } catch (error) {
        console.error('Error creating business unit:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/business-units/:businessUnitId', async (req, res) => {
    const { businessUnitId } = req.params;
    const { businessUnitName, divisionId, active = 1 } = req.body;
    if (!businessUnitName || !divisionId) {
        return res.status(400).json({ success: false, error: 'businessUnitName and divisionId are required.' });
    }
    try {
        const conflict = await pool.query(
            'SELECT businessUnitId FROM business_units_r WHERE LOWER(TRIM(businessUnitName)) = LOWER(TRIM($1)) AND businessUnitId <> $2',
            [businessUnitName, businessUnitId]
        );
        if (conflict.rowCount > 0) {
            return res.status(409).json({ success: false, error: 'A business unit with that name already exists.' });
        }
        const update = await pool.query(
            'UPDATE business_units_r SET businessUnitName = $1, divisionId = $2, active = $3 WHERE businessUnitId = $4 RETURNING businessUnitId, businessUnitName, divisionId, active',
            [businessUnitName, divisionId, active, businessUnitId]
        );
        if (update.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Business unit not found.' });
        }
        res.json(update.rows[0]);
    } catch (error) {
        console.error('Error updating business unit:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all operating units
app.get('/api/operating-units', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM operating_units_r ORDER BY operatingUnitId');
        const data = result.rows.map(row => ({
            operatingUnitId: row.operatingunitid,
            operatingUnitName: row.operatingunitname,
            divisionId: row.divisionid,
            active: row.active
        }));
        res.json(data);
    } catch (error) {
        console.error('Error fetching operating units:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/operating-units', async (req, res) => {
    const { operatingUnitName, divisionId, active = 1 } = req.body;
    if (!operatingUnitName || !divisionId) {
        return res.status(400).json({ success: false, error: 'operatingUnitName and divisionId are required.' });
    }
    try {
        const existing = await pool.query(
            'SELECT operatingUnitId FROM operating_units_r WHERE LOWER(TRIM(operatingUnitName)) = LOWER(TRIM($1))',
            [operatingUnitName]
        );
        if (existing.rowCount > 0) {
            return res.status(409).json({ success: false, error: 'An operating unit with that name already exists.' });
        }
        const insert = await pool.query(
            'INSERT INTO operating_units_r (operatingUnitName, divisionId, active) VALUES ($1, $2, $3) RETURNING operatingUnitId, operatingUnitName, divisionId, active',
            [operatingUnitName, divisionId, active]
        );
        res.status(201).json(insert.rows[0]);
    } catch (error) {
        console.error('Error creating operating unit:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/operating-units/:operatingUnitId', async (req, res) => {
    const { operatingUnitId } = req.params;
    const { operatingUnitName, divisionId, active = 1 } = req.body;
    if (!operatingUnitName || !divisionId) {
        return res.status(400).json({ success: false, error: 'operatingUnitName and divisionId are required.' });
    }
    try {
        const conflict = await pool.query(
            'SELECT operatingUnitId FROM operating_units_r WHERE LOWER(TRIM(operatingUnitName)) = LOWER(TRIM($1)) AND operatingUnitId <> $2',
            [operatingUnitName, operatingUnitId]
        );
        if (conflict.rowCount > 0) {
            return res.status(409).json({ success: false, error: 'An operating unit with that name already exists.' });
        }
        const update = await pool.query(
            'UPDATE operating_units_r SET operatingUnitName = $1, divisionId = $2, active = $3 WHERE operatingUnitId = $4 RETURNING operatingUnitId, operatingUnitName, divisionId, active',
            [operatingUnitName, divisionId, active, operatingUnitId]
        );
        if (update.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Operating unit not found.' });
        }
        res.json(update.rows[0]);
    } catch (error) {
        console.error('Error updating operating unit:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all roster
app.get('/api/roster', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM roster_r ORDER BY rosterName');
        const data = result.rows.map(row => ({
            rosterName: row.rostername,
            myId: row.myid,
            networkId: row.networkid,
            email: row.email,
        }));
        res.json(data);
    } catch (error) {
        console.error('Error fetching roster:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all auditors
app.get('/api/auditors', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM auditors_r ORDER BY auditorId');
        const data = result.rows.map(row => ({
            auditorId: row.auditorid,
            firstName: row.fname ?? row.firstname ?? '',
            lastName: row.lname ?? row.lastname ?? '',
            auditorName: formatAuditorName(row.fname ?? row.firstname, row.lname ?? row.lastname),
            myId: row.myid,
            divisionId: row.divisionid,
            active: row.active
        }));
        res.json(data);
    } catch (error) {
        console.error('Error fetching auditors:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/auditors', async (req, res) => {
    const { auditorName, firstName, lastName, myId, divisionId, active = 1 } = req.body;
    const parsed = parseAuditorName(auditorName);
    const resolvedFirstName = (firstName ?? parsed.firstName ?? '').trim();
    const resolvedLastName = (lastName ?? parsed.lastName ?? '').trim();
    if (!resolvedFirstName || !resolvedLastName || !myId || !divisionId) {
        return res.status(400).json({ success: false, error: 'firstName, lastName, myId, and divisionId are required.' });
    }
    try {
        const existing = await pool.query('SELECT auditorId FROM auditors_r WHERE LOWER(TRIM(myId)) = LOWER(TRIM($1))', [myId]);
        if (existing.rowCount > 0) {
            return res.status(409).json({ success: false, error: 'An auditor with that MyID already exists.' });
        }
        const insert = await pool.query(
            'INSERT INTO auditors_r (fname, lname, myId, divisionId, active) VALUES ($1, $2, $3, $4, $5) RETURNING auditorId, fname, lname, myId, divisionId, active',
            [resolvedFirstName, resolvedLastName, myId, divisionId, active]
        );
        const saved = insert.rows[0];
        res.status(201).json({
            auditorId: saved.auditorid,
            firstName: saved.fname,
            lastName: saved.lname,
            auditorName: formatAuditorName(saved.fname, saved.lname),
            myId: saved.myid,
            divisionId: saved.divisionid,
            active: saved.active
        });
    } catch (error) {
        console.error('Error creating auditor:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/auditors/:auditorId', async (req, res) => {
    const { auditorId } = req.params;
    const { auditorName, firstName, lastName, myId, divisionId, active = 1 } = req.body;
    const parsed = parseAuditorName(auditorName);
    const resolvedFirstName = (firstName ?? parsed.firstName ?? '').trim();
    const resolvedLastName = (lastName ?? parsed.lastName ?? '').trim();
    if (!resolvedFirstName || !resolvedLastName || !myId || !divisionId) {
        return res.status(400).json({ success: false, error: 'firstName, lastName, myId, and divisionId are required.' });
    }
    try {
        const conflict = await pool.query(
            'SELECT auditorId FROM auditors_r WHERE LOWER(TRIM(myId)) = LOWER(TRIM($1)) AND auditorId <> $2',
            [myId, auditorId]
        );
        if (conflict.rowCount > 0) {
            return res.status(409).json({ success: false, error: 'An auditor with that MyID already exists.' });
        }
        const update = await pool.query(
            'UPDATE auditors_r SET fname = $1, lname = $2, myId = $3, divisionId = $4, active = $5 WHERE auditorId = $6 RETURNING auditorId, fname, lname, myId, divisionId, active',
            [resolvedFirstName, resolvedLastName, myId, divisionId, active, auditorId]
        );
        if (update.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Auditor not found.' });
        }
        const saved = update.rows[0];
        res.json({
            auditorId: saved.auditorid,
            firstName: saved.fname,
            lastName: saved.lname,
            auditorName: formatAuditorName(saved.fname, saved.lname),
            myId: saved.myid,
            divisionId: saved.divisionid,
            active: saved.active
        });
    } catch (error) {
        console.error('Error updating auditor:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all safety equipment
app.get('/api/safety-equipment', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM safety_equipment_r ORDER BY safetyEquipmentId');
        const data = result.rows.map(row => ({
            safetyEquipmentId: row.safetyequipmentid,
            safetyEquipmentName: row.safetyequipmentname,
            active: row.active
        }));
        res.json(data);
    } catch (error) {
        console.error('Error fetching safety equipment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/safety-equipment', async (req, res) => {
    const { safetyEquipmentName, active = 1 } = req.body;
    if (!safetyEquipmentName) {
        return res.status(400).json({ success: false, error: 'safetyEquipmentName is required.' });
    }
    try {
        const existing = await pool.query(
            'SELECT safetyEquipmentId FROM safety_equipment_r WHERE LOWER(TRIM(safetyEquipmentName)) = LOWER(TRIM($1))',
            [safetyEquipmentName]
        );
        if (existing.rowCount > 0) {
            return res.status(409).json({ success: false, error: 'Safety equipment with that name already exists.' });
        }
        const insert = await pool.query(
            'INSERT INTO safety_equipment_r (safetyEquipmentName, active) VALUES ($1, $2) RETURNING safetyEquipmentId, safetyEquipmentName, active',
            [safetyEquipmentName, active]
        );
        res.status(201).json(insert.rows[0]);
    } catch (error) {
        console.error('Error creating safety equipment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/safety-equipment/:safetyEquipmentId', async (req, res) => {
    const { safetyEquipmentId } = req.params;
    const { safetyEquipmentName, active = 1 } = req.body;
    if (!safetyEquipmentName) {
        return res.status(400).json({ success: false, error: 'safetyEquipmentName is required.' });
    }
    try {
        const conflict = await pool.query(
            'SELECT safetyEquipmentId FROM safety_equipment_r WHERE LOWER(TRIM(safetyEquipmentName)) = LOWER(TRIM($1)) AND safetyEquipmentId <> $2',
            [safetyEquipmentName, safetyEquipmentId]
        );
        if (conflict.rowCount > 0) {
            return res.status(409).json({ success: false, error: 'Safety equipment with that name already exists.' });
        }
        const update = await pool.query(
            'UPDATE safety_equipment_r SET safetyEquipmentName = $1, active = $2 WHERE safetyEquipmentId = $3 RETURNING safetyEquipmentId, safetyEquipmentName, active',
            [safetyEquipmentName, active, safetyEquipmentId]
        );
        if (update.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Safety equipment not found.' });
        }
        res.json(update.rows[0]);
    } catch (error) {
        console.error('Error updating safety equipment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all training requirements
app.get('/api/training-requirements', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM training_requirements_r ORDER BY trainingRequirementId');
        const data = result.rows.map(row => ({
            trainingRequirementId: row.trainingrequirementid,
            trainingRequirementName: row.trainingrequirementname,
            active: row.active
        }));
        res.json(data);
    } catch (error) {
        console.error('Error fetching training requirements:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/training-requirements', async (req, res) => {
    const { trainingRequirementName, active = 1 } = req.body;
    if (!trainingRequirementName) {
        return res.status(400).json({ success: false, error: 'trainingRequirementName is required.' });
    }
    try {
        const existing = await pool.query(
            'SELECT trainingRequirementId FROM training_requirements_r WHERE LOWER(TRIM(trainingRequirementName)) = LOWER(TRIM($1))',
            [trainingRequirementName]
        );
        if (existing.rowCount > 0) {
            return res.status(409).json({ success: false, error: 'A training requirement with that name already exists.' });
        }
        const insert = await pool.query(
            'INSERT INTO training_requirements_r (trainingRequirementName, active) VALUES ($1, $2) RETURNING trainingRequirementId, trainingRequirementName, active',
            [trainingRequirementName, active]
        );
        res.status(201).json(insert.rows[0]);
    } catch (error) {
        console.error('Error creating training requirement:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all severities
app.get('/api/severities', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM severities_r ORDER BY severityId');
        const data = result.rows.map(row => ({
            severityId: row.severityid,
            severity: row.severity
        }));
        res.json(data);
    } catch (error) {
        console.error('Error fetching severities:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/training-requirements/:trainingRequirementId', async (req, res) => {
    const { trainingRequirementId } = req.params;
    const { trainingRequirementName, active = 1 } = req.body;
    if (!trainingRequirementName) {
        return res.status(400).json({ success: false, error: 'trainingRequirementName is required.' });
    }
    try {
        const conflict = await pool.query(
            'SELECT trainingRequirementId FROM training_requirements_r WHERE LOWER(TRIM(trainingRequirementName)) = LOWER(TRIM($1)) AND trainingRequirementId <> $2',
            [trainingRequirementName, trainingRequirementId]
        );
        if (conflict.rowCount > 0) {
            return res.status(409).json({ success: false, error: 'A training requirement with that name already exists.' });
        }
        const update = await pool.query(
            'UPDATE training_requirements_r SET trainingRequirementName = $1, active = $2 WHERE trainingRequirementId = $3 RETURNING trainingRequirementId, trainingRequirementName, active',
            [trainingRequirementName, active, trainingRequirementId]
        );
        if (update.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Training requirement not found.' });
        }
        res.json(update.rows[0]);
    } catch (error) {
        console.error('Error updating training requirement:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all causes
app.get('/api/causes', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM causes_r ORDER BY causeId');
        const data = result.rows.map(row => ({
            causeId: row.causeid,
            cause: row.cause,
            active: row.active
        }));
        res.json(data);
    } catch (error) {
        console.error('Error fetching causes:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all every time questions
app.get('/api/everytime-questions', async (req, res) => {
    try {
        const { divisionId } = req.query;
        let query = 'SELECT * FROM everytimequestions_r';
        const params = [];
        if (divisionId) {
            params.push(divisionId);
            query += ' WHERE divisionid = $1';
        }
        query += ' ORDER BY etqId';
        const result = await pool.query(query, params);
        const data = result.rows.map(row => ({
            etqId: row.etqid,
            question: row.question,
            divisionId: row.divisionid,
            active: row.active
        }));
        res.json(data);
    } catch (error) {
        console.error('Error fetching every time questions:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/everytime-questions', async (req, res) => {
    const { question, divisionId, active = 1 } = req.body;
    if (!question || !divisionId) {
        return res.status(400).json({ success: false, error: 'question and divisionId are required.' });
    }
    try {
        const existing = await pool.query(
            'SELECT etqId FROM everytimequestions_r WHERE LOWER(TRIM(question)) = LOWER(TRIM($1)) AND divisionId = $2',
            [question, divisionId]
        );
        if (existing.rowCount > 0) {
            return res.status(409).json({ success: false, error: 'That question already exists for this division.' });
        }
        const insert = await pool.query(
            'INSERT INTO everytimequestions_r (question, divisionId, active) VALUES ($1, $2, $3) RETURNING etqId, question, divisionId, active',
            [question, divisionId, active]
        );
        res.status(201).json(insert.rows[0]);
    } catch (error) {
        console.error('Error creating every time question:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/everytime-questions/:etqId', async (req, res) => {
    const { etqId } = req.params;
    const { question, divisionId, active = 1 } = req.body;
    if (!question || !divisionId) {
        return res.status(400).json({ success: false, error: 'question and divisionId are required.' });
    }
    try {
        const conflict = await pool.query(
            'SELECT etqId FROM everytimequestions_r WHERE LOWER(TRIM(question)) = LOWER(TRIM($1)) AND divisionId = $2 AND etqId <> $3',
            [question, divisionId, etqId]
        );
        if (conflict.rowCount > 0) {
            return res.status(409).json({ success: false, error: 'That question already exists for this division.' });
        }
        const update = await pool.query(
            'UPDATE everytimequestions_r SET question = $1, divisionId = $2, active = $3 WHERE etqId = $4 RETURNING etqId, question, divisionId, active',
            [question, divisionId, active, etqId]
        );
        if (update.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Every time question not found.' });
        }
        res.json(update.rows[0]);
    } catch (error) {
        console.error('Error updating every time question:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/causes', async (req, res) => {
    const { cause, active = 1 } = req.body;
    if (!cause) {
        return res.status(400).json({ success: false, error: 'cause is required.' });
    }
    try {
        const existing = await pool.query(
            'SELECT causeId FROM causes_r WHERE LOWER(TRIM(cause)) = LOWER(TRIM($1))',
            [cause]
        );
        if (existing.rowCount > 0) {
            return res.status(409).json({ success: false, error: 'A delay cause with that name already exists.' });
        }
        const insert = await pool.query(
            'INSERT INTO causes_r (cause, active) VALUES ($1, $2) RETURNING causeId, cause, active',
            [cause, active]
        );
        res.status(201).json(insert.rows[0]);
    } catch (error) {
        console.error('Error creating cause:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/causes/:causeId', async (req, res) => {
    const { causeId } = req.params;
    const { cause, active = 1 } = req.body;
    if (!cause) {
        return res.status(400).json({ success: false, error: 'cause is required.' });
    }
    try {
        const conflict = await pool.query(
            'SELECT causeId FROM causes_r WHERE LOWER(TRIM(cause)) = LOWER(TRIM($1)) AND causeId <> $2',
            [cause, causeId]
        );
        if (conflict.rowCount > 0) {
            return res.status(409).json({ success: false, error: 'A delay cause with that name already exists.' });
        }
        const update = await pool.query(
            'UPDATE causes_r SET cause = $1, active = $2 WHERE causeId = $3 RETURNING causeId, cause, active',
            [cause, active, causeId]
        );
        if (update.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Cause not found.' });
        }
        res.json(update.rows[0]);
    } catch (error) {
        console.error('Error updating cause:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all props
app.get('/api/props', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM props_r ORDER BY propId');
        const data = result.rows.map(row => ({
            propId: row.propid,
            PrOP: row.prop,
            sectorId: row.sectorid,
            divisionId: row.divisionid,
            siteId: row.siteid,
            buId: row.buid,
            ouId: row.ouid,
            programId: row.programid,
            propTypeId: row.proptypeid,
            active: row.active
        }));
        res.json(data);
    } catch (error) {
        console.error('Error fetching props:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/props', async (req, res) => {
    const {
        PrOP,
        propTypeId,
        sectorId,
        divisionId,
        siteId,
        buId,
        ouId,
        programId,
        active = 1
    } = req.body;
    if (!PrOP || !propTypeId) {
        return res.status(400).json({ success: false, error: 'PrOP and propTypeId are required.' });
    }

    const typeValue = Number(propTypeId);
    const targetMap = {
        2: { key: 'sectorId', value: sectorId },
        3: { key: 'divisionId', value: divisionId },
        4: { key: 'siteId', value: siteId },
        5: { key: 'buId', value: buId },
        6: { key: 'ouId', value: ouId },
        7: { key: 'programId', value: programId }
    };
    const target = targetMap[typeValue];
    if (target && !target.value) {
        return res.status(400).json({ success: false, error: 'Target selection is required for this PrOP type.' });
    }

    try {
        let conflictQuery = 'SELECT propId FROM props_r WHERE LOWER(TRIM(prOP)) = LOWER(TRIM($1)) AND propTypeId = $2';
        const conflictParams = [PrOP, typeValue];
        if (target) {
            conflictQuery += ` AND ${target.key} = $3`;
            conflictParams.push(Number(target.value));
        }
        const conflict = await pool.query(conflictQuery, conflictParams);
        if (conflict.rowCount > 0) {
            return res.status(409).json({ success: false, error: 'A matching PrOP already exists.' });
        }

        const normalized = {
            sectorId: null,
            divisionId: null,
            siteId: null,
            buId: null,
            ouId: null,
            programId: null
        };
        if (target) {
            normalized[target.key] = Number(target.value);
        }

        const insert = await pool.query(
            `INSERT INTO props_r (prOP, sectorId, divisionId, siteId, buId, ouId, programId, propTypeId, active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING propId, prOP, sectorId, divisionId, siteId, buId, ouId, programId, propTypeId, active`,
            [
                PrOP,
                normalized.sectorId,
                normalized.divisionId,
                normalized.siteId,
                normalized.buId,
                normalized.ouId,
                normalized.programId,
                typeValue,
                active
            ]
        );
        res.status(201).json(insert.rows[0]);
    } catch (error) {
        console.error('Error creating prop:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/props/:propId', async (req, res) => {
    const { propId } = req.params;
    const {
        PrOP,
        propTypeId,
        sectorId,
        divisionId,
        siteId,
        buId,
        ouId,
        programId,
        active = 1
    } = req.body;
    if (!PrOP || !propTypeId) {
        return res.status(400).json({ success: false, error: 'PrOP and propTypeId are required.' });
    }

    const typeValue = Number(propTypeId);
    const targetMap = {
        2: { key: 'sectorId', value: sectorId },
        3: { key: 'divisionId', value: divisionId },
        4: { key: 'siteId', value: siteId },
        5: { key: 'buId', value: buId },
        6: { key: 'ouId', value: ouId },
        7: { key: 'programId', value: programId }
    };
    const target = targetMap[typeValue];
    if (target && !target.value) {
        return res.status(400).json({ success: false, error: 'Target selection is required for this PrOP type.' });
    }

    try {
        let conflictQuery = 'SELECT propId FROM props_r WHERE LOWER(TRIM(prOP)) = LOWER(TRIM($1)) AND propTypeId = $2 AND propId <> $3';
        const conflictParams = [PrOP, typeValue, propId];
        if (target) {
            conflictQuery += ` AND ${target.key} = $4`;
            conflictParams.push(Number(target.value));
        }
        const conflict = await pool.query(conflictQuery, conflictParams);
        if (conflict.rowCount > 0) {
            return res.status(409).json({ success: false, error: 'A matching PrOP already exists.' });
        }

        const normalized = {
            sectorId: null,
            divisionId: null,
            siteId: null,
            buId: null,
            ouId: null,
            programId: null
        };
        if (target) {
            normalized[target.key] = Number(target.value);
        }

        const update = await pool.query(
            `UPDATE props_r SET prOP = $1, sectorId = $2, divisionId = $3, siteId = $4, buId = $5, ouId = $6, programId = $7, propTypeId = $8, active = $9
             WHERE propId = $10
             RETURNING propId, prOP, sectorId, divisionId, siteId, buId, ouId, programId, propTypeId, active`,
            [
                PrOP,
                normalized.sectorId,
                normalized.divisionId,
                normalized.siteId,
                normalized.buId,
                normalized.ouId,
                normalized.programId,
                typeValue,
                active,
                propId
            ]
        );
        if (update.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'PrOP not found.' });
        }
        res.json(update.rows[0]);
    } catch (error) {
        console.error('Error updating prop:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all audits (optionally filter by hash)
app.get('/api/audits', async (req, res) => {
    try {
        const { hash, all, report } = req.query;
        let query = 'SELECT *, locked::int as locked FROM audits_r';
        let params = [];

        const conditions = [];
        if (hash) {
            params.push(hash);
            conditions.push(`hash = $${params.length}`);
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }

        query += ' ORDER BY scheduleId';

        const result = await pool.query(query, params);
        let audits = result.rows.map(parseAuditRow);

        if (all !== 'true') {
            const userInfo = await getCurrentUserInfo(req);

            if (!userInfo) {
                return res.json([]);
            }

            let approverScheduleIds = new Set();
            if (report === 'true' && userInfo.myid) {
                const approvalsResult = await pool.query(
                    'SELECT scheduleid FROM approvals_r WHERE approvermyid = $1',
                    [userInfo.myid]
                );
                approverScheduleIds = new Set(approvalsResult.rows.map((row) => row.scheduleid));
            }

            audits = audits.filter((audit) =>
                canAccessAudit({
                    audit,
                    userInfo,
                    report: report === 'true',
                    approverScheduleIds
                })
            );
        }

        res.json(audits);
    } catch (error) {
        console.error('Error fetching audits:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const stageColumnGroups = {
    1: [
        'title', 'auditTypeId', 'intExtId', 'functionId', 'standardIds',
        'statusId', 'expectedStartDate', 'expectedCompletionDate',
        'startDate', 'divisionId', 'programIds', 'sectorId', 'siteIds',
        'businessUnitIds', 'operatingUnitIds', 'leadAuditorId', 'additionalAuditorIds',
        'comment', 'hash'
    ],
    2: [
        'scope', 'famaIds', 'safety', 'clearance', 'safetyEquipmentIds',
        'trainingRequirementIds', 'specialConsiderations'
    ],
    3: [
        'overview', 'standardIds', 'programIds', 'intervieweeIds', 'startDate',
        'evaluator', 'programManager', 'maLeadManager', 'relatedItems', 'delayCause'
    ]
};

const buildStageUpdateQuery = ({ scheduleId, stageValue, targetStage, audit }) => {
    const resolvedStage = Number.isFinite(targetStage) ? Number(targetStage) : 1;
    const columns = stageColumnGroups[resolvedStage] || stageColumnGroups[1];
    const values = [];
    const clauses = [];

    columns.forEach((column) => {
        const value = audit[column];
        values.push(Array.isArray(value) ? JSON.stringify(value) : value);
        clauses.push(`${column} = $${values.length}`);
    });

    const computedStage = Number.isFinite(stageValue) ? stageValue : resolvedStage;
    values.push(computedStage);
    const stageParam = values.length;
    values.push(scheduleId);
    const scheduleParam = values.length;

    const query = `UPDATE audits_r SET ${clauses.join(', ')}, stage = GREATEST(stage, $${stageParam}), updatedAt = CURRENT_TIMESTAMP WHERE scheduleId = $${scheduleParam}`;
    return { query, values };
};

// Update specific audit fields (for Planning, Results, etc.)
app.put('/api/audits/:scheduleId', async (req, res) => {
    const client = await pool.connect();
    try {
        const { scheduleId } = req.params;
        const updates = { ...req.body };

        const targetStage = Number.isFinite(updates.targetStage) ? Number(updates.targetStage) : null;
        const stageValue = Number.isFinite(updates.stage) ? Number(updates.stage) : null;
        delete updates.targetStage;
        delete updates.stage;

        await client.query('BEGIN');

        if (targetStage) {
            const { query, values } = buildStageUpdateQuery({
                scheduleId: parseInt(scheduleId),
                stageValue: stageValue ?? targetStage,
                targetStage,
                audit: updates
            });
            await client.query(query, values);
        } else {
            const fields = [];
            const values = [];
            let paramCount = 1;

            for (const [key, value] of Object.entries(updates)) {
                if (key === 'scheduleId') continue;

                fields.push(`${key} = $${paramCount}`);
                values.push(Array.isArray(value) ? JSON.stringify(value) : value);
                paramCount++;
            }

            fields.push(`updatedAt = CURRENT_TIMESTAMP`);
            values.push(parseInt(scheduleId));

            const query = `UPDATE audits_r SET ${fields.join(', ')} WHERE scheduleId = $${paramCount}`;
            await client.query(query, values);
        }

        await client.query('COMMIT');
        res.json({ success: true, scheduleId: parseInt(scheduleId) });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating audit:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// Save/update audit
app.post('/api/audits', async (req, res) => {
    const client = await pool.connect();
    const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
    try {
        const audit = req.body;
        const existingScheduleId = audit.scheduleId;
        const isNewAudit = !existingScheduleId;

        await client.query('BEGIN');

        if (audit.scheduleId) {
            const targetStage = Number.isFinite(audit.targetStage) ? Number(audit.targetStage) : Number.isFinite(audit.stage) ? Number(audit.stage) : 1;
            const stageNumber = Number.isFinite(audit.stage) ? Number(audit.stage) : targetStage;
            const { query, values } = buildStageUpdateQuery({
                scheduleId: audit.scheduleId,
                stageValue: stageNumber,
                targetStage,
                audit
            });
            await client.query(query, values);
        } else {
            // Insert new audit
            const result = await client.query(
                `INSERT INTO audits_r (
                    title, auditTypeId, intExtId, functionId, standardIds, statusId, stage,
                    expectedStartDate, expectedCompletionDate, startDate,
                    divisionId, programIds, sectorId, siteIds, businessUnitIds, operatingUnitIds,
                    leadAuditorId, additionalAuditorIds, comment, scope, safety,
                    clearance, safetyEquipmentIds, trainingRequirementIds,
                    famaIds, intervieweeIds, specialConsiderations, overview, evaluator, relatedItems,
                    programManager, maLeadManager, delayCause, hash
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                    $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26,
                    $27, $28, $29, $30, $31, $32, $33, $34
                ) RETURNING scheduleId`,
                [
                    audit.title, audit.auditTypeId, audit.intExtId, audit.functionId,
                    JSON.stringify(audit.standardIds), audit.statusId, audit.stage,
                    audit.expectedStartDate, audit.expectedCompletionDate, audit.startDate,
                    audit.divisionId, JSON.stringify(audit.programIds), audit.sectorId, JSON.stringify(audit.siteIds),
                    JSON.stringify(audit.businessUnitIds), JSON.stringify(audit.operatingUnitIds), audit.leadAuditorId,
                    JSON.stringify(audit.additionalAuditorIds), audit.comment, audit.scope,
                    audit.safety, audit.clearance,
                    JSON.stringify(audit.safetyEquipmentIds), JSON.stringify(audit.trainingRequirementIds), JSON.stringify(audit.famaIds),
                    JSON.stringify(audit.intervieweeIds), audit.specialConsiderations, audit.overview, audit.evaluator,
                    audit.relatedItems, audit.programManager, audit.maLeadManager, audit.delayCause,
                    audit.hash
                ]
            );
            audit.scheduleId = result.rows[0].scheduleid;
        }

        const scheduleIdToNotify = audit.scheduleId;
        const emailAuditorIds = new Set([
            audit.leadAuditorId,
            ...(Array.isArray(audit.additionalAuditorIds) ? audit.additionalAuditorIds : [])
        ].filter(Boolean));
        const targetStage = Number.isFinite(audit.targetStage)
            ? Number(audit.targetStage)
            : Number.isFinite(audit.stage)
                ? Number(audit.stage)
                : 1;
        const shouldSendScheduleEmail = isNewAudit || targetStage === 1;

        if (shouldSendScheduleEmail && scheduleIdToNotify && emailAuditorIds.size > 0) {
            const emailAuditorIdsList = Array.from(emailAuditorIds);
            const auditorPlaceholders = emailAuditorIdsList.map((_, idx) => `$${idx + 1}`).join(', ');
            const rosterResult = await client.query(
                `SELECT DISTINCT r.email
                 FROM auditors_r a
                 JOIN roster_r r ON r.myid = a.myid
                 WHERE a.auditorid IN (${auditorPlaceholders}) AND r.email IS NOT NULL`,
                emailAuditorIdsList
            );

            const reviewLink = `${appBaseUrl}/audit/${scheduleIdToNotify}`;
            const reviewChangesLink = `${appBaseUrl}/entry?type=schedule&audit=${scheduleIdToNotify}`;
            const planLink = `${appBaseUrl}/entry?type=planning&audit=${scheduleIdToNotify}`;

            for (const row of rosterResult.rows) {
                const recipientEmail = row.email;
                if (!recipientEmail) {
                    continue;
                }

                const emailPayload = isNewAudit
                    ? buildNewAuditNotificationEmail({
                        auditTitle: audit.title,
                        scheduleId: scheduleIdToNotify,
                        reviewLink,
                        planLink
                    })
                    : buildEditAuditNotificationEmail({
                        scheduleId: scheduleIdToNotify,
                        reviewLink: reviewChangesLink,
                        planLink,
                        auditTitle: audit.title
                    });

                await queueEmail(client, {
                    toAddress: recipientEmail,
                    subject: emailPayload.subject,
                    body: emailPayload.body
                });
            }
        }

        await client.query('COMMIT');
        res.json({ success: true, scheduleId: audit.scheduleId });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saving audit:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});
// Get single audit by scheduleId
app.get('/api/audits/:scheduleId', async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const { report } = req.query;
        const userInfo = await getCurrentUserInfo(req);

        if (!userInfo) {
            return res.status(404).json({ success: false, error: 'Audit not found' });
        }

        const auditId = parseInt(scheduleId);
        const result = await pool.query(
            `SELECT *, locked::int as locked FROM audits_r WHERE scheduleid = $1`,
            [auditId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Audit not found' });
        }

        const audit = parseAuditRow(result.rows[0]);
        const isReport = report === 'true';
        let approverScheduleIds = new Set();

        if (isReport && userInfo.myid) {
            const approvalsResult = await pool.query(
                'SELECT scheduleid FROM approvals_r WHERE scheduleid = $1 AND approvermyid = $2',
                [auditId, userInfo.myid]
            );
            if (approvalsResult.rows.length > 0) {
                approverScheduleIds.add(auditId);
            }
        }

        if (!canAccessAudit({ audit, userInfo, report: isReport, approverScheduleIds })) {
            return res.status(404).json({ success: false, error: 'Audit not found' });
        }

        res.json(audit);
    } catch (error) {
        console.error('Error fetching audit:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get approval info for an audit
app.get('/api/approvals/:scheduleId', async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const userInfo = await getCurrentUserInfo(req);

        if (!userInfo) {
            return res.status(404).json({ success: false, error: 'Approval not found' });
        }

        const auditResult = await pool.query(
            'SELECT scheduleid, title, approvedat, locked::int as locked, approver, leadauditorid, additionalauditors, additionalauditorids FROM audits_r WHERE scheduleid = $1',
            [parseInt(scheduleId)]
        );

        if (auditResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Approval not found' });
        }

        let approvalsResult = await pool.query(
            `SELECT approvalid, approvermyid, status, requestedat, approvedat
             FROM approvals_r
             WHERE scheduleid = $1
             ORDER BY approvalid`,
            [parseInt(scheduleId)]
        );

        const audit = auditResult.rows[0];
        const additionalAuditorIds = normalizeNumberArray(audit.additionalauditorids ?? audit.additionalAuditorIds ?? []);
        const auditorIds = new Set([
            audit.leadauditorid,
            ...additionalAuditorIds
        ].filter(Boolean));
        let auditorEmails = [];

        if (auditorIds.size > 0) {
            const auditorIdList = Array.from(auditorIds);
            const auditorPlaceholders = auditorIdList.map((_, idx) => `$${idx + 1}`).join(', ');
            const rosterResult = await pool.query(
                `SELECT DISTINCT r.email
                 FROM auditors_r a
                 JOIN roster_r r ON r.myid = a.myid
                 WHERE a.auditorid IN (${auditorPlaceholders}) AND r.email IS NOT NULL`,
                auditorIdList
            );
            auditorEmails = rosterResult.rows.map((row) => row.email).filter(Boolean);
        }
        const approverIds = audit.approver ? [audit.approver] : [];
        const additionalApproverIds = normalizeStringArray(audit.additionalauditors);
        let leadMyId = null;
        if (audit.leadauditorid) {
            const leadRosterResult = await pool.query(
                `SELECT TOP 1 myid
                 FROM auditors_r
                 WHERE auditorid = $1`,
                [audit.leadauditorid]
            );
            leadMyId = leadRosterResult.rows[0]?.myid ?? null;
        }

        const requiredApproverIds = new Set([
            ...approverIds,
            ...(leadMyId ? [leadMyId] : []),
            ...additionalApproverIds
        ]);

        if ((audit.locked === 1 || audit.approvedat) && requiredApproverIds.size > 0) {
            const existingIds = new Set(approvalsResult.rows.map(row => row.approvermyid));
            const missingIds = [...requiredApproverIds].filter((id) => !existingIds.has(id));

            for (const approverId of missingIds) {
                await pool.query(
                    `IF NOT EXISTS (
                        SELECT 1 FROM approvals_r WHERE scheduleid = $1 AND approvermyid = $2
                    )
                    INSERT INTO approvals_r (scheduleid, approvermyid, status, requestedat, approvedat, createdat, updatedat)
                    VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                    [
                        parseInt(scheduleId),
                        approverId,
                        audit.approvedat ? 'approved' : 'pending',
                        audit.approvedat || null
                    ]
                );
            }

            approvalsResult = await pool.query(
                `SELECT approvalid, approvermyid, status, requestedat, approvedat
                 FROM approvals_r
                 WHERE scheduleid = $1
                 ORDER BY approvalid`,
                [parseInt(scheduleId)]
            );
        }

        const approvals = approvalsResult.rows;
        const currentApproval = approvals.find(a => a.approvermyid === userInfo.myid);

        res.json({
            audit,
            approvals,
            currentApproval,
            canApprove: Boolean(currentApproval),
            myId: userInfo.myid,
            auditorId: userInfo.auditorid,
            auditorEmails
        });
    } catch (error) {
        console.error('Error fetching approvals:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Approve an audit
app.post('/api/approvals/:scheduleId/approve', async (req, res) => {
    const client = await pool.connect();
    try {
        const { scheduleId } = req.params;
        const userInfo = await getCurrentUserInfo(req);

        if (!userInfo?.myid) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        await client.query('BEGIN');

        const approvalResult = await client.query(
            `UPDATE approvals_r
             SET status = 'approved', approvedat = CURRENT_TIMESTAMP, updatedat = CURRENT_TIMESTAMP
             WHERE scheduleid = $1 AND approvermyid = $2
             RETURNING approvalid`,
            [parseInt(scheduleId), userInfo.myid]
        );

        if (approvalResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        const pendingResult = await client.query(
            `SELECT COUNT(*) AS pending
             FROM approvals_r
             WHERE scheduleid = $1 AND (status != 'approved' OR approvedat IS NULL)`,
            [parseInt(scheduleId)]
        );
        const pending = parseInt(pendingResult.rows[0]?.pending || 0, 10);
        const approved = pending === 0;

        if (approved) {
            await client.query(
                'UPDATE audits_r SET approvedat = CURRENT_TIMESTAMP WHERE scheduleid = $1',
                [parseInt(scheduleId)]
            );
        }

        await client.query('COMMIT');
        res.json({ success: true, approved });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error approving audit:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// Get CARs for a specific audit
app.get('/api/cars/:scheduleId', async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const result = await pool.query(
            'SELECT * FROM cars_r WHERE scheduleid = $1 ORDER BY carid',
            [parseInt(scheduleId)]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching CARs:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Unlock an audit (set locked to 0)
app.post('/api/unlock-audit', async (req, res) => {
    const client = await pool.connect();
    try {
        const { scheduleId } = req.body;

        if (!scheduleId) {
            return res.status(400).json({ success: false, error: 'scheduleId is required' });
        }

        await client.query('BEGIN');

        const result = await client.query(
            "UPDATE audits_r SET locked = 0, approvedat = NULL, submittedat = NULL WHERE scheduleid = $1",
            [parseInt(scheduleId)]
        );

        await client.query('DELETE FROM approvals_r WHERE scheduleid = $1', [parseInt(scheduleId)]);
        await client.query('COMMIT');

        console.log('Unlock result:', result.rowCount, 'rows affected');

        res.json({ success: true });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error unlocking audit:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// Save nonconformities data (audit updates + CARs)
app.post('/api/save-nonconformities-data', async (req, res) => {
    const client = await pool.connect();
    try {
        const { audit, cars } = req.body;

        console.log('Received audit data:', audit);
        console.log('Received CARs data:', cars);

        const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';

        await client.query('BEGIN');

        // Update audit with nonconformities data
        const updateResult = await client.query(
            `UPDATE audits_r SET 
                auditorstime = $1,
                previouscarseffective = $2,
                approver = $3,
                leadauditor = $4,
                additionalauditors = $5,
                stage = $6,
                locked = $7,
                submittedat = CASE WHEN $7 = 1 THEN COALESCE(submittedat, CURRENT_TIMESTAMP) ELSE submittedat END,
                updatedat = CURRENT_TIMESTAMP
            WHERE scheduleid = $8`,
            [
                audit.auditorsTime,
                audit.previousCarsEffective,
                audit.approver,
                audit.leadAuditor,
                JSON.stringify(audit.additionalAuditors || []),
                audit.stage,
                audit.locked ? 1 : 0,
                audit.scheduleId
            ]
        );

        console.log('Audit update result:', updateResult.rowCount, 'rows affected');

        const titleResult = await client.query(
            'SELECT title, leadauditorid FROM audits_r WHERE scheduleid = $1',
            [audit.scheduleId]
        );
        const auditTitle = titleResult.rows[0]?.title;
        const leadAuditorId = titleResult.rows[0]?.leadauditorid;
        let leadMyId = null;
        if (leadAuditorId) {
            const leadRosterResult = await client.query(
                `SELECT TOP 1 myid
                 FROM auditors_r
                 WHERE auditorid = $1`,
                [leadAuditorId]
            );
            leadMyId = leadRosterResult.rows[0]?.myid ?? null;
        }

        const additionalApproverIds = Array.isArray(audit.additionalAuditors)
            ? audit.additionalAuditors.filter(Boolean)
            : [];
        const approvalMyIds = [...new Set([
            ...(audit.approver ? [audit.approver] : []),
            ...(leadMyId ? [leadMyId] : []),
            ...additionalApproverIds
        ])];

        if (audit.locked) {
            await client.query(
                'UPDATE audits_r SET approvedat = NULL WHERE scheduleid = $1',
                [audit.scheduleId]
            );

            for (const approverId of approvalMyIds) {
                await client.query(
                    `IF EXISTS (
                        SELECT 1 FROM approvals_r WHERE scheduleid = $1 AND approvermyid = $2
                    )
                    UPDATE approvals_r
                    SET status = 'pending', requestedat = CURRENT_TIMESTAMP, approvedat = NULL, updatedat = CURRENT_TIMESTAMP
                    WHERE scheduleid = $1 AND approvermyid = $2
                    ELSE
                    INSERT INTO approvals_r (scheduleid, approvermyid, status, requestedat, approvedat, createdat, updatedat)
                    VALUES ($1, $2, 'pending', CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                    [audit.scheduleId, approverId]
                );

                const approverResult = await client.query(
                    'SELECT rostername, email FROM roster_r WHERE myid = $1',
                    [approverId]
                );
                const approver = approverResult.rows[0];
                if (approver?.email) {
                    const approvalLink = `${appBaseUrl}/approve/${audit.scheduleId}`;
                    const reviewLink = `${appBaseUrl}/audit/${audit.scheduleId}`;
                    const { subject, body } = buildApprovalEmail({
                        approverName: approver.rostername,
                        auditTitle,
                        scheduleId: audit.scheduleId,
                        approvalLink,
                        reviewLink
                    });
                    await queueEmail(client, {
                        toAddress: approver.email,
                        subject,
                        body
                    });
                }
            }

        } else {
            await client.query('DELETE FROM approvals_r WHERE scheduleid = $1', [audit.scheduleId]);
            await client.query('UPDATE audits_r SET approvedat = NULL, submittedat = NULL WHERE scheduleid = $1', [audit.scheduleId]);
        }

        // Delete existing CARs for this audit
        const deleteResult = await client.query(
            'DELETE FROM cars_r WHERE scheduleid = $1',
            [audit.scheduleId]
        );

        console.log('CARs delete result:', deleteResult.rowCount, 'rows deleted');

        // Insert new CARs
        if (cars && cars.length > 0) {
            for (const car of cars) {
                const insertResult = await client.query(
                    'INSERT INTO cars_r (scheduleid, car, reviewer) VALUES ($1, $2, $3)',
                    [audit.scheduleId, car.car, car.reviewer]
                );
                console.log('Inserted CAR:', car.car);
            }
        }

        await client.query('COMMIT');
        console.log('Transaction committed successfully');
        res.json({ success: true });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saving nonconformities data:', error);
        console.error('Error details:', error.message);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// Get all risk factors
app.get('/api/risk-factors', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM RiskFactors_r ORDER BY RiskFactorID');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching risk factors:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all subcategories
app.get('/api/subcategories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Subcategories_r ORDER BY RiskFactorID, SubcategoryID');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching subcategories:', error);
        res.status(500).json({ error: error.message });
    }
});

// Dev-only: view queued approval emails
app.get('/api/email-outbox', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT emailid, toaddress, subject, body, createdat FROM email_outbox_r ORDER BY createdat DESC'
        );
        const data = result.rows.map(row => ({
            emailId: row.emailid,
            toAddress: row.toaddress,
            subject: row.subject,
            body: row.body,
            createdAt: row.createdat
        }));
        res.json(data);
    } catch (error) {
        console.error('Error fetching email outbox:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get risk ratings for a specific schedule
app.get('/api/risk-ratings/:scheduleId', async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const result = await pool.query(
            'SELECT * FROM RiskRatings_r WHERE ScheduleID = $1',
            [parseInt(scheduleId)]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching risk ratings:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save risk ratings for a schedule
app.post('/api/risk-ratings', async (req, res) => {
    const client = await pool.connect();
    try {
        const { scheduleId, ratings } = req.body;

        await client.query('BEGIN');

        // Delete existing ratings for this schedule
        await client.query(
            'DELETE FROM RiskRatings_r WHERE ScheduleID = $1',
            [scheduleId]
        );

        // Insert new ratings
        if (ratings && ratings.length > 0) {
            for (const rating of ratings) {
                await client.query(
                    'INSERT INTO RiskRatings_r (ScheduleID, SubcategoryID, Rating) VALUES ($1, $2, $3)',
                    [scheduleId, rating.subcategoryId, rating.rating]
                );
            }
        }

        await client.query('COMMIT');
        res.json({ success: true });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saving risk ratings:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});
