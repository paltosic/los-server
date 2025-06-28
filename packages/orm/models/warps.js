'use strict';
const {
  Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
  class Warp extends Model {
    static associate(models) {
      // define association here if needed
    }
  }
  Warp.init({
    position: DataTypes.JSON,
    title: DataTypes.STRING,
    __v: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Warp',
    tableName: 'warps',
    timestamps: false
  });
  return Warp;
};
