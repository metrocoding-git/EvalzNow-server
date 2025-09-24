module.exports = (sequelize, DataTypes) => {
  const Benchmark = sequelize.define(
    "Benchmark",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      benchmarkId: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
        validate: { notEmpty: true }
      },
      benchmarkRef: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true }
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
          unique: false, // multiple benchmarks can share the same ref
          fields: ['unitId']
        },
        {
          unique: true, // only benchmarkId per unit must be unique
          fields: ['unitId', 'benchmarkId'],
          name: 'unique_benchmarkId_per_unit'
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
