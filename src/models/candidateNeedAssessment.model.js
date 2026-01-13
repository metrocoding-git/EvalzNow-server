module.exports = (sequelize, DataTypes) => {
    const CandidateNeedAssessment = sequelize.define(
      "CandidateNeedAssessment",
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
  
        
        ppId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            isInt: true,
          }
        },
  
        //  Stores multiple benchmark IDs as JSON array
        benchmarkIds: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: []
        },

        bIds: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: []
        },
  
        observation: {
          type: DataTypes.STRING(500),
          allowNull: true
        }
      },
      {
        tableName: "candidate_need_assessments",
        timestamps: true
      }
    );
  
    // Associations
    CandidateNeedAssessment.associate = (models) => {
  
      CandidateNeedAssessment.belongsTo(models.Unit, {
        foreignKey: "unitId",
        as: "unit",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
  
      CandidateNeedAssessment.belongsTo(models.Candidate, {
        foreignKey: "candidateId",
        as: "candidate",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    };
  
    return CandidateNeedAssessment;
  };
  