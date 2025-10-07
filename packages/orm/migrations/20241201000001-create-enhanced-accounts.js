// File: packages/server/migrations/20241201000001-create-enhanced-accounts.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('accounts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      
      // Основна інформація акаунта
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      
      // Дати
      registered: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      lastConnected: {
        type: Sequelize.DATE,
        allowNull: true
      },
      lastDisconnected: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      // Ігрова інформація
      level: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false
      },
      wallet: {
        type: Sequelize.INTEGER,
        defaultValue: 1000,
        allowNull: false
      },
      bank: {
        type: Sequelize.INTEGER,
        defaultValue: 75000,
        allowNull: false
      },
      respect: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      hoursPlayed: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      
      // Адміністрація
      admin: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      warns: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      muted: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      
      // Фракція
      member: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      leader: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      rank: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      fwarns: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      fJoined: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      // Налаштування спавну
      spawn: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      houseSpawn: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      
      // Ігрова статистика
      prisonTime: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      wantedLevel: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      paycheck: {
        type: Sequelize.INTEGER,
        defaultValue: 500,
        allowNull: false
      },
      
      // Преміум
      premium: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      personalSlots: {
        type: Sequelize.INTEGER,
        defaultValue: 3,
        allowNull: false
      },
      
      // Ліцензії
      drivingLicense: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      weaponLicense: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      
      // Персонаж (JSON)
      character: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON з даними персонажа'
      },
      
      // Інвентар (JSON)
      inventory: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON з предметами інвентаря'
      },
      
      // Позиція маркера
      markPositionX: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      markPositionY: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      markPositionZ: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      
      // Безпека та відстеження
      ip: {
        type: Sequelize.STRING(45),
        allowNull: false
      },
      socialClub: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      serial: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      
      // Статистика підключень
      totalConnections: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      totalPlaytime: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Хвилини'
      },
      firstConnection: {
        type: Sequelize.DATE,
        allowNull: true
      },
      averageSessionLength: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Хвилини'
      },
      longestSession: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Хвилини'
      },
      
      // Статус онлайн
      online: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
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

    // Додати індекси для кращої продуктивності
    await queryInterface.addIndex('accounts', ['username'], {
      name: 'idx_username',
      unique: true
    });
    
    await queryInterface.addIndex('accounts', ['ip'], {
      name: 'idx_ip'
    });
    
    await queryInterface.addIndex('accounts', ['admin'], {
      name: 'idx_admin'
    });
    
    await queryInterface.addIndex('accounts', ['lastConnected'], {
      name: 'idx_last_connected'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('accounts');
  }
};