/**
 * Capsule (Capacity Accounting) tables – "Workflow with Capacity.xlsx".
 *
 * A capsule works like a unit, but for clinical capacities (PC1/PC2/PC3 instead of RRN/PRN/ARN).
 * Columns that are filtered / joined on are real columns; the remaining form fields of a row
 * (thresholds, clinical markers CM1–CM100, delivery texts, auxiliary record fields …) are kept in a
 * JSON text column (`data` / `settings`) so the screens get back exactly what they saved.
 *
 * All tables are created at API start when missing (config/ensureDb.js) and never altered/dropped.
 */

/** LONGTEXT column holding a JSON object (works the same on MySQL and MariaDB). */
function jsonColumn(DataTypes, name) {
  return {
    type: DataTypes.TEXT("long"),
    allowNull: true,
    get() {
      const raw = this.getDataValue(name);
      if (raw === null || raw === undefined || raw === "") return {};
      if (typeof raw === "object") return raw;
      try { return JSON.parse(raw); } catch { return {}; }
    },
    set(value) {
      this.setDataValue(name, value === null || value === undefined ? null : JSON.stringify(value));
    },
  };
}

const capsuleFk = (DataTypes) => ({
  type: DataTypes.INTEGER,
  allowNull: false,
  references: { model: "capsules", key: "id" },
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

const candidateFk = (DataTypes, allowNull = false) => ({
  type: DataTypes.INTEGER,
  allowNull,
  references: { model: "candidates", key: "id" },
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

module.exports = (sequelize, DataTypes) => {
  const Capsule = sequelize.define("Capsule", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "clients", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    capsuleName: { type: DataTypes.STRING(150), allowNull: false },
    capsuleId: { type: DataTypes.STRING(60), allowNull: false },           // human-readable code, e.g. CC-001
    capsuleStartDate: { type: DataTypes.DATEONLY, allowNull: true },
    capsuleEndDate: { type: DataTypes.DATEONLY, allowNull: true },
    capsuleDirector: { type: DataTypes.STRING(150), allowNull: true },
    capsuleType: { type: DataTypes.STRING(40), allowNull: false },          // Capacity - Combined / Capacity - Isolated
    signatureProfile: { type: DataTypes.STRING(80), allowNull: true },
    environment: { type: DataTypes.STRING(80), allowNull: true },
    frameworkAge: { type: DataTypes.STRING(40), allowNull: true },
    settings: jsonColumn(DataTypes, "settings"),                             // pass/fail thresholds (XEP, XCFL, ΔPC1, IC, NDIV …)
  }, {
    tableName: "capsules",
    timestamps: true,
    indexes: [{ unique: true, fields: ["clientId", "capsuleId"], name: "uq_capsule_client_code" }],
  });

  const CapsuleStaff = sequelize.define("CapsuleStaff", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    capsuleId: capsuleFk(DataTypes),
    staffId: { type: DataTypes.INTEGER, allowNull: false },
    roleType: { type: DataTypes.STRING(30), allowNull: false },             // Leader / Assessor
  }, { tableName: "capsule_staff", timestamps: true, indexes: [{ fields: ["capsuleId"] }] });

  const CapsuleBenchmark = sequelize.define("CapsuleBenchmark", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    capsuleId: capsuleFk(DataTypes),
    benchmarkId: { type: DataTypes.STRING(20), allowNull: true },
    benchmarkType: { type: DataTypes.STRING(80), allowNull: true },
    benchmarkRef: { type: DataTypes.STRING(80), allowNull: true },
    benchmarkDescription: { type: DataTypes.TEXT, allowNull: true },
  }, { tableName: "capsule_benchmarks", timestamps: true, indexes: [{ fields: ["capsuleId"] }] });

  const CapsuleRoster = sequelize.define("CapsuleRoster", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    capsuleId: capsuleFk(DataTypes),
    candidateId: candidateFk(DataTypes),
    capsuleOutcome: { type: DataTypes.STRING(40), allowNull: false, defaultValue: "Ongoing" },
    ageRange: { type: DataTypes.STRING(40), allowNull: true, defaultValue: "Unknown" },
    presentCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    excusedAbsences: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    unexcusedAbsences: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    excusedTardies: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    unexcusedTardies: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  }, {
    tableName: "capsule_rosters",
    timestamps: true,
    indexes: [{ unique: true, fields: ["capsuleId", "candidateId"], name: "uq_capsule_roster" }, { fields: ["candidateId"] }],
  });

  // Assessment blocks: same PP ID rules as units (Indirect -1, -2, … / Direct 1, 2, …)
  const CapsuleBlock = sequelize.define("CapsuleBlock", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    capsuleId: capsuleFk(DataTypes),
    candidate_id: candidateFk(DataTypes),
    manageType: { type: DataTypes.STRING(20), allowNull: false },            // Direct / Indirect
    ppId: { type: DataTypes.INTEGER, allowNull: false },
    periodType: { type: DataTypes.STRING(60), allowNull: true },
    shortDescription: { type: DataTypes.STRING(255), allowNull: true },
    delivery: { type: DataTypes.STRING(120), allowNull: true },              // "Capsule Operations" delivery text
    data: jsonColumn(DataTypes, "data"),
  }, { tableName: "capsule_blocks", timestamps: true, indexes: [{ fields: ["capsuleId", "candidate_id", "ppId"] }] });

  // Insert Scores for Capacity Accounting (one row per capacity score of a PP ID)
  const CapsuleScore = sequelize.define("CapsuleScore", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    capsuleId: capsuleFk(DataTypes),
    candidate_id: candidateFk(DataTypes),
    blockId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "capsule_blocks", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    ppId: { type: DataTypes.INTEGER, allowNull: false },
    capacity: { type: DataTypes.STRING(80), allowNull: false },
    criticalRefDate: { type: DataTypes.DATEONLY, allowNull: true },
    durationDays: { type: DataTypes.DOUBLE, allowNull: true },
    attainedScore: { type: DataTypes.DOUBLE, allowNull: true },
    maxScore: { type: DataTypes.DOUBLE, allowNull: true },
    data: jsonColumn(DataTypes, "data"),                                       // clinical markers CM1–CM100, notes …
  }, {
    tableName: "capsule_scores",
    timestamps: true,
    indexes: [{ fields: ["capsuleId", "candidate_id", "ppId", "criticalRefDate"] }, { fields: ["blockId"] }],
  });

  // Renamable clinical markers (CM89–CM100 custom criteria, max 30 characters)
  const CapsuleMarkerName = sequelize.define("CapsuleMarkerName", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    capsuleId: capsuleFk(DataTypes),
    markerIndex: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "" },
  }, {
    tableName: "capsule_marker_names",
    timestamps: true,
    indexes: [{ unique: true, fields: ["capsuleId", "markerIndex"], name: "uq_capsule_marker" }],
  });

  // Growth Metrics – Projection Table sessions (points as saved by the projection table)
  const CapsuleProjection = sequelize.define("CapsuleProjection", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    capsuleId: capsuleFk(DataTypes),
    candidateId: candidateFk(DataTypes),
    points: jsonColumn(DataTypes, "points"),
  }, { tableName: "capsule_projections", timestamps: true, indexes: [{ fields: ["capsuleId", "candidateId"] }] });

  // Effectivity object of a candidate's PP ID (15 parameters are calculated, not stored)
  const CapsuleEffectivity = sequelize.define("CapsuleEffectivity", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    capsuleId: capsuleFk(DataTypes),
    candidateId: candidateFk(DataTypes),
    ppId: { type: DataTypes.INTEGER, allowNull: false },
    effectivityType: { type: DataTypes.STRING(60), allowNull: true },
    effectivityGap: { type: DataTypes.STRING(60), allowNull: true },
    effectivitySegment: { type: DataTypes.STRING(60), allowNull: true },
    effectivityContext: { type: DataTypes.STRING(60), allowNull: true },
    effectivityPurpose: { type: DataTypes.STRING(60), allowNull: true },
  }, {
    tableName: "capsule_effectivity",
    timestamps: true,
    indexes: [{ unique: true, fields: ["capsuleId", "candidateId", "ppId"], name: "uq_capsule_effectivity" }],
  });

  /**
   * Auxiliary Resultants records of a capsule. One table for the five record kinds the auxiliary
   * screens keep (same fields as the unit tables, in `data`):
   *   candidateMarks, needAssessments, improvements, chains, leaderMarks
   */
  const CapsuleAuxRecord = sequelize.define("CapsuleAuxRecord", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    kind: { type: DataTypes.STRING(30), allowNull: false },
    capsuleId: capsuleFk(DataTypes),
    candidateId: candidateFk(DataTypes, true),
    data: jsonColumn(DataTypes, "data"),
  }, { tableName: "capsule_aux_records", timestamps: true, indexes: [{ fields: ["capsuleId", "kind", "candidateId"] }] });

  return {
    Capsule, CapsuleStaff, CapsuleBenchmark, CapsuleRoster, CapsuleBlock, CapsuleScore,
    CapsuleMarkerName, CapsuleProjection, CapsuleEffectivity, CapsuleAuxRecord,
  };
};

/** Creation order (parents first) for CREATE TABLE IF NOT EXISTS. */
module.exports.TABLE_ORDER = [
  "Capsule", "CapsuleStaff", "CapsuleBenchmark", "CapsuleRoster", "CapsuleBlock", "CapsuleScore",
  "CapsuleMarkerName", "CapsuleProjection", "CapsuleEffectivity", "CapsuleAuxRecord",
];
