module.exports = (sequelize, DataTypes) => {
    const LeaderMarks = sequelize.define(
      "LeaderMarks",
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
  
        entryNumber: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
  
        impactType: {
          type: DataTypes.ENUM("Positive", "Negative"),
          allowNull: false
        },
  
        concernIdentified: {
          type: DataTypes.STRING,
          allowNull: false
        },
  
        identityDate: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
  
        concernResolved: {
          type: DataTypes.ENUM("Yes", "No"),
          allowNull: false,
          defaultValue: "No"
        },
  
        resolutionDate: {
          type: DataTypes.DATEONLY,
          allowNull: true
        },
  
        // ============================
        // NEW: Reference to StaffLookup
        // ============================
        staffLookupId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "staff_lookup",
            key: "id"
          },
          onDelete: "CASCADE",
          onUpdate: "CASCADE"
        },
  
        // Keep these as requested
        unitId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: "units", key: "id" },
          onDelete: "CASCADE",
          onUpdate: "CASCADE"
        },
  
      },
      {
        tableName: "leader_marks",
        timestamps: true
      }
    );
  
    LeaderMarks.associate = (models) => {
      LeaderMarks.belongsTo(models.Unit, {
        foreignKey: "unitId",
        as: "unit"
      });
  
      LeaderMarks.belongsTo(models.StaffLookup, {
        foreignKey: "staffLookupId",
        as: "leaderLookup"
      });
  
      // StaffLookup → Staff to expose leader first/last name
     
    };
  
    return LeaderMarks;
  };
  