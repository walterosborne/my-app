-- Add org hierarchy columns and backfill parent relationships
-- Run with: psql audit_db < add-org-hierarchy.sql

\c audit_db;

ALTER TABLE divisions
  ADD COLUMN IF NOT EXISTS sectorId INTEGER;

ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS divisionId INTEGER;

ALTER TABLE sites
  ADD COLUMN IF NOT EXISTS divisionId INTEGER;

ALTER TABLE business_units
  ADD COLUMN IF NOT EXISTS divisionId INTEGER;

ALTER TABLE operating_units
  ADD COLUMN IF NOT EXISTS divisionId INTEGER;

UPDATE divisions
SET sectorId = CASE divisionName
  WHEN 'Aeronautics Systems' THEN 1
  WHEN 'Mission Systems' THEN 1
  WHEN 'Space Systems' THEN 2
  WHEN 'Corporate' THEN 1
  ELSE sectorId
END;

UPDATE programs
SET divisionId = CASE programName
  WHEN 'Program Alpha' THEN 1
  WHEN 'Program Beta' THEN 1
  WHEN 'Secure Communications' THEN 2
  WHEN 'Cyber Defense' THEN 2
  WHEN 'Aircraft Maintenance' THEN 1
  WHEN 'Component Overhaul' THEN 1
  WHEN 'Satellite Manufacturing' THEN 3
  WHEN 'Propulsion Systems' THEN 3
  WHEN 'Command & Control Systems' THEN 2
  WHEN 'Mission Planning Software' THEN 2
  WHEN 'Electronic Warfare' THEN 2
  WHEN 'Radar Systems' THEN 2
  WHEN 'F-35 Manufacturing' THEN 1
  WHEN 'B-21 Assembly' THEN 1
  WHEN 'GPS III' THEN 3
  WHEN 'James Webb Space Telescope Ground Systems' THEN 3
  WHEN 'IBCS' THEN 2
  WHEN 'AARGM-ER' THEN 1
  WHEN 'All Programs' THEN NULL
  ELSE divisionId
END;

UPDATE sites
SET divisionId = CASE address
  WHEN 'Plant 42 - Palmdale' THEN 1
  WHEN 'Annapolis Junction, MD' THEN 2
  WHEN 'Lake Charles, LA' THEN 1
  WHEN 'Redondo Beach, CA' THEN 3
  WHEN 'McLean, VA' THEN 2
  WHEN 'Baltimore, MD' THEN 2
  WHEN 'Palmdale, CA' THEN 1
  WHEN 'Azusa, CA' THEN 3
  WHEN 'Woodland Hills, CA' THEN 3
  WHEN 'Oklahoma City, OK' THEN 1
  ELSE divisionId
END;

UPDATE business_units
SET divisionId = CASE businessUnitName
  WHEN 'Air Dominance' THEN 1
  WHEN 'Cyber & Intelligence' THEN 2
  WHEN 'Global Logistics & Modernization' THEN 1
  WHEN 'Space Systems' THEN 3
  WHEN 'C4ISR' THEN 2
  WHEN 'Electronic Systems' THEN 2
  WHEN 'Space Launch' THEN 3
  WHEN 'Strike & Missiles' THEN 1
  WHEN 'Defense Services' THEN 1
  ELSE divisionId
END;

UPDATE operating_units
SET divisionId = CASE operatingUnitName
  WHEN 'Advanced Development' THEN 1
  WHEN 'Information Assurance' THEN 2
  WHEN 'MRO Services' THEN 1
  WHEN 'Manufacturing' THEN 1
  WHEN 'Software Engineering' THEN 2
  WHEN 'Procurement' THEN 1
  WHEN 'Final Assembly' THEN 1
  WHEN 'Engineering' THEN 1
  WHEN 'Program Management Office' THEN 2
  WHEN 'Learning & Development' THEN 4
  ELSE divisionId
END;
