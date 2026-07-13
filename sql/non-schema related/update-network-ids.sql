-- Add networkId/myId columns and populate IDs for roster/auditors
ALTER TABLE roster ADD COLUMN IF NOT EXISTS networkId VARCHAR(6);
ALTER TABLE roster ADD COLUMN IF NOT EXISTS myId VARCHAR(6);
ALTER TABLE auditors ADD COLUMN IF NOT EXISTS myId VARCHAR(6);

-- Assign networkId and myId values for roster (only where missing)
WITH ranked AS (
    SELECT ctid, ROW_NUMBER() OVER (ORDER BY rosterName) AS rn
    FROM roster
    WHERE networkId IS NULL OR myId IS NULL
)
UPDATE roster r
SET
    myId = COALESCE(r.myId, CASE WHEN ranked.rn % 2 = 0 THEN 'C' || LPAD(ranked.rn::text, 5, '0')
                                 ELSE 'A' || LPAD(ranked.rn::text, 5, '0') END),
    networkId = COALESCE(r.networkId, CASE WHEN ranked.rn % 2 = 0 THEN 'B' || LPAD(ranked.rn::text, 5, '0')
                                           ELSE 'A' || LPAD(ranked.rn::text, 5, '0') END)
FROM ranked
WHERE r.ctid = ranked.ctid;

-- Match auditor myId to roster by name when possible
UPDATE auditors a
SET myId = r.myId
FROM roster r
WHERE a.myId IS NULL
  AND LOWER(TRIM(CONCAT(a.lName, ', ', a.fName))) = LOWER(TRIM(r.rosterName));

-- Assign remaining auditor myId values
WITH missing AS (
    SELECT auditorId, ROW_NUMBER() OVER (ORDER BY auditorId) AS rn
    FROM auditors
    WHERE myId IS NULL
)
UPDATE auditors a
SET myId = 'D' || LPAD(missing.rn::text, 5, '0')
FROM missing
WHERE a.auditorId = missing.auditorId;

-- Add auditors to roster when missing
INSERT INTO roster (rosterName, networkId, myId)
SELECT CONCAT(a.lName, ', ', a.fName),
       'E' || LPAD(ROW_NUMBER() OVER (ORDER BY a.auditorId)::text, 5, '0'),
       a.myId
FROM auditors a
LEFT JOIN roster r ON LOWER(TRIM(r.rosterName)) = LOWER(TRIM(CONCAT(a.lName, ', ', a.fName)))
WHERE r.myId IS NULL;

-- Add 5 dummy audits for the hardcoded networkId (E00001)
WITH lead AS (
    SELECT a.auditorId
    FROM roster r
    JOIN auditors a ON a.myId = r.myId
    WHERE r.networkId = 'E00001'
    LIMIT 1
)
INSERT INTO audits (
    title, auditTypeId, intExtId, functionId, statusId, stage,
    expectedStartDate, expectedCompletionDate, startDate,
    leadAuditorId, additionalAuditorIds
)
SELECT 'Dummy Audit - Schedule Only', 1, 1, 1, 1, 1,
       CURRENT_DATE + INTERVAL '10 days',
       CURRENT_DATE + INTERVAL '12 days', NULL,
       lead.auditorId, '[]'::jsonb
FROM lead
UNION ALL
SELECT 'Dummy Audit - Planning Done', 1, 1, 2, 2, 2,
       CURRENT_DATE - INTERVAL '5 days',
       CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE - INTERVAL '5 days',
       lead.auditorId, '[]'::jsonb
FROM lead
UNION ALL
SELECT 'Dummy Audit - Results Done', 1, 2, 3, 2, 3,
       CURRENT_DATE - INTERVAL '15 days',
       CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE - INTERVAL '15 days',
       lead.auditorId, '[]'::jsonb
FROM lead
UNION ALL
SELECT 'Dummy Audit - Nonconformaties', 2, 2, 4, 3, 4,
       CURRENT_DATE - INTERVAL '25 days',
       CURRENT_DATE - INTERVAL '23 days', CURRENT_DATE - INTERVAL '25 days',
       lead.auditorId, '[]'::jsonb
FROM lead
UNION ALL
SELECT 'Dummy Audit - Pending Approval', 2, 1, 5, 3, 4,
       CURRENT_DATE - INTERVAL '35 days',
       CURRENT_DATE - INTERVAL '33 days', CURRENT_DATE - INTERVAL '35 days',
       lead.auditorId, '[]'::jsonb
FROM lead;
