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
      },
      XEP: { type: DataTypes.DECIMAL(6, 3), allowNull: true },
      XRR: { type: DataTypes.DECIMAL(6, 3), allowNull: true },
      XLR: { type: DataTypes.DECIMAL(6, 3), allowNull: true },
      XSR: { type: DataTypes.DECIMAL(6, 3), allowNull: true },
      XWR: { type: DataTypes.DECIMAL(6, 3), allowNull: true },
      XCP: { type: DataTypes.DECIMAL(6, 3), allowNull: true },
      XBP: { type: DataTypes.DECIMAL(6, 3), allowNull: true },
      MSIP: { type: DataTypes.DECIMAL(6, 3), allowNull: true },
      ΔRRN: { type: DataTypes.DECIMAL(6, 3), allowNull: true },
      ΔPRN: { type: DataTypes.DECIMAL(6, 3), allowNull: true },
      ΔARN: { type: DataTypes.DECIMAL(6, 3), allowNull: true },
      ΔGEQ: { type: DataTypes.DECIMAL(6, 3), allowNull: true },
      IC: { type: DataTypes.DECIMAL(6, 3), allowNull: true },
      XTR: { type: DataTypes.DECIMAL(6, 3), allowNull: true },
      XPR: { type: DataTypes.DECIMAL(6, 3), allowNull: true },
      XRVSR: { type: DataTypes.DECIMAL(6, 3), allowNull: true },
      XPVSR: { type: DataTypes.DECIMAL(6, 3), allowNull: true },
      XAVSR: { type: DataTypes.DECIMAL(6, 3), allowNull: true },
      scoringSystem: {
        type: DataTypes.ENUM("3-Point", "5-Point"),
        allowNull: true,
        defaultValue: "3-Point",
      },
      accountId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'accounts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'clients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }
    },
    {
      tableName: "units",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['clientId', 'unitId'], // Composite uniqueness
        },
      ],      
    }
  );

  Unit.associate = (models) => {
    Unit.hasMany(models.Benchmark, {
      foreignKey: "unitId",
      as: "benchmarks",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    Unit.hasMany(models.AssessmentBlockManager, {
      foreignKey: "unitId",
      as: "assessmentBlocks",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    Unit.hasMany(models.InsertScore, {
      foreignKey: "unitId",
      as: "insertScores",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    Unit.hasMany(models.ScoringCriteria, {
      foreignKey: "unitId",
      as: "scoringCriteria",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    Unit.belongsTo(models.Account, {
      foreignKey: "accountId",
      as: "account",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    Unit.belongsTo(models.Client, {
      foreignKey: "clientId",
      as: "client",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });


    Unit.hasMany(models.StaffLookup, {
      foreignKey: "unitId",
      as: "staffAssignments",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    Unit.belongsToMany(models.Staff, {
      through: models.StaffLookup,
      foreignKey: "unitId",
      otherKey: "staffId",
      as: "staffMembers",
    });


    Unit.hasMany(models.ProjectionSession, {
      foreignKey: "sessionId",
      as: "session",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  
  return Unit;
};