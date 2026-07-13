-- Convert audits_r.divisionid and audits_r.functionid to JSONB arrays for multi-select support.
-- Assumes current columns are integers. Adjust the USING clause if your columns are already JSON/JSONB text.

ALTER TABLE audits_r
  ALTER COLUMN divisionid TYPE jsonb
  USING CASE
    WHEN divisionid IS NULL THEN '[]'::jsonb
    ELSE jsonb_build_array(divisionid)
  END;

ALTER TABLE audits_r
  ALTER COLUMN divisionid SET DEFAULT '[]'::jsonb;

ALTER TABLE audits_r
  ALTER COLUMN functionid TYPE jsonb
  USING CASE
    WHEN functionid IS NULL THEN '[]'::jsonb
    ELSE jsonb_build_array(functionid)
  END;

ALTER TABLE audits_r
  ALTER COLUMN functionid SET DEFAULT '[]'::jsonb;
