const crypto = require("crypto");

module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define('Client', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    executiveId: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      defaultValue: () => crypto.randomBytes(5).toString("hex").toUpperCase()
    },
    lastName: { type: DataTypes.STRING, allowNull: false },
    firstName: { type: DataTypes.STRING, allowNull: false },
    jobTitle: { type: DataTypes.STRING, allowNull: false },
    emailAddress: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    companyName: { type: DataTypes.STRING, allowNull: false },
    companyContactNumber: { type: DataTypes.STRING, allowNull: true },
    institutionalType: { type: DataTypes.STRING, allowNull: true },
    businessRegistrationNo: { type: DataTypes.STRING, allowNull: true },
    country: { type: DataTypes.STRING, allowNull: true },
    companySizeId: { // Foreign key to CompanySize table
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'company_sizes',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    status: {
      type: DataTypes.ENUM("Activate", "Deactivate"),
      defaultValue: "Activate"
    }
  }, {
    tableName: 'clients',
    timestamps: true,
    hooks: {
      beforeCreate: (exec) => {
        if (!exec.executiveId) {
          exec.executiveId = crypto.randomBytes(5).toString("hex").toUpperCase();
        }
      }
    }
  });

  Client.associate = (models) => {
    Client.belongsTo(models.CompanySize, { foreignKey: 'companySizeId', as: 'companySize' });
  };

  return Client;
};
