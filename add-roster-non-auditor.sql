-- Add roster-only user (not an auditor)
INSERT INTO roster (rosterName, networkId, myId, email)
SELECT 'Nguyen, Alex', 'R12345', 'X12345', 'alex.nguyen@walterosborne.com'
WHERE NOT EXISTS (
    SELECT 1 FROM roster WHERE LOWER(TRIM(rosterName)) = LOWER(TRIM('Nguyen, Alex'))
);
