const crypto = require("crypto");

module.exports = (sequelize, DataTypes) => {
  const ScoringCriteria = sequelize.define(
    "ScoringCriteria",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      criteriaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      unitId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "units", // Reference to Unit
          key: "id",
        },
      },
      criteria: {
        type: DataTypes.STRING,
        allowNull: false,
      },
     
    },
    {
      tableName: "criteria",
      timestamps: true,
    }
  );

  ScoringCriteria.associate = function (models) {
    InsertScore.belongsTo(models.Unit, {
      foreignKey: "unitId",
      as: "unit",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    ScoringCriteria.hasMany(models.InsertScoreCriteria, {
      foreignKey: "scoringCriteriaId",
      as: "scores",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    };


  return ScoringCriteria;
};
