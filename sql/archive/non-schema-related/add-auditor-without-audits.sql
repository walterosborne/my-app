-- Add new auditor + roster entry with no audits
INSERT INTO auditors (lName, fName, myId)
SELECT 'Lopez', 'Jamie', 'Y12345'
WHERE NOT EXISTS (
    SELECT 1 FROM auditors WHERE LOWER(TRIM(CONCAT(lName, ', ', fName))) = LOWER(TRIM('Lopez, Jamie'))
);

INSERT INTO roster (rosterName, networkId, myId, email)
SELECT 'Lopez, Jamie', 'Z12345', 'Y12345', 'jamie.lopez@example.com'
WHERE NOT EXISTS (
    SELECT 1 FROM roster WHERE LOWER(TRIM(rosterName)) = LOWER(TRIM('Lopez, Jamie'))
);
