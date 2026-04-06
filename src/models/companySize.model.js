module.exports = (sequelize, DataTypes) => {
    const CompanySize = sequelize.define('CompanySize', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      tier: {  // Tier name
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      size: {  // Size description
        type: DataTypes.STRING,
        allowNull: false
      },
      candidate: {  // Number of candidates
        type: DataTypes.STRING,
        allowNull: false
      }
    }, {
      tableName: 'company_sizes',
      timestamps: false
    });
  
    return CompanySize;
  };
  