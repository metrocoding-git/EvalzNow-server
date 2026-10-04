/**
 * Server-side session revocation list.
 *  - jti row      : a single token that was logged out.
 *  - accountId row: every token for that account issued before `notBefore`
 *                   is invalid (used after password reset / "logout everywhere").
 * Rows are only needed until the token would have expired anyway (`expiresAt`).
 * The table is created automatically on startup if missing (no existing table is touched).
 */
module.exports = (sequelize, DataTypes) => {
  const AuthRevocation = sequelize.define(
    'AuthRevocation',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      jti: { type: DataTypes.STRING(64), allowNull: true, unique: true },
      accountId: { type: DataTypes.INTEGER, allowNull: true },
      notBefore: { type: DataTypes.DATE(3), allowNull: true },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
    },
    {
      tableName: 'auth_revocations',
      timestamps: true,
      indexes: [{ fields: ['accountId'] }, { fields: ['expiresAt'] }],
    }
  );
  return AuthRevocation;
};
