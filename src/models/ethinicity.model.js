const crypto = require("crypto");

module.exports = (sequelize, DataTypes) => {
  const Ethinicity = sequelize.define('Ethinicity', {
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
    tableName: 'ethinicity',
    timestamps: true,
    
  });

  Ethinicity.associate = (models) => {
    Ethinicity.belongsTo(models.Client, {
      foreignKey: "clientId",
      as: "client",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };


  return Ethinicity;
};
