'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('houses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      index: {
        type: Sequelize.INTEGER
      },
      entrance: {
        type: Sequelize.JSON
      },
      exit: {
        type: Sequelize.JSON
      },
      level: {
        type: Sequelize.INTEGER
      },
      locked: {
        type: Sequelize.INTEGER
      },
      owned: {
        type: Sequelize.BOOLEAN
      },
      owner: {
        type: Sequelize.STRING
      },
      price: {
        type: Sequelize.INTEGER
      },
      rentable: {
        type: Sequelize.BOOLEAN
      },
      rentPrice: {
        type: Sequelize.INTEGER
      },
      safe: {
        type: Sequelize.INTEGER
      },
      taxes: {
        type: Sequelize.INTEGER
      },
      upgradeLevel: {
        type: Sequelize.INTEGER
      },
      __v: {
        type: Sequelize.INTEGER
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('houses');
  }
};
