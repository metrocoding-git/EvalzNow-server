module.exports = (sequelize, DataTypes) => {
  const NeuroScienceSession = sequelize.define(
    "NeuroScienceSession",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      unitId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "units", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

      candidateId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "candidates", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

      assessmentBlockId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "assessment_block_manager", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

      ppId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "neuro_science_sessions",
      timestamps: true,
    }
  );

  NeuroScienceSession.associate = (models) => {
    NeuroScienceSession.belongsTo(models.Unit, { as: "unit" });
    NeuroScienceSession.belongsTo(models.Candidate, { as: "candidate" });
    NeuroScienceSession.belongsTo(models.AssessmentBlockManager, {
      as: "assessmentBlock",
    });

    NeuroScienceSession.hasMany(models.NeuroScienceResponse, {
      foreignKey: "sessionId",
      as: "responses",
      onDelete: "CASCADE",
    });
  };
  

  return NeuroScienceSession;
};
