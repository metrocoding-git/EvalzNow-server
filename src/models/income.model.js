const crypto = require("crypto");

module.exports = (sequelize, DataTypes) => {
  const Income = sequelize.define('Income', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: { type: DataTypes.STRING, allowNull: false },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clients',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    }
  }, {
    tableName: 'income',
    timestamps: true,
    
  });

  Income.associate = (models) => {
    Income.belongsTo(models.Client, {
      foreignKey: "clientId",
      as: "client",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };


  return Income;
};
