// File: packages/server/models/securitylog.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SecurityLog extends Model {
    static associate(models) {
      // Зв'язок з акаунтом
      SecurityLog.belongsTo(models.EnhancedAccount, {
        foreignKey: 'accountId',
        as: 'account'
      });
    }

    // Отримати метадані як об'єкт
    get metadataObject() {
      try {
        return this.metadata ? JSON.parse(this.metadata) : null;
      } catch (error) {
        console.error('Помилка парсингу метаданих журналу безпеки:', error);
        return null;
      }
    }

    // Встановити метадані як об'єкт
    set metadataObject(value) {
      this.metadata = value ? JSON.stringify(value) : null;
    }

    // Форматований час
    get formattedTime() {
      return this.createdAt.toLocaleString('uk-UA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }

    // Статичні методи для пошуку логів
    static async getLogsForAccount(accountId, limit = 50) {
      return await this.findAll({
        where: { accountId },
        order: [['createdAt', 'DESC']],
        limit
      });
    }

    static async getLogsByType(type, limit = 100) {
      return await this.findAll({
        where: { type },
        include: [{
          model: sequelize.models.EnhancedAccount,
          as: 'account',
          attributes: ['username']
        }],
        order: [['createdAt', 'DESC']],
        limit
      });
    }

    static async getLogsByIP(ip, limit = 100) {
      return await this.findAll({
        where: { ip },
        include: [{
          model: sequelize.models.EnhancedAccount,
          as: 'account',
          attributes: ['username']
        }],
        order: [['createdAt', 'DESC']],
        limit
      });
    }

    static async getRecentLogs(hours = 24, limit = 200) {
      const since = new Date(Date.now() - (hours * 60 * 60 * 1000));
      
      return await this.findAll({
        where: {
          createdAt: {
            [sequelize.Sequelize.Op.gte]: since
          }
        },
        include: [{
          model: sequelize.models.EnhancedAccount,
          as: 'account',
          attributes: ['username']
        }],
        order: [['createdAt', 'DESC']],
        limit
      });
    }

    // Статистика безпеки
    static async getSecurityStats(days = 7) {
      const since = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
      
      const stats = await this.findAll({
        where: {
          createdAt: {
            [sequelize.Sequelize.Op.gte]: since
          }
        },
        attributes: [
          'type',
          [sequelize.fn('COUNT', sequelize.col('type')), 'count']
        ],
        group: ['type'],
        raw: true
      });

      return stats.reduce((acc, stat) => {
        acc[stat.type] = parseInt(stat.count);
        return acc;
      }, {});
    }

    // Очистка старих логів (зберігати останні N записів)
    static async cleanupOldLogs(keepCount = 1000) {
      const totalLogs = await this.count();
      
      if (totalLogs <= keepCount) {
        return 0;
      }

      const logsToDelete = totalLogs - keepCount;
      
      const oldestLogs = await this.findAll({
        order: [['createdAt', 'ASC']],
        limit: logsToDelete,
        attributes: ['id']
      });

      const idsToDelete = oldestLogs.map(log => log.id);
      
      const deletedCount = await this.destroy({
        where: {
          id: {
            [sequelize.Sequelize.Op.in]: idsToDelete
          }
        }
      });

      return deletedCount;
    }

    // Виявлення підозрілої активності
    static async detectSuspiciousActivity() {
      const suspicious = [];
      const last24Hours = new Date(Date.now() - (24 * 60 * 60 * 1000));

      // Багато невдалих спроб входу з одного IP
      const failedLogins = await this.findAll({
        where: {
          type: 'login',
          details: {
            [sequelize.Sequelize.Op.like]: '%неправильний%'
          },
          createdAt: {
            [sequelize.Sequelize.Op.gte]: last24Hours
          }
        },
        attributes: [
          'ip',
          [sequelize.fn('COUNT', sequelize.col('ip')), 'count']
        ],
        group: ['ip'],
        having: sequelize.literal('COUNT(ip) >= 5'),
        raw: true
      });

      failedLogins.forEach(item => {
        suspicious.push({
          type: 'multiple_failed_logins',
          ip: item.ip,
          count: item.count,
          severity: 'high'
        });
      });

      // Багато реєстрацій з одного IP
      const multipleRegistrations = await this.findAll({
        where: {
          type: 'registration',
          createdAt: {
            [sequelize.Sequelize.Op.gte]: last24Hours
          }
        },
        attributes: [
          'ip',
          [sequelize.fn('COUNT', sequelize.col('ip')), 'count']
        ],
        group: ['ip'],
        having: sequelize.literal('COUNT(ip) >= 3'),
        raw: true
      });

      multipleRegistrations.forEach(item => {
        suspicious.push({
          type: 'multiple_registrations',
          ip: item.ip,
          count: item.count,
          severity: 'medium'
        });
      });

      return suspicious;
    }
  }

  SecurityLog.init({
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
    
    // Тип події
    type: {
      type: DataTypes.ENUM(
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
      type: DataTypes.STRING(1000),
      allowNull: false,
      validate: {
        len: [1, 1000]
      }
    },
    
    // Адміністратор
    adminName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: [2, 50]
      }
    },
    
    // IP адреса
    ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
      validate: {
        isIP: true
      }
    },
    
    // Додаткові дані
    metadata: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'SecurityLog',
    tableName: 'security_logs',
    timestamps: true,
    
    // Індекси
    indexes: [
      {
        fields: ['accountId']
      },
      {
        fields: ['type']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['ip']
      },
      {
        fields: ['adminName']
      }
    ]
  });

  return SecurityLog;
};