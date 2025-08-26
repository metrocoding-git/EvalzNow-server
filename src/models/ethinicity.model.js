const crypto = require("crypto");

module.exports = (sequelize, DataTypes) => {
  const Ethinicity = sequelize.define('Ethinicity', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: { type: DataTypes.STRING, allowNull: false },
    
  }, {
    tableName: 'ethinicity',
    timestamps: true,
    
  });


  return Ethinicity;
};
