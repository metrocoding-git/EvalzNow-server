const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
// db.User = require('./user.model')(sequelize, Sequelize);
db.Client = require('./client.model')(sequelize, Sequelize);
db.CompanySize = require('./companySize.model')(sequelize, Sequelize);
db.Staff = require('./staff.model')(sequelize, Sequelize);
db.Candidate = require('./candidate.model')(sequelize, Sequelize);
db.Irregularity = require('./irregularity.model')(sequelize, Sequelize);
db.Unit = require('./unit.model')(sequelize, Sequelize);
db.Benchmark = require('./benchmark.model')(sequelize, Sequelize);
// db.UnitRoster = require('./unitRoster.model')(sequelize, Sequelize);
db.UnitRoster = require("./unitRoster.model")(sequelize, Sequelize);
db.AssessmentBlockManager = require("./assessmentBlockManager.model")(sequelize, Sequelize); 
db.Ethinicity = require("./ethinicity.model")(sequelize, Sequelize);
db.Income = require("./income.model")(sequelize, Sequelize);
db.InsertScore = require("./insertScore.model")(sequelize, Sequelize);
db.ScoringCriteria = require("./scoringCriteria.model")(sequelize, Sequelize);
db.Account = require("./account.model")(sequelize, Sequelize);
db.StaffLookup = require("./staffLookUp.model")(sequelize, Sequelize);
db.ProjectionSession = require("./projectionSession.model")(sequelize, Sequelize);
db.ProjectionPoint = require("./projectionPoints.model")(sequelize, Sequelize);
db.CandidateMarks = require("./candidateMark.model")(sequelize, Sequelize);
db.CandidateNeedAssessment = require("./candidateNeedAssessment.model")(sequelize, Sequelize);
db.UnitImprovement = require("./unitImprovement.model")(sequelize, Sequelize);
db.LeaderMarks = require("./leaderMark.model")(sequelize, Sequelize);
db.AssessmentChain = require("./assessmentChain.model")(sequelize, Sequelize);
db.NeuroScienceSession = require("./neuroScienceSession.model")(sequelize, Sequelize);
db.NeuroScienceResponse = require("./neuroScienceResponse.model")(sequelize, Sequelize);
db.InsertScoreCriteria = require("./insertScoreCriteria.model")(sequelize, Sequelize);
db.AuthRevocation = require("./authRevocation.model")(sequelize, Sequelize);
db.EffectivityResponse = require("./effectivityResponse.model")(sequelize, Sequelize);
// Capsule (Capacity Accounting) tables
Object.assign(db, require("./capsule.models")(sequelize, Sequelize));



