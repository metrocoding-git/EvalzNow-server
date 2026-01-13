module.exports = (sequelize, DataTypes) => {
    const CandidateMarks = sequelize.define(
      "CandidateMarks",
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
  
        entryNumber: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
  
        impactType: {
          type: DataTypes.ENUM("Positive", "Negative"),
          allowNull: false
        },
  
        concernIdentified: {
          type: DataTypes.STRING,
          allowNull: false
        },
  
        identityDate: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
  
        concernResolved: {
          type: DataTypes.ENUM("Yes", "No"),
          allowNull: false,
          defaultValue: "No"
        },
  
        resolutionDate: {
          type: DataTypes.DATEONLY,
          allowNull: true
        },
  
        // Foreign Keys
        unitId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "units",
            key: "id"
          },
          onDelete: "CASCADE",
          onUpdate: "CASCADE"
        },
  
        candidateId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "candidates",
            key: "id"
          },
          onDelete: "CASCADE",
          onUpdate: "CASCADE"
        }
      },
      {
        tableName: "candidateMarks",
        timestamps: true
      }
    );
  
    // Associations
    CandidateMarks.associate = (models) => {
      CandidateMarks.belongsTo(models.Candidate, {
        foreignKey: "candidateId",
        as: "candidate",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
      });
  
      CandidateMarks.belongsTo(models.Unit, {
        foreignKey: "unitId",
        as: "unit",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
      });
    };
  
    return CandidateMarks;
  };
  