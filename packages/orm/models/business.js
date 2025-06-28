'use strict';
const {
  Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
  class Business extends Model {
    static associate(models) {
      // define association here if needed
    }
  }
  Business.init({
    index: DataTypes.INTEGER,
    title: DataTypes.STRING,
    entrance: DataTypes.JSON,
    exit: DataTypes.JSON,
    ipls: DataTypes.JSON,
    buyPoint: DataTypes.JSON,
    robPoint: DataTypes.JSON,
    extraPoints: DataTypes.JSON,
    haveEntrance: DataTypes.BOOLEAN,
    haveBuyPoint: DataTypes.BOOLEAN,
    haveRobPoint: DataTypes.BOOLEAN,
    haveExtra: DataTypes.BOOLEAN,
    owner: DataTypes.STRING,
    owned: DataTypes.BOOLEAN,
    price: DataTypes.INTEGER,
    level: DataTypes.INTEGER,
    products: DataTypes.INTEGER,
    type: DataTypes.INTEGER,
    safe: DataTypes.INTEGER,
    blipIcon: DataTypes.INTEGER,
    blipColor: DataTypes.INTEGER,
    robTime: DataTypes.INTEGER,
    taxes: DataTypes.INTEGER,
    message: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Business',
    tableName: 'businesses',
    timestamps: false
  });
  return Business;
};
