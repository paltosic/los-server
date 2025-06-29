// File: packages/server/migrations/20241201000002-create-bans.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bans', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      
      // Зв'язок з акаунтом
      accountId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'enhanced_accounts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      
      // Інформація про бан
      reason: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      bannedBy: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      bannedDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      
      // Термін бану
      timeLeft: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Години'
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      permanent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      appealable: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      
      // Статус
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      
      // Розбан
      unbannedBy: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      unbannedDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      unbanReason: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      
      // Timestamps
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Додати індекси
    await queryInterface.addIndex('bans', ['accountId'], {
      name: 'idx_bans_account_id'
    });
    
    await queryInterface.addIndex('bans', ['active'], {
      name: 'idx_bans_active'
    });
    
    await queryInterface.addIndex('bans', ['expiresAt'], {
      name: 'idx_bans_expires_at'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('bans');
  }
};