module.exports = (sequelize, DataTypes) => {
    const Account = sequelize.define('Account', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(100), allowNull: false },
    }, {
      tableName: 'accounts',
      timestamps: true
    });

    Account.associate = (models) => {
        Account.hasMany(models.Client, {
          foreignKey: "accountId",
          as: "clients",
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
        });
    };
      
  
    return Account;
  };
  