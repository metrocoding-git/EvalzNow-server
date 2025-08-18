module.exports = (sequelize, DataTypes) => {
    const UnitRoster = sequelize.define(
      "UnitRoster",
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
  
        // Candidate foreign key
        candidateId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: sequelize.models.Candidate, key: "id" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
          unitId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: sequelize.models.Unit, key: "id" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
  
        // Outcome with default 'Ongoing'
        unitOutcome: {
          type: DataTypes.ENUM("Pass", "Fail", "Ongoing"),
          allowNull: false,
          defaultValue: "Ongoing",
        },
  
        presentCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        excusedAbsences: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        unexcusedAbsences: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        excusedTardies: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        unexcusedTardies: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
  
        // Virtual field → Total tally
        totalTally: {
          type: DataTypes.VIRTUAL,
          get() {
            return (
              (this.getDataValue("presentCount") || 0) +
              (this.getDataValue("excusedAbsences") || 0) +
              (this.getDataValue("unexcusedAbsences") || 0) +
              (this.getDataValue("excusedTardies") || 0) +
              (this.getDataValue("unexcusedTardies") || 0)
            );
          },
        },
      },
      {
        tableName: "unit_rosters",
        timestamps: true,
        indexes: [
          {
            unique: true,
            fields: ["candidateId", "unitId"], // Prevent duplicates
          },
        ],
      }
    );
  
    UnitRoster.associate = (models) => {
      // Each roster belongs to a candidate
      UnitRoster.belongsTo(models.Candidate, {
        foreignKey: "candidateId",
        as: "candidate",
      });
  
      // Each roster belongs to a unit
      UnitRoster.belongsTo(models.Unit, {
        foreignKey: "unitId",
        as: "unit",
      });
    };
  
    return UnitRoster;
  };
  