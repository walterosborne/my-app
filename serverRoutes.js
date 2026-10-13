import { registerFoeAuditRoutes } from './foeAuditRoutesOriginal.js';
import { registerNgatReadRoutes } from './ngatReadRoutes.js';
import { registerReferenceDataRoutes } from './referenceDataRoutes.js';

const normalizeApprovalMyId = (value) => String(value ?? '').trim().toLowerCase();

const getApprovalDebugSchema = () => {
    const mode = String(process.env.NGAT_ENV || '').trim().toLowerCase();
    return {
        mode: mode || null,
        schema: mode === 'prod' ? 'dbo' : mode === 'dev' ? 'dev' : mode === 'stg' ? 'stag' : null
    };
};

const summarizeApprovalRows = (rows = []) => rows.map((row) => ({
    approvalId: row.approvalid ?? null,
    approverMyId: row.approvermyid ?? null,
    approverMyIdLength: row.approvermyid == null ? null : String(row.approvermyid).length,
    status: row.status ?? null,
    requestedAt: row.requestedat ?? null,
    approvedAt: row.approvedat ?? null
}));

const registerApprovalDebugging = ({ app, pool, getCurrentUserInfo }) => {
    app.use(async (req, res, next) => {
        const match = String(req.originalUrl || '').match(/^\/api\/approvals\/(\d+)(?:\/approve)?(?:\?.*)?$/i);
        if (!match || !['GET', 'POST'].includes(req.method)) {
            return next();
        }

        const scheduleId = Number(match[1]);
        const environment = getApprovalDebugSchema();
        let userInfo = null;

        try {
            userInfo = await getCurrentUserInfo(req);
            const [auditResult, approvalsResult] = await Promise.all([
                pool.query(
                    `SELECT scheduleid, approver, leadauditorid, CAST(locked AS INT) AS locked,
                            stage, submittedat, approvedat
                     FROM audits_r
                     WHERE scheduleid = $1`,
                    [scheduleId]
                ),
                pool.query(
                    `SELECT approvalid, approvermyid, status, requestedat, approvedat
                     FROM approvals_r
                     WHERE scheduleid = $1
                     ORDER BY approvalid`,
                    [scheduleId]
                )
            ]);

            const audit = auditResult.rows[0] || null;
            const approvalRows = approvalsResult.rows || [];
            const userMyId = userInfo?.myid ?? null;
            const normalizedUserMyId = normalizeApprovalMyId(userMyId);
            const exactUserMatch = Boolean(
                userMyId && approvalRows.some((row) => row.approvermyid === userMyId)
            );
            const normalizedUserMatch = Boolean(
                normalizedUserMyId && approvalRows.some(
                    (row) => normalizeApprovalMyId(row.approvermyid) === normalizedUserMyId
                )
            );

            console.log('[NGAT APPROVAL DEBUG] request', {
                method: req.method,
                path: req.originalUrl,
                scheduleId,
                ngatEnv: environment.mode,
                auditSchema: environment.schema,
                identity: {
                    myId: userMyId,
                    myIdLength: userMyId == null ? null : String(userMyId).length,
                    auditorId: userInfo?.auditorid ?? null,
                    networkId: userInfo?.networkid ?? null,
                    rosterMatchedBy: req.ngatRosterMatchedBy ?? null,
                    identitySource: req.ngatIdentitySource ?? null
                },
                audit: audit ? {
                    scheduleId: audit.scheduleid,
                    approver: audit.approver ?? null,
                    approverLength: audit.approver == null ? null : String(audit.approver).length,
                    leadAuditorId: audit.leadauditorid ?? null,
                    locked: audit.locked ?? null,
                    stage: audit.stage ?? null,
                    submittedAt: audit.submittedat ?? null,
                    approvedAt: audit.approvedat ?? null
                } : null,
                approvalRows: summarizeApprovalRows(approvalRows),
                exactUserApprovalMatch: exactUserMatch,
                normalizedUserApprovalMatch: normalizedUserMatch,
                formattingOnlyMismatch: !exactUserMatch && normalizedUserMatch
            });
        } catch (error) {
            console.error('[NGAT APPROVAL DEBUG] failed to inspect request', {
                method: req.method,
                path: req.originalUrl,
                scheduleId,
                ngatEnv: environment.mode,
                auditSchema: environment.schema,
                error: error?.message || String(error)
            });
        }

        res.on('finish', () => {
            void (async () => {
                try {
                    const approvalsResult = await pool.query(
                        `SELECT approvalid, approvermyid, status, requestedat, approvedat
                         FROM approvals_r
                         WHERE scheduleid = $1
                         ORDER BY approvalid`,
                        [scheduleId]
                    );
                    const userMyId = userInfo?.myid ?? null;
                    console.log('[NGAT APPROVAL DEBUG] response', {
                        method: req.method,
                        path: req.originalUrl,
                        scheduleId,
                        ngatEnv: environment.mode,
                        auditSchema: environment.schema,
                        httpStatus: res.statusCode,
                        userMyId,
                        exactUserApprovalMatchAfter: Boolean(
                            userMyId && approvalsResult.rows.some((row) => row.approvermyid === userMyId)
                        ),
                        approvalRowsAfter: summarizeApprovalRows(approvalsResult.rows)
                    });
                } catch (error) {
                    console.error('[NGAT APPROVAL DEBUG] failed to inspect response state', {
                        method: req.method,
                        path: req.originalUrl,
                        scheduleId,
                        httpStatus: res.statusCode,
                        error: error?.message || String(error)
                    });
                }
            })();
        });

        return next();
    });
};

export const registerServerRoutes = (args) => {
    registerApprovalDebugging(args);
    registerNgatReadRoutes(args);
    registerReferenceDataRoutes(args);
    registerFoeAuditRoutes(args);
};
