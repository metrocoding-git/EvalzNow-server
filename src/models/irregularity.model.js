module.exports = (sequelize, DataTypes) => {
  const Irregularity = sequelize.define(
    "Irregularity",
    {
      id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
      },
      candidateId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'candidates',
          key: 'id'
        }
      },
      type: { 
        type: DataTypes.STRING, 
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      sequenceNumber: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        validate: {
          min: 1
        }
      },
      comments: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: "irregularities",
      timestamps: true,
      indexes: [
        {
          unique: false,
          fields: ['candidateId']
        },
        {
          unique: true,
          fields: ['candidateId', 'sequenceNumber'],
          name: 'unique_irregularity_per_candidate'
        }
      ]
    }
  );

  Irregularity.associate = (models) => {
    Irregularity.belongsTo(models.Candidate, {
      foreignKey: "candidateId",
      as: "candidate",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return Irregularity;
};