const crypto = require("crypto");

module.exports = (sequelize, DataTypes) => {
  const Income = sequelize.define('Income', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: { type: DataTypes.STRING, allowNull: false },
    
  }, {
    tableName: 'income',
    timestamps: true,
    
  });


  return Income;
};
