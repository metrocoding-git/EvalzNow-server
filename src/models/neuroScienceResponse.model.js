module.exports = (sequelize, DataTypes) => {
    const NeuroScienceResponse = sequelize.define(
      "NeuroScienceResponse",
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
            model: "neuro_science_sessions",
            key: "id",
          },
          onDelete: "CASCADE",
        },
  
        lobe: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
  
        functionName: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
  
        value: {
          type: DataTypes.ENUM("Yes", "No"),
          allowNull: false,
        },
      },
      {
        tableName: "neuro_science_responses",
        timestamps: true,
      }
    );
  
    NeuroScienceResponse.associate = (models) => {
        NeuroScienceResponse.belongsTo(models.NeuroScienceSession, {
          foreignKey: "sessionId",
          as: "session",
          onDelete: "CASCADE",
        });
    };      
  
    return NeuroScienceResponse;
  };
  