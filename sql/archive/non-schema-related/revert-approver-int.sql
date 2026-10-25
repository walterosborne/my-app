ALTER TABLE audits ALTER COLUMN approver DROP DEFAULT;

ALTER TABLE audits
ALTER COLUMN approver TYPE INTEGER
USING CASE
    WHEN approver IS NULL THEN NULL
    WHEN jsonb_typeof(approver) = 'array' THEN NULLIF((approver->>0), '')::integer
    WHEN jsonb_typeof(approver) = 'number' THEN (approver::text)::integer
    ELSE NULL
END;
