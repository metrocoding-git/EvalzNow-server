const crypto = require("crypto");

module.exports = (sequelize, DataTypes) => {
  const StaffLookup = sequelize.define('StaffLookup', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    unitId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'units',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    staffId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'staff',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    roleType: {
        type: DataTypes.ENUM("Leader", "Assessor"),
        allowNull: false,
    },
  }, {
    tableName: 'staff_lookup',
    timestamps: true,
    indexes: [
        {
          unique: true,
          fields: ["unitId", "staffId", "roleType"], // ✅ allow same staff with different role
        },
    ],
  });

  StaffLookup.associate = (models) => {
    StaffLookup.belongsTo(models.Unit, {
      foreignKey: "unitId",
      as: "unit",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    
    StaffLookup.belongsTo(models.Staff, {
      foreignKey: "staffId",
      as: "staff",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return StaffLookup;
};
