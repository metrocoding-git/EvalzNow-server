const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
// db.User = require('./user.model')(sequelize, Sequelize);
// db.Post = require('./post.model')(sequelize, Sequelize);

// Relations
// db.User.hasMany(db.Post, { foreignKey: 'userId' });
// db.Post.belongsTo(db.User, { foreignKey: 'userId' });

module.exports = db;
