/**
 * Effectivity object of one candidate at one performance point (PP ID):
 * Type / Gap / Segment / Context / Purpose drop-down values.
 * The 10 effectivity parameters are always calculated from the PP's RRN/PRN/ARN,
 * so they are not stored.
 */
module.exports = (sequelize, DataTypes) => {
  const EffectivityResponse = sequelize.define(
    "EffectivityResponse",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      unitId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "units", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      candidateId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "candidates", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      ppId: { type: DataTypes.INTEGER, allowNull: false },
      effectivityType: { type: DataTypes.STRING(60), allowNull: true },
      effectivityGap: { type: DataTypes.STRING(60), allowNull: true },
      effectivitySegment: { type: DataTypes.STRING(60), allowNull: true },
      effectivityContext: { type: DataTypes.STRING(60), allowNull: true },
      effectivityPurpose: { type: DataTypes.STRING(60), allowNull: true },
    },
    {
      tableName: "effectivity_responses",
      timestamps: true,
      indexes: [
        { unique: true, fields: ["unitId", "candidateId", "ppId"], name: "uq_effectivity_unit_cand_pp" },
      ],
    }
  );
  return EffectivityResponse;
};
