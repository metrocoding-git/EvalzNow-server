module.exports = (sequelize, DataTypes) => {
    const InsertScoreCriteria = sequelize.define(
      "InsertScoreCriteria",
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
  
        insertScoreId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "insert_scores",
            key: "id",
          },
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
        },
  
        scoringCriteriaId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "criteria",
            key: "id",
          },
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
        },
  
        value: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
        },
      },
      {
        tableName: "insert_score_criteria",
        timestamps: true,
      }
    );
  
    InsertScoreCriteria.associate = function (models) {
      InsertScoreCriteria.belongsTo(models.InsertScore, {
        foreignKey: "insertScoreId",
        as: "insertScore",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
  
      InsertScoreCriteria.belongsTo(models.ScoringCriteria, {
        foreignKey: "scoringCriteriaId",
        as: "criteria",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    };
  
    return InsertScoreCriteria;
  };