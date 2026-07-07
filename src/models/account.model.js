const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

module.exports = (sequelize, DataTypes) => {
    const Account = sequelize.define('Account', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      username: { type: DataTypes.STRING(100), allowNull: false, unique: true},
      password: { type: DataTypes.STRING(100), allowNull: false},
      acc_id: { type: DataTypes.INTEGER, allowNull: false},
      role: { type: DataTypes.ENUM("super admin", "admin", "staff"), allowNull: false},
      resetToken: { type: DataTypes.STRING, allowNull: true },
      resetTokenExpiry: { type: DataTypes.DATE, allowNull: true },
    }, {
      tableName: 'accounts',
      timestamps: true,
      hooks: {
        beforeCreate: async (account) => {
          if (account.password) {
            const salt = await bcrypt.genSalt(10);
            account.password = await bcrypt.hash(account.password, salt);
          }
        },
      },
    });

    Account.associate = (models) => {
        Account.hasMany(models.Client, {
          foreignKey: "accountId",
          as: "clients",
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
        });

        Account.hasMany(models.Staff, {
          foreignKey: "accountId",
          as: "staffs",
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
        });

        Account.hasMany(models.Candidate, {
          foreignKey: "accountId",
          as: "candidates",
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
        });

        Account.hasMany(models.Unit, {
          foreignKey: "accountId",
          as: "candidates",
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
        });
    };
      
    return Account;
  };
  