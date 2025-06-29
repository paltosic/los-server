// File: packages/server/models/ban.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Ban extends Model {
    static associate(models) {
      // Зв'язок з акаунтом
      Ban.belongsTo(models.EnhancedAccount, {
        foreignKey: 'accountId',
        as: 'account'
      });
    }

    // Перевірити, чи активний бан
    get isActive() {
      if (!this.active) return false;
      if (this.permanent) return true;
      if (this.expiresAt && new Date(this.expiresAt) > new Date()) return true;
      return false;
    }

    // Отримати час, що залишився до розбану
    get timeRemaining() {
      if (this.permanent) return 'Permanent';
      if (!this.expiresAt) return 'No expiration';
      
      const now = new Date();
      const expires = new Date(this.expiresAt);
      
      if (expires <= now) return 'Expired';
      
      const diff = expires - now;
      const hours = Math.ceil(diff / (1000 * 60 * 60));
      
      if (hours < 24) {
        return `${hours} годин`;
      } else {
        const days = Math.ceil(hours / 24);
        return `${days} днів`;
      }
    }

    // Розбанити
    async unban(unbannedBy, reason = '') {
      this.active = false;
      this.unbannedBy = unbannedBy;
      this.unbannedDate = new Date();
      this.unbanReason = reason;
      
      await this.save();
      
      // Додати журнал безпеки
      const { EnhancedAccount } = require('./index');
      const account = await EnhancedAccount.findByPk(this.accountId);
      if (account) {
        await account.addSecurityLog('unban', `Розбанений: ${reason}`, unbannedBy, null, {
          banId: this.id,
          originalReason: this.reason
        });
      }
      
      return this;
    }

    // Статичний метод для очистки застарілих банів
    static async cleanupExpiredBans() {
      const expiredBans = await this.findAll({
        where: {
          active: true,
          permanent: false,
          expiresAt: {
            [sequelize.Sequelize.Op.lt]: new Date()
          }
        }
      });

      for (const ban of expiredBans) {
        await ban.update({
          active: false,
          unbannedBy: 'System',
          unbannedDate: new Date(),
          unbanReason: 'Автоматичне зняття після закінчення терміну'
        });
      }

      return expiredBans.length;
    }

    // Отримати активні бани для адміністраторів
    static async getActiveBans(limit = 50) {
      return await this.findAll({
        where: { active: true },
        include: [{
          model: sequelize.models.EnhancedAccount,
          as: 'account',
          attributes: ['username']
        }],
        order: [['createdAt', 'DESC']],
        limit
      });
    }
  }

  Ban.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // Зв'язок з акаунтом
    accountId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'enhanced_accounts',
        key: 'id'
      }
    },
    
    // Інформація про бан
    reason: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        len: [3, 500]
      }
    },
    bannedBy: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [2, 50]
      }
    },
    bannedDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    
    // Термін бану
    timeLeft: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1
      }
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    permanent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    appealable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    
    // Статус
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    
    // Розбан
    unbannedBy: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: [2, 50]
      }
    },
    unbannedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    unbanReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        len: [0, 500]
      }
    }
  }, {
    sequelize,
    modelName: 'Ban',
    tableName: 'bans',
    timestamps: true,
    
    // Валідація
    validate: {
      // Перевірити, що permanent або expiresAt встановлено
      banTermValid() {
        if (!this.permanent && !this.expiresAt) {
          throw new Error('Бан повинен мати термін дії або бути постійним');
        }
      }
    },
    
    // Індекси
    indexes: [
      {
        fields: ['accountId']
      },
      {
        fields: ['active']
      },
      {
        fields: ['expiresAt']
      },
      {
        fields: ['bannedBy']
      }
    ]
  });

  return Ban;
};