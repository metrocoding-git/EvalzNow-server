const crypto = require("crypto");

module.exports = (sequelize, DataTypes) => {
  const InsertScore = sequelize.define(
    "InsertScore",
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
      assessmentBlockId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "assessment_block_manager", // Reference to AssessmentBlockManager
          key: "id",
        },
      },
      candidate_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "candidates", // Reference to candidate
          key: "id",
        },
      },
      ppId: {
        type: DataTypes.INTEGER, 
        allowNull: false,
      },
      durationHrs: {
        type: DataTypes.INTEGER, // storing hours as integer
        allowNull: true,
      },
      criticalRefDate: {
        type: DataTypes.DATE, // storing as proper DATE
        allowNull: true,
      },
      remarks: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      
      workflowStage: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      assessmentType: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      scheduleImpact: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      engageLevel: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      competency: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      attainedScore: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      maxScore: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
      tableName: "insert_scores",
      timestamps: true,
    }
  );

  // Associations
  InsertScore.associate = function (models) {
    InsertScore.belongsTo(models.AssessmentBlockManager, {
      foreignKey: "assessmentBlockId",
      as: "assessmentBlock",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    InsertScore.belongsTo(models.Unit, {
      foreignKey: "unitId",
      as: "unit",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    InsertScore.belongsTo(models.Candidate, {
      foreignKey: "candidate_id",
      as: "candidate",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return InsertScore;
};
