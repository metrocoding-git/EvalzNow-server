module.exports = (sequelize, DataTypes) => {
    const AssessmentChain = sequelize.define(
      "AssessmentChain",
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
  
        unitId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "units",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
  
        candidateId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "candidates",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
  
        
        selection1: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "assessment_block_manager",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },

        selection2: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "assessment_block_manager",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
        selection3: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "assessment_block_manager",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
        selection4: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "assessment_block_manager",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
        selection5: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "assessment_block_manager",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
      },
      {
        tableName: "assessment_chains",
        timestamps: true
      }
    );
  
    // Associations
    AssessmentChain.associate = (models) => {
  
        AssessmentChain.belongsTo(models.Unit, {
            foreignKey: "unitId",
            as: "unit",
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        });

        AssessmentChain.belongsTo(models.Candidate, {
            foreignKey: "candidateId",
            as: "candidate",
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        });

      
        AssessmentChain.belongsTo(models.AssessmentBlockManager, {
            foreignKey: "selection1",
            as: "block1",
        });
        
        AssessmentChain.belongsTo(models.AssessmentBlockManager, {
            foreignKey: "selection2",
            as: "block2",
        });
        
        AssessmentChain.belongsTo(models.AssessmentBlockManager, {
            foreignKey: "selection3",
            as: "block3",
        });
        
        AssessmentChain.belongsTo(models.AssessmentBlockManager, {
            foreignKey: "selection4",
            as: "block4",
        });
        
        AssessmentChain.belongsTo(models.AssessmentBlockManager, {
            foreignKey: "selection5",
            as: "block5",
        });
    };
  
    return AssessmentChain;
  };
  