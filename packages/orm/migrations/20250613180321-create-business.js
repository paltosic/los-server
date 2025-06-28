'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('businesses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      index: {
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING
      },
      entrance: {
        type: Sequelize.JSON
      },
      exit: {
        type: Sequelize.JSON
      },
      ipls: {
        type: Sequelize.JSON
      },
      buyPoint: {
        type: Sequelize.JSON
      },
      robPoint: {
        type: Sequelize.JSON
      },
      extraPoints: {
        type: Sequelize.JSON
      },
      haveEntrance: {
        type: Sequelize.BOOLEAN
      },
      haveBuyPoint: {
        type: Sequelize.BOOLEAN
      },
      haveRobPoint: {
        type: Sequelize.BOOLEAN
      },
      haveExtra: {
        type: Sequelize.BOOLEAN
      },
      owner: {
        type: Sequelize.STRING
      },
      owned: {
        type: Sequelize.BOOLEAN
      },
      price: {
        type: Sequelize.INTEGER
      },
      level: {
        type: Sequelize.INTEGER
      },
      products: {
        type: Sequelize.INTEGER
      },
      type: {
        type: Sequelize.INTEGER
      },
      safe: {
        type: Sequelize.INTEGER
      },
      blipIcon: {
        type: Sequelize.INTEGER
      },
      blipColor: {
        type: Sequelize.INTEGER
      },
      robTime: {
        type: Sequelize.INTEGER
      },
      taxes: {
        type: Sequelize.INTEGER
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('businesses');
  }
};
