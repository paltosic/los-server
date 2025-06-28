'use strict';
const {
  Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
  class House extends Model {
    static associate(models) {
      // define association here if needed
    }
  }
  House.init({
    index: DataTypes.INTEGER,
    entrance: DataTypes.JSON,
    exit: DataTypes.JSON,
    level: DataTypes.INTEGER,
    locked: DataTypes.INTEGER,
    owned: DataTypes.BOOLEAN,
    owner: DataTypes.STRING,
    price: DataTypes.INTEGER,
    rentable: DataTypes.BOOLEAN,
    rentPrice: DataTypes.INTEGER,
    safe: DataTypes.INTEGER,
    taxes: DataTypes.INTEGER,
    upgradeLevel: DataTypes.INTEGER,
    __v: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'House',
    tableName: 'houses',
    timestamps: false
  });
  return House;
};
