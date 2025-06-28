'use strict';
const {
  Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
  class Databox extends Model {
    static associate(models) {
      // define association here if needed
    }
  }
  Databox.init({
    data: DataTypes.JSON
  }, {
    sequelize,
    modelName: 'Databox',
    tableName: 'databoxes',
    timestamps: false
  });
  return Databox;
};
