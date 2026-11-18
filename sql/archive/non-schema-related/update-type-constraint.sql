-- Drop the nonconformances type constraint (standard IDs now stored in type)
-- Run this with: psql -U postgres -d audit_db -f update-type-constraint.sql

\c audit_db;

-- Drop the old constraint so standard IDs can be stored in type
ALTER TABLE nonconformances DROP CONSTRAINT IF EXISTS nonconformances_type_check;
