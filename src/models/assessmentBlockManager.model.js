const crypto = require("crypto");

module.exports = (sequelize, DataTypes) => {
  const AssessmentBlockManager = sequelize.define(
    "AssessmentBlockManager",
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
          model: 'units', // Reference to your units table
          key: 'id'
        }
      },
      candidate_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'candidates', // Reference to your units table
          key: 'id'
        }
      },
      manageType: {
        type: DataTypes.ENUM("Indirect","Direct"),
        allowNull: false,
      },
      ppId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      periodType: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      shortDescription: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      delivery: {
        type: DataTypes.STRING(100),
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
      }
    },
    {
      tableName: "assessment_block_manager",
      timestamps: true,
    }
  );

  // Associations
  AssessmentBlockManager.associate = function(models) {
    AssessmentBlockManager.belongsTo(models.Unit, {
      foreignKey: 'unitId',
      as: 'unit'
    });

    AssessmentBlockManager.belongsTo(models.Candidate, {
      foreignKey: "candidate_id", // FK column
      as: "candidate",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    AssessmentBlockManager.hasMany(models.InsertScore, {
      foreignKey: "assessmentBlockId",
      as: "insertScores",
      hooks: true 
    });
    

  };

  AssessmentBlockManager.addHook("afterUpdate", async (block, options) => {
    if (block.changed("ppId")) {
      const { ppId, id } = block;
      const { transaction } = options;
  
      // Update all InsertScores linked to this block
      await sequelize.models.InsertScore.update(
        { ppId },
        {
          where: { assessmentBlockId: id },
          transaction,
        }
      );
    }
  });
  

  return AssessmentBlockManager;
};