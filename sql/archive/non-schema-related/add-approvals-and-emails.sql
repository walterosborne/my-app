-- Add roster emails
ALTER TABLE roster ADD COLUMN IF NOT EXISTS email VARCHAR(200);
UPDATE roster
SET email = CONCAT(
    regexp_replace(lower(trim(split_part(rostername, ',', 2))), '[^a-z0-9]+', '', 'g'),
    '.',
    regexp_replace(lower(trim(split_part(rostername, ',', 1))), '[^a-z0-9]+', '', 'g'),
    '@example.com'
)
WHERE email IS NULL;

-- Add audit approval tracking
ALTER TABLE audits ADD COLUMN IF NOT EXISTS approvedAt TIMESTAMP;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS approver VARCHAR(10);

CREATE TABLE IF NOT EXISTS approvals (
    approvalId SERIAL PRIMARY KEY,
    scheduleId INTEGER NOT NULL,
    approverMyId VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    requestedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approvedAt TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(scheduleId, approverMyId)
);

CREATE INDEX IF NOT EXISTS idx_approvals_schedule ON approvals(scheduleId);
CREATE INDEX IF NOT EXISTS idx_approvals_approver ON approvals(approverMyId);

CREATE TABLE IF NOT EXISTS email_outbox (
    emailId SERIAL PRIMARY KEY,
    toAddress TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