if (db.NeuroScienceSession && db.Unit && db.Candidate && db.AssessmentBlockManager) {

  //  Unit
  db.NeuroScienceSession.belongsTo(db.Unit, {
    foreignKey: "unitId",
    as: "unit",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  //  Candidate
  db.NeuroScienceSession.belongsTo(db.Candidate, {
    foreignKey: "candidateId",
    as: "candidate",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  //  Assessment Block
  db.NeuroScienceSession.belongsTo(db.AssessmentBlockManager, {
    foreignKey: "assessmentBlockId",
    as: "assessmentBlock",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
}

// NeuroScienceSession ↔ NeuroScienceResponse
if (db.NeuroScienceSession && db.NeuroScienceResponse) {
  db.NeuroScienceSession.hasMany(db.NeuroScienceResponse, {
    foreignKey: "sessionId",
    as: "responses",
    onDelete: "CASCADE",
  });
  db.NeuroScienceResponse.belongsTo(db.NeuroScienceSession, {
    foreignKey: "sessionId",
    as: "session",
    onDelete: "CASCADE",
  });
}


// Define associations
if (db.Client && db.CompanySize) {
  db.Client.belongsTo(db.CompanySize, { foreignKey: 'companySizeId', as: 'companySize' });
}

if (db.Candidate && db.Irregularity) {
  // Candidate has many Irregularities
  db.Candidate.hasMany(db.Irregularity, {
    foreignKey: 'candidateId',
    as: 'irregularities',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });

  // Irregularity belongs to Candidate
  db.Irregularity.belongsTo(db.Candidate, {
    foreignKey: 'candidateId',
    as: 'candidate',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
}


// Unit-Benchmark relationships
if (db.Unit && db.Benchmark) {
  db.Unit.hasMany(db.Benchmark, {
    foreignKey: 'unitId',
    as: 'benchmarks',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });

  db.Benchmark.belongsTo(db.Unit, {
    foreignKey: 'unitId',
    as: 'unit',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });

  
}

db.Candidate.hasMany(db.UnitRoster, {
  foreignKey: "candidateId",
  as: "unitRosters",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
db.UnitRoster.belongsTo(db.Candidate, {
  foreignKey: "candidateId",
  as: "candidate",
});

// Unit ↔ UnitRoster
db.Unit.hasMany(db.UnitRoster, {
  foreignKey: "unitId",
  as: "roster",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
db.UnitRoster.belongsTo(db.Unit, {
  foreignKey: "unitId",
  as: "unit",
});

// Candidate ↔ AssessmentBlockManager
db.Candidate.hasMany(db.AssessmentBlockManager, {
  foreignKey: "candidate_id",
  as: "assessmentBlocks",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
db.AssessmentBlockManager.belongsTo(db.Candidate, {
  foreignKey: "candidate_id",
  as: "candidate",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Unit ↔ AssessmentBlockManager
db.Unit.hasMany(db.AssessmentBlockManager, {
  foreignKey: "unitId",
  as: "assessmentBlocks",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
db.AssessmentBlockManager.belongsTo(db.Unit, {
  foreignKey: "unitId",
  as: "unit",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});


// AssessmentBlockManager ↔ InsertScore
db.AssessmentBlockManager.hasMany(db.InsertScore, {
  foreignKey: "assessmentBlockId",
  as: "insertScores",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

db.InsertScore.belongsTo(db.AssessmentBlockManager, {
  foreignKey: "assessmentBlockId",
  as: "assessmentBlock",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});


// Unit ↔ InsertScore
db.Unit.hasMany(db.InsertScore, {
  foreignKey: "unitId",
  as: "insertScores",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
db.InsertScore.belongsTo(db.Unit, {
  foreignKey: "unitId",
  as: "unit",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});



db.Candidate.hasMany(db.InsertScore, {
  foreignKey: "candidate_id",
  as: "insertScores",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
db.InsertScore.belongsTo(db.Candidate, {
  foreignKey: "candidate_id",
  as: "candidate",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
})

db.InsertScore.hasMany(db.InsertScoreCriteria, {
  foreignKey: "insertScoreId",
  as: "customCriteria",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
})

db.InsertScoreCriteria.belongsTo(db.InsertScore, {
  foreignKey: "insertScoreId",
  as: "insertScore",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
})

db.InsertScoreCriteria.belongsTo(db.ScoringCriteria, {
  foreignKey: "scoringCriteriaId",
  as: "criteria",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
})

db.Unit.hasMany(db.ScoringCriteria, {
  foreignKey: "unitId",
  as: "scoringCriteria",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
db.ScoringCriteria.belongsTo(db.Unit, {
  foreignKey: "unitId",
  as: "unit",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});



// Account ↔ Client
db.Account.hasMany(db.Client, {
  foreignKey: "accountId",
  as: "clients",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

db.Client.belongsTo(db.Account, {
  foreignKey: "accountId",
  as: "account",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});


db.Account.hasMany(db.Staff, {
  foreignKey: "accountId",
  as: "staffs",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

db.Staff.belongsTo(db.Account, {
  foreignKey: "accountId",
  as: "account",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

db.Client.hasMany(db.Staff, {
  foreignKey: "clientId",
  as: "staffs",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

db.Staff.belongsTo(db.Client, {
  foreignKey: "clientId",
  as: "client",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});


db.Account.hasMany(db.Candidate, {
  foreignKey: "accountId",
  as: "candidates",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

db.Candidate.belongsTo(db.Account, {
  foreignKey: "accountId",
  as: "account",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});


db.Account.hasMany(db.Unit, {
  foreignKey: "accountId",
  as: "units",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

db.Unit.belongsTo(db.Account, {
  foreignKey: "accountId",
  as: "account",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});


// ================== ProjectionSession ↔ ProjectionPoint ==================
if (db.ProjectionSession && db.ProjectionPoint) {
  db.ProjectionSession.hasMany(db.ProjectionPoint, {
    foreignKey: "sessionId",
    as: "points",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  db.ProjectionPoint.belongsTo(db.ProjectionSession, {
    foreignKey: "sessionId",
    as: "session",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
}


if (db.Unit && db.ProjectionSession) {
  db.Unit.hasMany(db.ProjectionSession, {
    foreignKey: "unitId",
    as: "projectionSessions",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  db.ProjectionSession.belongsTo(db.Unit, {
    foreignKey: "unitId",
    as: "unit",
  });
}

// ✅ 2️⃣ Candidate ↔ ProjectionSession
if (db.Candidate && db.ProjectionSession) {
  db.Candidate.hasMany(db.ProjectionSession, {
    foreignKey: "candidateId",
    as: "projectionSessions",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  db.ProjectionSession.belongsTo(db.Candidate, {
    foreignKey: "candidateId",
    as: "candidate",
  });
}


// ================== UNIT ↔ STAFF (via StaffLookup) ==================
if (db.Unit && db.Staff && db.StaffLookup) {
  // Unit has many StaffLookup entries
  db.Unit.hasMany(db.StaffLookup, {
    foreignKey: "unitId",
    as: "staffAssignments",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  // Staff has many StaffLookup entries
  db.Staff.hasMany(db.StaffLookup, {
    foreignKey: "staffId",
    as: "unitAssignments",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  // Many-to-Many between Unit ↔ Staff through StaffLookup
  db.Unit.belongsToMany(db.Staff, {
    through: db.StaffLookup,
    foreignKey: "unitId",
    otherKey: "staffId",
    as: "staffMembers",
  });

  db.Staff.belongsToMany(db.Unit, {
    through: db.StaffLookup,
    foreignKey: "staffId",
    otherKey: "unitId",
    as: "units",
  });

  // StaffLookup belongs to Unit and Staff
  db.StaffLookup.belongsTo(db.Unit, {
    foreignKey: "unitId",
    as: "unit",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  db.StaffLookup.belongsTo(db.Staff, {
    foreignKey: "staffId",
    as: "staff",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
}

// Candidate ↔ CandidateMarks
db.Candidate.hasMany(db.CandidateMarks, {
  foreignKey: "candidateId",
  as: "marks",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

db.CandidateMarks.belongsTo(db.Candidate, {
  foreignKey: "candidateId",
  as: "candidate",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// Unit ↔ CandidateMarks
db.Unit.hasMany(db.CandidateMarks, {
  foreignKey: "unitId",
  as: "candidateMarks",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

db.CandidateMarks.belongsTo(db.Unit, {
  foreignKey: "unitId",
  as: "unit",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});


// Candidate ↔ CandidateNeedAssessment
db.Candidate.hasMany(db.CandidateNeedAssessment, {
  foreignKey: "candidateId",
  as: "needAssessments",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

db.CandidateNeedAssessment.belongsTo(db.Candidate, {
  foreignKey: "candidateId",
  as: "candidate",
});

// Unit ↔ CandidateNeedAssessment
db.Unit.hasMany(db.CandidateNeedAssessment, {
  foreignKey: "unitId",
  as: "needAssessments",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

db.CandidateNeedAssessment.belongsTo(db.Unit, {
  foreignKey: "unitId",
  as: "unit",
});



// Unit ↔ UnitImprovement
db.Unit.hasMany(db.UnitImprovement, {
  foreignKey: "unitId",
  as: "lessons",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

db.UnitImprovement.belongsTo(db.Unit, {
  foreignKey: "unitId",
  as: "unit",
});


// ================== LeaderMarks Associations ==================
if (db.LeaderMarks) {

  // LeaderMarks ↔ Unit
  db.Unit.hasMany(db.LeaderMarks, {
    foreignKey: "unitId",
    as: "leaderMarks",
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
  });

  db.LeaderMarks.belongsTo(db.Unit, {
    foreignKey: "unitId",
    as: "unit",
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
  });

  // LeaderMarks ↔ StaffLookup (leader reference)
  db.StaffLookup.hasMany(db.LeaderMarks, {
    foreignKey: "staffLookupId",
    as: "leaderMarks",
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
  });

  db.LeaderMarks.belongsTo(db.StaffLookup, {
    foreignKey: "staffLookupId",
    as: "leaderLookup",
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
  });
}


// ================== AssessmentChain Associations ==================
if (
  db.AssessmentChain &&
  db.Unit &&
  db.Candidate &&
  db.AssessmentBlockManager
) {

  // 🔹 Unit ↔ AssessmentChain
  db.Unit.hasMany(db.AssessmentChain, {
    foreignKey: "unitId",
    as: "assessmentChains",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  db.AssessmentChain.belongsTo(db.Unit, {
    foreignKey: "unitId",
    as: "unit",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  // 🔹 Candidate ↔ AssessmentChain
  db.Candidate.hasMany(db.AssessmentChain, {
    foreignKey: "candidateId",
    as: "assessmentChains",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  db.AssessmentChain.belongsTo(db.Candidate, {
    foreignKey: "candidateId",
    as: "candidate",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  // 🔹 AssessmentBlockManager ↔ AssessmentChain (5 selections)

  db.AssessmentBlockManager.hasMany(db.AssessmentChain, {
    foreignKey: "selection1",
    as: "usedAsBlock1",
  });

  db.AssessmentBlockManager.hasMany(db.AssessmentChain, {
    foreignKey: "selection2",
    as: "usedAsBlock2",
  });

  db.AssessmentBlockManager.hasMany(db.AssessmentChain, {
    foreignKey: "selection3",
    as: "usedAsBlock3",
  });

  db.AssessmentBlockManager.hasMany(db.AssessmentChain, {
    foreignKey: "selection4",
    as: "usedAsBlock4",
  });

  db.AssessmentBlockManager.hasMany(db.AssessmentChain, {
    foreignKey: "selection5",
    as: "usedAsBlock5",
  });

  db.AssessmentChain.belongsTo(db.AssessmentBlockManager, {
    foreignKey: "selection1",
    as: "block1",
  });

  db.AssessmentChain.belongsTo(db.AssessmentBlockManager, {
    foreignKey: "selection2",
    as: "block2",
  });

  db.AssessmentChain.belongsTo(db.AssessmentBlockManager, {
    foreignKey: "selection3",
    as: "block3",
  });

  db.AssessmentChain.belongsTo(db.AssessmentBlockManager, {
    foreignKey: "selection4",
    as: "block4",
  });

  db.AssessmentChain.belongsTo(db.AssessmentBlockManager, {
    foreignKey: "selection5",
    as: "block5",
  });
}


// Capsule associations
if (db.Capsule) {
  db.Capsule.belongsTo(db.Client, { foreignKey: "clientId", as: "client" });
  db.Capsule.hasMany(db.CapsuleStaff, { foreignKey: "capsuleId", as: "staffAssignments", onDelete: "CASCADE" });
  db.CapsuleStaff.belongsTo(db.Staff, { foreignKey: "staffId", as: "staff", constraints: false });
  db.Capsule.hasMany(db.CapsuleBenchmark, { foreignKey: "capsuleId", as: "benchmarks", onDelete: "CASCADE" });
  db.Capsule.hasMany(db.CapsuleRoster, { foreignKey: "capsuleId", as: "rosters", onDelete: "CASCADE" });
  db.CapsuleRoster.belongsTo(db.Capsule, { foreignKey: "capsuleId", as: "capsule" });
  db.CapsuleRoster.belongsTo(db.Candidate, { foreignKey: "candidateId", as: "candidate" });
  db.CapsuleScore.belongsTo(db.Candidate, { foreignKey: "candidate_id", as: "candidate" });
}

// Export the db object
module.exports = db;
