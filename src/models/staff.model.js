const crypto = require("crypto");

module.exports = (sequelize, DataTypes) => {
  const Staff = sequelize.define(
    "Staff",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      staffId: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true,
        defaultValue: () => crypto.randomBytes(5).toString("hex").toUpperCase(),
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      jobTitle: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      department: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      dateOfEmployment: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      contactNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      emailAddress: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      accessLevel: {
        type: DataTypes.ENUM("Full Access", "Leaders Access"),
        allowNull: false,
        defaultValue: "Leaders Access",
      },
      accountStatus: {
        type: DataTypes.ENUM("Enabled", "Disabled"),
        allowNull: false,
        defaultValue: "Enabled",
      },
    },
    {
      tableName: "staff",
      timestamps: true,
      hooks: {
        beforeCreate: (staff) => {
          if (!staff.staffId) {
            staff.staffId = crypto.randomBytes(5).toString("hex").toUpperCase();
          }
        },
      },
    }
  );

  return Staff;
};
