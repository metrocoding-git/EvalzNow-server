const crypto = require("crypto");
const { ppid } = require("process");

module.exports = (sequelize, DataTypes) => {
  const ProjectionPoint = sequelize.define(
    "ProjectionPoint",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      sessionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "projection_sessions", // Reference to projection session
          key: "id",
        },
      },
      ppId: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      callout: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      RRN: {
        type: DataTypes.DECIMAL(10,3),
        allowNull: true,
      },
      PRN: {
        type: DataTypes.DECIMAL(10,3),
        allowNull: true,
      },
      ARN: {
        type: DataTypes.DECIMAL(10,3),
        allowNull: true,
      },
      IC: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      deltaRRN: {
        type: DataTypes.DECIMAL(10,3),
        allowNull: true,
      },
      deltaPRN: {
        type: DataTypes.DECIMAL(10,3),
        allowNull: true,
      },
      deltaARN: {
        type: DataTypes.DECIMAL(10,3),
        allowNull: true,
      },
      dayCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
      tableName: "projection_points",
      timestamps: true,
    }
  );

  // Associations
  ProjectionPoint.associate = function (models) {

    ProjectionPoint.belongsTo(models.ProjectionSession, {
      foreignKey: "sessionId",
      as: "session",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    

  };

  return ProjectionPoint;
};
