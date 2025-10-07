// File: packages/server/migrations/20241201000003-create-security-logs.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('security_logs', {
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
          model: 'accounts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      
      // Тип події
      type: {
        type: Sequelize.ENUM(
          'login', 
          'logout', 
          'ban', 
          'unban', 
          'warning', 
          'admin_action',
          'registration',
          'password_change',
          'suspicious_activity'
        ),
        allowNull: false
      },
      
      // Деталі
      details: {
        type: Sequelize.STRING(1000),
        allowNull: false
      },
      
      // Адміністратор (якщо застосовно)
      adminName: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      
      // IP адреса
      ip: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      
      // Додаткові дані (JSON)
      metadata: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Додаткові дані у форматі JSON'
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
    await queryInterface.addIndex('security_logs', ['accountId'], {
      name: 'idx_security_logs_account_id'
    });
    
    await queryInterface.addIndex('security_logs', ['type'], {
      name: 'idx_security_logs_type'
    });
    
    await queryInterface.addIndex('security_logs', ['createdAt'], {
      name: 'idx_security_logs_created_at'
    });
    
    await queryInterface.addIndex('security_logs', ['ip'], {
      name: 'idx_security_logs_ip'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('security_logs');
  }
};