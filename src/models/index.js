const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
// db.User = require('./user.model')(sequelize, Sequelize);
db.Client = require('./client.model')(sequelize, Sequelize);
db.CompanySize = require('./companySize.model')(sequelize, Sequelize);

// Define associations
if (db.Client && db.CompanySize) {
  db.Client.belongsTo(db.CompanySize, { foreignKey: 'companySizeId', as: 'companySize' });
}

// Export the db object
module.exports = db;
