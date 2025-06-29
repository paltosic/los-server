// File: packages/server/models/enhancedaccount.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EnhancedAccount extends Model {
    static associate(models) {
      // Зв'язки з іншими моделями
      EnhancedAccount.hasMany(models.Ban, {
        foreignKey: 'accountId',
        as: 'bans'
      });
      
      EnhancedAccount.hasMany(models.SecurityLog, {
        foreignKey: 'accountId',
        as: 'securityLogs'
      });
    }

    // Перевірка, чи забанений користувач
    get isBanned() {
      if (!this.bans || this.bans.length === 0) return false;
      
      const activeBan = this.bans.find(ban => ban.active);
      if (!activeBan) return false;
      
      if (activeBan.permanent) return true;
      if (activeBan.expiresAt && new Date(activeBan.expiresAt) > new Date()) return true;
      
      return false;
    }

    // Отримати активний бан
    get activeBan() {
      if (!this.bans || this.bans.length === 0) return null;
      return this.bans.find(ban => ban.active) || null;
    }

    // Метод для додавання журналу безпеки
    async addSecurityLog(type, details, adminName = null, ip = null, metadata = null) {
      const { SecurityLog } = require('./index');
      
      return await SecurityLog.create({
        accountId: this.id,
        type,
        details,
        adminName,
        ip,
        metadata: metadata ? JSON.stringify(metadata) : null
      });
    }

    // Метод для бану гравця
    async banPlayer(reason, bannedBy, hours = null, permanent = false) {
      const { Ban } = require('./index');
      
      // Деактивувати всі попередні бани
      await Ban.update(
        { active: false },
        { where: { accountId: this.id, active: true } }
      );
      
      // Створити новий бан
      const ban = await Ban.create({
        accountId: this.id,
        reason,
        bannedBy,
        timeLeft: hours,
        expiresAt: hours ? new Date(Date.now() + (hours * 60 * 60 * 1000)) : null,
        permanent,
        active: true
      });
      
      // Додати журнал безпеки
      await this.addSecurityLog('ban', `Забанений за: ${reason}`, bannedBy, null, {
        banId: ban.id,
        permanent,
        hours
      });
      
      return ban;
    }

    // Метод для розбану гравця
    async unbanPlayer(unbannedBy, reason = '') {
      const { Ban } = require('./index');
      
      // Знайти активний бан
      const activeBan = await Ban.findOne({
        where: { accountId: this.id, active: true }
      });
      
      if (activeBan) {
        // Деактивувати бан
        await activeBan.update({
          active: false,
          unbannedBy,
          unbannedDate: new Date(),
          unbanReason: reason
        });
        
        // Додати журнал безпеки
        await this.addSecurityLog('unban', `Розбанений: ${reason}`, unbannedBy, null, {
          banId: activeBan.id,
          originalReason: activeBan.reason
        });
        
        return true;
      }
      
      return false;
    }

    // Отримати персонажа (парсинг JSON)
    get characterData() {
      try {
        return this.character ? JSON.parse(this.character) : null;
      } catch (error) {
        console.error('Помилка парсингу даних персонажа:', error);
        return null;
      }
    }

    // Встановити персонажа (конвертація в JSON)
    set characterData(value) {
      this.character = value ? JSON.stringify(value) : null;
    }

    // Отримати інвентар (парсинг JSON)
    get inventoryData() {
      try {
        return this.inventory ? JSON.parse(this.inventory) : [];
      } catch (error) {
        console.error('Помилка парсингу інвентаря:', error);
        return [];
      }
    }

    // Встановити інвентар (конвертація в JSON)
    set inventoryData(value) {
      this.inventory = Array.isArray(value) ? JSON.stringify(value) : '[]';
    }

    // Оновити статистику підключення
    async updateConnectionStats() {
      this.totalConnections += 1;
      
      if (this.lastDisconnected) {
        const sessionLength = Math.floor((new Date() - new Date(this.lastDisconnected)) / (1000 * 60));
        this.totalPlaytime += sessionLength;
        
        if (sessionLength > this.longestSession) {
          this.longestSession = sessionLength;
        }
        
        // Оновити середню тривалість сесії
        this.averageSessionLength = Math.floor(this.totalPlaytime / this.totalConnections);
      }
      
      this.lastConnected = new Date();
      this.online = true;
      
      if (!this.firstConnection) {
        this.firstConnection = new Date();
      }
      
      await this.save();
    }

    // Відключення гравця
    async disconnect() {
      this.lastDisconnected = new Date();
      this.online = false;
      await this.save();
    }

    // Валідація пароля (для використання з bcrypt)
    async validatePassword(password) {
      const bcrypt = require('bcrypt');
      return await bcrypt.compare(password, this.password);
    }

    // Хешування пароля
    static async hashPassword(password) {
      const bcrypt = require('bcrypt');
      return await bcrypt.hash(password, 12);
    }

    // Пошук за ім'ям користувача
    static async findByUsername(username) {
      return await this.findOne({
        where: { username },
        include: [
          { model: sequelize.models.Ban, as: 'bans' },
          { 
            model: sequelize.models.SecurityLog, 
            as: 'securityLogs',
            limit: 10,
            order: [['createdAt', 'DESC']]
          }
        ]
      });
    }

    // Статистика сервера
    static async getServerStats() {
      const totalAccounts = await this.count();
      const bannedAccounts = await this.count({
        include: [{
          model: sequelize.models.Ban,
          as: 'bans',
          where: { active: true },
          required: true
        }]
      });
      
      const onlineAccounts = await this.count({
        where: { online: true }
      });
      
      const activeAccounts = await this.count({
        where: {
          lastConnected: {
            [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      });
      
      return {
        totalAccounts,
        bannedAccounts,
        onlineAccounts,
        activeAccounts
      };
    }

    // Конвертувати в JSON для клієнта (без чутливих даних)
    toClientJSON() {
      const {
        password,
        ip,
        socialClub,
        serial,
        ...clientData
      } = this.dataValues;
      
      return {
        ...clientData,
        characterData: this.characterData,
        inventoryData: this.inventoryData,
        isBanned: this.isBanned,
        activeBan: this.activeBan
      };
    }
  }

  EnhancedAccount.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // Основна інформація
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        isAlphanumeric: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [6, 255]
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    
    // Дати
    registered: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    lastConnected: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastDisconnected: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Ігрова інформація
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
      validate: {
        min: 1,
        max: 100
      }
    },
    wallet: {
      type: DataTypes.INTEGER,
      defaultValue: 1000,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    bank: {
      type: DataTypes.INTEGER,
      defaultValue: 75000,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    respect: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    hoursPlayed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    
    // Адміністрація
    admin: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0,
        max: 8
      }
    },
    warns: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0,
        max: 3
      }
    },
    muted: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    
    // Фракція
    member: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    leader: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    rank: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    fwarns: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    fJoined: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Налаштування спавну
    spawn: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0,
        max: 2
      }
    },
    houseSpawn: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    
    // Ігрова статистика
    prisonTime: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    wantedLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0,
        max: 6
      }
    },
    paycheck: {
      type: DataTypes.INTEGER,
      defaultValue: 500,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    
    // Преміум
    premium: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    personalSlots: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
      allowNull: false,
      validate: {
        min: 1,
        max: 20
      }
    },
    
    // Ліцензії
    drivingLicense: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    weaponLicense: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    
    // Персонаж та інвентар (JSON)
    character: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    inventory: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Позиція маркера
    markPositionX: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    markPositionY: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    markPositionZ: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    
    // Безпека та відстеження
    ip: {
      type: DataTypes.STRING(45),
      allowNull: false
    },
    socialClub: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    serial: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    // Статистика підключень
    totalConnections: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    totalPlaytime: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    firstConnection: {
      type: DataTypes.DATE,
      allowNull: true
    },
    averageSessionLength: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    longestSession: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    
    // Статус онлайн
    online: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'EnhancedAccount',
    tableName: 'enhanced_accounts',
    timestamps: true,
    
    // Хуки для автоматичного хешування пароля
    hooks: {
      beforeCreate: async (account) => {
        if (account.password) {
          account.password = await EnhancedAccount.hashPassword(account.password);
        }
      },
      beforeUpdate: async (account) => {
        if (account.changed('password')) {
          account.password = await EnhancedAccount.hashPassword(account.password);
        }
      }
    },
    
    // Індекси
    indexes: [
      {
        unique: true,
        fields: ['username']
      },
      {
        fields: ['ip']
      },
      {
        fields: ['admin']
      },
      {
        fields: ['lastConnected']
      },
      {
        fields: ['online']
      }
    ]
  });

  return EnhancedAccount;
};