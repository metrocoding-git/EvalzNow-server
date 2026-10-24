-- EvalzNow – Oct 2026 new work (Framework Age + Effectivity).
-- The API creates these automatically at start (src/config/ensureDb.js).
-- Run this file by hand only if the database user cannot ALTER / CREATE tables.

-- Framework / curriculum age for Classroom units
ALTER TABLE units ADD COLUMN frameworkAge VARCHAR(20) NULL;

-- Effectivity objects (one per candidate and PP ID)
CREATE TABLE IF NOT EXISTS effectivity_responses (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  unitId INT NOT NULL,
  candidateId INT NOT NULL,
  ppId INT NOT NULL,
  effectivityType VARCHAR(60) NULL,
  effectivityGap VARCHAR(60) NULL,
  effectivitySegment VARCHAR(60) NULL,
  effectivityContext VARCHAR(60) NULL,
  effectivityPurpose VARCHAR(60) NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  UNIQUE KEY uq_effectivity_unit_cand_pp (unitId, candidateId, ppId),
  CONSTRAINT fk_effectivity_unit FOREIGN KEY (unitId) REFERENCES units (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_effectivity_candidate FOREIGN KEY (candidateId) REFERENCES candidates (id) ON DELETE CASCADE ON UPDATE CASCADE
);
