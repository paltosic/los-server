'use strict';
const {
  Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
  class Gps extends Model {
    static associate(models) {
      // define association here if needed
    }
  }
  Gps.init({
    position: DataTypes.JSON,
    title: DataTypes.STRING,
    __v: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Gps',
    tableName: 'gps',
    timestamps: false
  });
  return Gps;
};
