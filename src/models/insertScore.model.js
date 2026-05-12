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
        onDelete: "CASCADE",   // important at DB level
        onUpdate: "CASCADE"
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
      subPpId: {
        type: DataTypes.INTEGER, 
        allowNull: false,
      },
      durationHrs: {
        type: DataTypes.DECIMAL(10, 2), // storing hours as integer
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
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      maxScore: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },

      // Main criteria mc1 - mc20
      mc1: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      mc2: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      mc3: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      mc4: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      mc5: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      mc6: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      mc7: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      mc8: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      mc9: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      mc10: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      mc11: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      mc12: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      mc13: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      mc14: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      mc15: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      mc16: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      mc17: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      mc18: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      mc19: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      mc20: { type: DataTypes.DECIMAL(10, 2), allowNull: true },

      // Custom criteria cc1 - cc20
      // cc1: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      // cc2: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      // cc3: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      // cc4: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      // cc5: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      // cc6: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      // cc7: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      // cc8: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      // cc9: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      // cc10: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      // cc11: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      // cc12: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      // cc13: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      // cc14: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      // cc15: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      // cc16: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      // cc17: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      // cc18: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      // cc19: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      // cc20: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      
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

    InsertScore.hasMany(models.InsertScoreCriteria, {
      foreignKey: "insertScoreId",
      as: "customCriteria",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return InsertScore;
};
