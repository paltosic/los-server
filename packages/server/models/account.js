'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Account extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Account.init({
    login: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'username'
    },
    password: {
      type: DataTypes.STRING(256),
      allowNull: false,
    },
    level: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '1',
    }
  }, {
    sequelize,
    modelName: 'Account',
  });
  return Account;
};
