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



// Export the db object
module.exports = db;
