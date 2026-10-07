import { registerFoeAuditRoutes as registerOriginalFoeAuditRoutes } from './foeAuditRoutesOriginal.js';

const mapHomeLookaheadRow = (row) => ({
    scheduleId: row.scheduleid,
    title: row.title || 'Untitled Audit',
    expectedStartDate: row.expectedstartdate,
    auditorName: row.auditorname || 'TBD'
});

export const registerFoeAuditRoutes = (args) => {
    const { app, pool } = args;

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

    registerOriginalFoeAuditRoutes(args);
};
