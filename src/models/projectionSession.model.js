const crypto = require("crypto");

module.exports = (sequelize, DataTypes) => {
  const ProjectionSession = sequelize.define(
    "ProjectionSession",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      unitId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "units", // Reference to Unit
          key: "id",
        },
      },
      candidateId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "candidates", // Reference to candidate
          key: "id",
        },
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "projection_sessions",
      timestamps: true,
    }
  );

  // Associations
  ProjectionSession.associate = function (models) {

    ProjectionSession.belongsTo(models.Unit, {
      foreignKey: "unitId",
      as: "unit",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    ProjectionSession.belongsTo(models.Candidate, {
      foreignKey: "candidateId",
      as: "candidate",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    ProjectionSession.hasMany(models.ProjectionPoint, {
        foreignKey: "sessionId",
        as: "points",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
  };

  return ProjectionSession;
};
