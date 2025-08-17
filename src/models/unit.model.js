module.exports = (sequelize, DataTypes) => {
  const Unit = sequelize.define(
    "Unit",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      unitName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      unitId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true
        }
      },
      unitStartDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      unitEndDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      unitDirector: {
        type: DataTypes.STRING,
        allowNull: false
      },
      unitType: {
        type: DataTypes.STRING,
        allowNull: false
      },
      signatureProfile: {
        type: DataTypes.STRING,
        allowNull: true
      },
      environment: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      tableName: "units",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['unitId']
        }
      ]
    }
  );

  Unit.associate = (models) => {
    Unit.hasMany(models.Benchmark, {
      foreignKey: "unitId",
      as: "benchmarks",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return Unit;
};