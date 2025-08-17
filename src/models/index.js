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




// Export the db object
module.exports = db;
