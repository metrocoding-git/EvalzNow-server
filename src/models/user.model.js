module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(100), unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false }
  }, {
    tableName: 'users',
    timestamps: true
  });

  return User;
};
