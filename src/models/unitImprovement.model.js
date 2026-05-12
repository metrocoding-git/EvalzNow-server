module.exports = (sequelize, DataTypes) => {
    const UnitImprovement = sequelize.define(
      "UnitImprovement",
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
        lesson: {
            type: DataTypes.STRING(500),
            allowNull: false
          },
      },
      {
        tableName: "unit_improvements",
        timestamps: true
      }
    );
  
    // Associations
    UnitImprovement.associate = (models) => {
  
        UnitImprovement.belongsTo(models.Unit, {
        foreignKey: "unitId",
        as: "unit",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
  
    };
  
    return UnitImprovement;
  };
  