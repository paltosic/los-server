// File: C:\Users\vnagu\Desktop\servera\proget5\server-files\packages\server\src\systems\account\schema\enhanced_accounts.js

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var enhancedAccountSchema = new Schema({
  // Basic account info (keeping your existing structure)
  username: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  registered: { type: Date, default: Date.now },
  lastConnected: { type: Date, default: Date.now },
  lastDisconnected: { type: Date, default: Date.now },
  
  // Enhanced player information
  info: { 
    // Character data
    justRegistered: { type: Boolean, default: true },
    level: { type: Number, default: 1, min: 1, max: 100 },
    wallet: { type: Number, default: 500, min: 0 },
    bank: { type: Number, default: 50000, min: 0 },
    respect: { type: Number, default: 0, min: 0 },
    hoursPlayed: { type: Number, default: 0, min: 0 },
    
    // Admin & moderation
    admin: { type: Number, default: 0, min: 0, max: 8 },
    warns: { type: Number, default: 0, min: 0, max: 3 },
    muted: { type: Number, default: null }, // milliseconds
    
    // Faction & job info
    member: { type: Number, default: null }, // faction ID
    leader: { type: Number, default: null }, // faction ID if leader
    rank: { type: Number, default: 0, min: 0 },
    fwarns: { type: Number, default: 0, min: 0 },
    fJoined: { type: Date, default: null },
    
    // Spawn settings
    spawn: { type: Number, default: 0, min: 0, max: 2 }, // 0: general, 1: house, 2: faction
    houseSpawn: { type: Number, default: null },
    
    // Game stats
    prisonTime: { type: Number, default: 0, min: 0 },
    wantedLevel: { type: Number, default: 0, min: 0, max: 6 },
    paycheck: { type: Number, default: 500, min: 0 },
    
    // Premium system
    premium: { type: Number, default: 0, min: 0 },
    personalSlots: { type: Number, default: 3, min: 1, max: 20 },
    
    // Licenses
    licenses: {
      driving: { type: Boolean, default: false },
      weapon: { type: Boolean, default: false }
    },
    
    // Inventory system
    inventory: [{
      title: String,
      type: Number,
      stackable: Boolean,
      quantity: { type: Number, min: 0 },
      canBeUsed: Boolean,
      canBeTradable: Boolean,
      weapon_name: String,
      house_id: Number,
      markedForTrade: { type: Boolean, default: false },
      metadata: Schema.Types.Mixed
    }],
    
    // Character appearance
    character: {
      model: Number,
      gender: { type: Number, min: 0, max: 1 },
      
      // Genetics
      father: Number,
      mother: Number,
      resemblance: { type: Number, min: 0, max: 1 },
      skinTone: { type: Number, min: 0, max: 1 },
      
      // Facial features
      facial: Number,
      facialColor: Number,
      eyebrows: Number,
      ageing: Number,
      makeup: Number,
      lipstick: Number,
      lipstickColor: Number,
      eyes: Number,
      
      // Hair
      hair: Number,
      hairColor1: Number,
      hairColor2: Number,
      
      // Clothing
      mask: Number,
      undershirt: Number,
      torso: Number,
      top: Number,
      pants: Number,
      shoes: Number,
      hat: Number,
      glasses: Number,
      
      // Additional options
      options: Schema.Types.Mixed
    },
    
    // Position tracking
    markPosition: {
      x: Number,
      y: Number,
      z: Number
    },
    
    // Game preferences
    online: { type: Boolean, default: false }
  },

  // Security & tracking
  ip: { type: String, required: true },
  socialClub: { type: String, required: true },
  serial: String, // Hardware ID
  
  // Enhanced ban system
  banStatus: {
    status: { type: Boolean, default: false },
    reason: String,
    bannedBy: String,
    bannedDate: Date,
    timeLeft: Number, // hours
    expiresAt: Date,
    permanent: { type: Boolean, default: false },
    appealable: { type: Boolean, default: true }
  },
  
  // Connection statistics
  stats: {
    totalConnections: { type: Number, default: 0 },
    totalPlaytime: { type: Number, default: 0 }, // minutes
    firstConnection: { type: Date, default: Date.now },
    averageSessionLength: { type: Number, default: 0 }, // minutes
    longestSession: { type: Number, default: 0 } // minutes
  },
  
  // Security logs
  securityLogs: [{
    type: { type: String, enum: ['login', 'logout', 'ban', 'unban', 'warning', 'admin_action'] },
    timestamp: { type: Date, default: Date.now },
    ip: String,
    details: String,
    adminName: String
  }]
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  versionKey: false // Removes __v field
});

// Indexes for better performance
enhancedAccountSchema.index({ username: 1 });
enhancedAccountSchema.index({ 'banStatus.status': 1 });
enhancedAccountSchema.index({ 'info.admin': 1 });
enhancedAccountSchema.index({ lastConnected: -1 });

// Virtual for ban status check
enhancedAccountSchema.virtual('isBanned').get(function() {
  if (!this.banStatus || !this.banStatus.status) return false;
  if (this.banStatus.permanent) return true;
  if (this.banStatus.expiresAt && this.banStatus.expiresAt > new Date()) return true;
  return false;
});

// Method to add security log
enhancedAccountSchema.methods.addSecurityLog = function(type, details, adminName = null, ip = null) {
  this.securityLogs.push({
    type,
    details,
    adminName,
    ip,
    timestamp: new Date()
  });
  
  // Keep only last 50 logs
  if (this.securityLogs.length > 50) {
    this.securityLogs = this.securityLogs.slice(-50);
  }
};

// Method to ban player
enhancedAccountSchema.methods.banPlayer = function(reason, bannedBy, hours = null, permanent = false) {
  this.banStatus = {
    status: true,
    reason,
    bannedBy,
    bannedDate: new Date(),
    timeLeft: hours,
    expiresAt: hours ? new Date(Date.now() + (hours * 60 * 60 * 1000)) : null,
    permanent,
    appealable: !permanent
  };
  
  this.addSecurityLog('ban', `Banned for: ${reason}`, bannedBy);
};

// Method to unban player
enhancedAccountSchema.methods.unbanPlayer = function(unbannedBy, reason = '') {
  this.banStatus = {
    status: false,
    reason: null,
    bannedBy: null,
    bannedDate: null,
    timeLeft: null,
    expiresAt: null,
    permanent: false,
    appealable: true
  };
  
  this.addSecurityLog('unban', `Unbanned: ${reason}`, unbannedBy);
};

// Pre-save middleware to update stats
enhancedAccountSchema.pre('save', function(next) {
  if (this.isModified('lastConnected')) {
    this.stats.totalConnections += 1;
    
    // Calculate session length
    if (this.lastDisconnected) {
      const sessionLength = Math.floor((this.lastConnected - this.lastDisconnected) / (1000 * 60));
      this.stats.totalPlaytime += sessionLength;
      
      if (sessionLength > this.stats.longestSession) {
        this.stats.longestSession = sessionLength;
      }
      
      // Update average session length
      this.stats.averageSessionLength = Math.floor(this.stats.totalPlaytime / this.stats.totalConnections);
    }
  }
  next();
});

var EnhancedAccount = mongoose.model('enhanced_accounts', enhancedAccountSchema);

module.exports = EnhancedAccount;