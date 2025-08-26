const crypto = require("crypto");

module.exports = (sequelize, DataTypes) => {
  const Candidate = sequelize.define(
    "Candidate",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      candidateId: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true,
        defaultValue: () =>
          crypto.randomBytes(5).toString("hex").toUpperCase(),
      },
      lastName: { type: DataTypes.STRING, allowNull: false },
      firstName: { type: DataTypes.STRING, allowNull: false },
      specialIdNo: { type: DataTypes.STRING, allowNull: true },
      dateOfBirth: { type: DataTypes.DATEONLY, allowNull: false },
      startDate: { type: DataTypes.DATEONLY, allowNull: false },
      nationality: { type: DataTypes.STRING, allowNull: false },
      gender: { type: DataTypes.STRING, allowNull: false },
      ethnicity: { type: DataTypes.STRING, allowNull: true },
      income: { type: DataTypes.STRING, allowNull: true },
      religion: { type: DataTypes.STRING, allowNull: true },
      maritalStatus: { type: DataTypes.STRING, allowNull: false },
      jobType: { type: DataTypes.STRING, allowNull: true },
    },
    {
      tableName: "candidates",
      timestamps: true,
      hooks: {
        beforeCreate: (candidate) => {
          if (!candidate.candidateId) {
            candidate.candidateId = crypto
              .randomBytes(5)
              .toString("hex")
              .toUpperCase();
          }
        },
      },
    }
  );

  // ✅ Associations should all go here
  Candidate.associate = (models) => {
    Candidate.hasMany(models.Irregularity, {
      foreignKey: "candidateId",
      as: "irregularities",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    Candidate.hasMany(models.AssessmentBlockManager, {
      foreignKey: "candidate_id",  
      as: "assessmentBlocks",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    Candidate.hasMany(models.InsertScore, {
      foreignKey: "candidate_id", 
      as: "candidates",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return Candidate;
};
