module.exports = (sequelize, DataTypes) => {
  const Benchmark = sequelize.define(
    "Benchmark",
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
          model: 'units',
          key: 'id'
        }
      },
      benchmarkType: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      benchmarkRef: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      benchmarkDescription: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      tableName: "benchmarks",
      timestamps: true,
      indexes: [
        {
          unique: false,
          fields: ['unitId']
        },
        {
          unique: true,
          fields: ['unitId', 'benchmarkRef'],
          name: 'unique_benchmark_per_unit'
        }
      ]
    }
  );

  Benchmark.associate = (models) => {
    Benchmark.belongsTo(models.Unit, {
      foreignKey: "unitId",
      as: "unit",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return Benchmark;
};