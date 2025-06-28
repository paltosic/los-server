'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('databoxes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      data: {
        type: Sequelize.JSON
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('databoxes');
  }
};
