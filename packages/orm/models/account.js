module.exports = (sequelize, DataTypes) => {
  const Account = sequelize.define('Account', {
    // Existing fields
    login: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'username'
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    
    // New fields for character system
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ip: {
      type: DataTypes.STRING,
      allowNull: true
    },
    socialClub: {
      type: DataTypes.STRING,
      allowNull: true
    },
    serial: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    // Player data
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    wallet: {
      type: DataTypes.INTEGER,
      defaultValue: 1000
    },
    bank: {
      type: DataTypes.INTEGER,
      defaultValue: 75000
    },
    respect: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    hoursPlayed: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    admin: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    warns: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    // Character and inventory
    character: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    inventory: {
      type: DataTypes.TEXT,
      defaultValue: '[]'
    },
    
    // Status flags
    justRegistered: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    online: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    totalConnections: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    
    // Connection tracking
    firstConnection: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    lastConnected: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    lastDisconnected: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'accounts',
    timestamps: true
  });

  return Account;
};