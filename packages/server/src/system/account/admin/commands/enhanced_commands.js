// File: C:\Users\vnagu\Desktop\servera\proget5\server-files\packages\server\src\systems\account\admin\commands\enhanced_commands.js

const accounts = require("../../schema/accounts.js");
const EnhancedAccount = require("../../schema/enhanced_accounts.js");

// Enhanced ban command with better logging and validation
mp.events.addCommand("enhancedban", async (player, fullText, name, days, ...reason) => {
  if (!player.checkAdminRank(5)) return player.pushError(`You don't have permission to use this.`);
  
  reason = reason.join(" ");
  if (!name || !reason || !days || reason.length < 3 || parseInt(days) < 1) {
    return player.pushExample(`/enhancedban [player name] [days] [reason]`);
  }
  
  if (name === player.name) return player.pushError("You can't ban yourself.");
  
  days = parseInt(days);
  
  try {
    // Check both account schemas
    let account = await EnhancedAccount.findOne({ username: name });
    if (!account) {
      account = await accounts.findOne({ username: name });
    }
    
    if (!account) {
      return player.pushError(`Account ${name} was not found in the database.`);
    }
    
    // Enhanced ban with proper expiration
    if (account.banPlayer) {
      account.banPlayer(reason, player.name, days * 24);
    } else {
      // Fallback for original schema
      account.banStatus = {
        status: true,
        reason: reason,
        bannedBy: player.name,
        timeLeft: days * 24,
        date: new Date()
      };
    }
    
    await account.save();
    
    // Kick player if online
    const onlinePlayer = mp.players.toArray().find(p => p.name === name);
    if (onlinePlayer) {
      onlinePlayer.notify(`~r~Banned by: ~w~${player.name}~n~~r~Reason: ~w~${reason}~n~~r~Duration: ~w~${days} days`);
      setTimeout(() => onlinePlayer.kick(`Banned: ${reason}`), 3000);
    }
    
    // Enhanced logging
    console.log(`[ADMIN BAN] ${player.name} banned ${name} for ${days} days. Reason: ${reason}`);
    player.pushChatToAll(`[Staff] ${player.name} banned ${name} for ${days} days. Reason: ${reason}`, null, 'admin-message');
    
  } catch (error) {
    console.error('[ADMIN ERROR] Ban command failed:', error);
    player.pushError('Failed to ban player. Check server logs.');
  }
});

// Enhanced unban command
mp.events.addCommand("enhancedunban", async (player, fullText, name, ...reason) => {
  if (!player.checkAdminRank(5)) return player.pushError(`You don't have permission to use this.`);
  
  reason = reason.join(" ");
  if (!name || !reason || reason.length < 3) {
    return player.pushExample(`/enhancedunban [player name] [reason]`);
  }
  
  try {
    // Check both account schemas
    let account = await EnhancedAccount.findOne({ username: name });
    if (!account) {
      account = await accounts.findOne({ username: name, 'banStatus.status': true });
    }
    
    if (!account) {
      return player.pushError(`Banned account ${name} was not found.`);
    }
    
    if (!account.banStatus || !account.banStatus.status) {
      return player.pushError(`${name} is not currently banned.`);
    }
    
    // Enhanced unban
    if (account.unbanPlayer) {
      account.unbanPlayer(player.name, reason);
    } else {
      // Fallback for original schema
      account.banStatus = null;
    }
    
    await account.save();
    
    console.log(`[ADMIN UNBAN] ${player.name} unbanned ${name}. Reason: ${reason}`);
    player.sendMessageToAdmins(`[Staff] ${player.name} unbanned ${name}. Reason: ${reason}`, null, 'admin-message');
    
  } catch (error) {
    console.error('[ADMIN ERROR] Unban command failed:', error);
    player.pushError('Failed to unban player. Check server logs.');
  }
});

// Enhanced account info command
mp.events.addCommand("accountinfo", async (player, fullText, target) => {
  if (!player.checkAdminRank(3)) return player.pushError(`You don't have permission to use this.`);
  
  if (!target) return player.pushExample(`/accountinfo [Player ID / Name]`);
  
  target = getPlayerID(target);
  if (!target || !target.loggedIn) return player.pushError(`Invalid Player ID / Name.`);
  
  try {
    // Get enhanced account info
    let account = await EnhancedAccount.findOne({ username: target.name });
    if (!account) {
      account = await accounts.findOne({ username: target.name });
    }
    
    if (!account) {
      return player.pushError('Account not found in database.');
    }
    
    // Display comprehensive account information
    player.pushChat(`=== Account Information for ${target.name} ===`, '#ffcc00');
    player.pushChat(`Level: ${target.info.level} | Money: $${target.info.wallet.toLocaleString()} | Bank: $${target.info.bank.toLocaleString()}`, '#ffffff');
    player.pushChat(`Admin Level: ${target.info.admin} | Warns: ${target.info.warns}/3`, '#ffffff');
    player.pushChat(`Hours Played: ${target.info.hoursPlayed} | Respect: ${target.info.respect}`, '#ffffff');
    
    if (target.info.member !== null) {
      player.pushChat(`Faction: ${target.info.member} | Rank: ${target.info.rank}`, '#ffffff');
    }
    
    // Enhanced info for enhanced accounts
    if (account.stats) {
      player.pushChat(`Total Connections: ${account.stats.totalConnections} | Total Playtime: ${Math.floor(account.stats.totalPlaytime / 60)}h`, '#ffffff');
      player.pushChat(`First Connection: ${account.stats.firstConnection.toDateString()}`, '#ffffff');
    }
    
    // Security info
    player.pushChat(`IP: ${account.ip} | Social Club: ${account.socialClub}`, '#ffcc00');
    player.pushChat(`Registered: ${account.registered.toDateString()} | Last Connected: ${account.lastConnected.toDateString()}`, '#ffcc00');
    
    // Ban status
    if (account.banStatus && account.banStatus.status) {
      player.pushChat(`BAN STATUS: BANNED`, '#ff0000');
      player.pushChat(`Reason: ${account.banStatus.reason} | By: ${account.banStatus.bannedBy}`, '#ff0000');
      if (account.banStatus.expiresAt) {
        player.pushChat(`Expires: ${account.banStatus.expiresAt.toDateString()}`, '#ff0000');
      }
    }
    
  } catch (error) {
    console.error('[ADMIN ERROR] Account info failed:', error);
    player.pushError('Failed to get account info. Check server logs.');
  }
});

// Enhanced security logs command
mp.events.addCommand("securitylogs", async (player, fullText, target, limit = 10) => {
  if (!player.checkAdminRank(6)) return player.pushError(`You don't have permission to use this.`);
  
  if (!target) return player.pushExample(`/securitylogs [Player Name] [limit (optional)]`);
  
  limit = parseInt(limit) || 10;
  if (limit > 50) limit = 50;
  
  try {
    const account = await EnhancedAccount.findOne({ username: target });
    if (!account) {
      return player.pushError('Enhanced account not found.');
    }
    
    if (!account.securityLogs || account.securityLogs.length === 0) {
      return player.pushError('No security logs found for this account.');
    }
    
    player.pushChat(`=== Security Logs for ${target} (Last ${limit}) ===`, '#ffcc00');
    
    const logs = account.securityLogs.slice(-limit).reverse();
    logs.forEach((log, index) => {
      const date = log.timestamp.toLocaleString();
      const admin = log.adminName ? ` by ${log.adminName}` : '';
      player.pushChat(`${index + 1}. [${log.type.toUpperCase()}] ${date}: ${log.details}${admin}`, '#ffffff');
    });
    
  } catch (error) {
    console.error('[ADMIN ERROR] Security logs failed:', error);
    player.pushError('Failed to get security logs. Check server logs.');
  }
});

// Enhanced statistics command
mp.events.addCommand("serverstats", async (player, fullText) => {
  if (!player.checkAdminRank(4)) return player.pushError(`You don't have permission to use this.`);
  
  try {
    // Get database statistics
    const totalAccounts = await accounts.countDocuments();
    const enhancedAccounts = await EnhancedAccount.countDocuments();
    const bannedAccounts = await EnhancedAccount.countDocuments({ 'banStatus.status': true });
    const activeAccounts = await EnhancedAccount.countDocuments({ 
      lastConnected: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });
    
    // Online player statistics
    const onlinePlayers = mp.players.toArray().filter(p => p.loggedIn).length;
    const adminOnline = mp.players.toArray().filter(p => p.loggedIn && p.info.admin > 0).length;
    
    player.pushChat(`=== Server Statistics ===`, '#ffcc00');
    player.pushChat(`Total Accounts: ${totalAccounts} | Enhanced: ${enhancedAccounts}`, '#ffffff');
    player.pushChat(`Banned Accounts: ${bannedAccounts} | Active (7 days): ${activeAccounts}`, '#ffffff');
    player.pushChat(`Online Players: ${onlinePlayers} | Admins Online: ${adminOnline}`, '#ffffff');
    player.pushChat(`Server Uptime: ${process.uptime().toFixed(0)} seconds`, '#ffffff');
    player.pushChat(`Memory Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, '#ffffff');
    
  } catch (error) {
    console.error('[ADMIN ERROR] Server stats failed:', error);
    player.pushError('Failed to get server statistics. Check server logs.');
  }
});

// Enhanced migration command (migrate old accounts to enhanced schema)
mp.events.addCommand("migrateaccounts", async (player, fullText, confirm) => {
  if (!player.checkAdminRank(8)) return player.pushError(`You don't have permission to use this.`);
  
  if (confirm !== 'CONFIRM') {
    return player.pushExample(`/migrateaccounts CONFIRM (WARNING: This will migrate all old accounts to enhanced schema)`);
  }
  
  try {
    player.pushChat('Starting account migration...', '#ffcc00');
    
    const oldAccounts = await accounts.find({});
    let migrated = 0;
    let skipped = 0;
    
    for (const oldAccount of oldAccounts) {
      // Check if already migrated
      const existing = await EnhancedAccount.findOne({ username: oldAccount.username });
      if (existing) {
        skipped++;
        continue;
      }
      
      // Create enhanced account
      const enhancedAccount = new EnhancedAccount({
        username: oldAccount.username,
        password: oldAccount.password,
        registered: oldAccount.registered,
        lastConnected: oldAccount.lastConnected,
        lastDisconnected: oldAccount.lastDisconnected,
        ip: oldAccount.ip,
        socialClub: oldAccount.socialClub,
        info: oldAccount.info,
        banStatus: oldAccount.banStatus,
        stats: {
          totalConnections: 1,
          totalPlaytime: oldAccount.info.hoursPlayed * 60 || 0,
          firstConnection: oldAccount.registered,
          averageSessionLength: 60,
          longestSession: 120
        }
      });
      
      // Add migration log
      enhancedAccount.addSecurityLog('migration', 'Account migrated from old schema', 'System');
      
      await enhancedAccount.save();
      migrated++;
      
      // Progress update every 10 accounts
      if (migrated % 10 === 0) {
        player.pushChat(`Migrated ${migrated} accounts...`, '#ffffff');
      }
    }
    
    player.pushChat(`Migration completed! Migrated: ${migrated}, Skipped: ${skipped}`, '#00ff00');
    player.sendMessageToAdmins(`[MIGRATION] ${player.name} migrated ${migrated} accounts to enhanced schema`, null, 'admin-message');
    
  } catch (error) {
    console.error('[ADMIN ERROR] Migration failed:', error);
    player.pushError('Migration failed. Check server logs.');
  }
});

// Enhanced backup command
mp.events.addCommand("backupaccounts", async (player, fullText) => {
  if (!player.checkAdminRank(8)) return player.pushError(`You don't have permission to use this.`);
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fs = require('fs');
    const path = require('path');
    
    // Get all accounts
    const allAccounts = await EnhancedAccount.find({});
    const backupData = {
      timestamp: new Date(),
      accountCount: allAccounts.length,
      accounts: allAccounts
    };
    
    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Save backup
    const backupFile = path.join(backupDir, `accounts_backup_${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    player.pushChat(`Backup created: ${backupFile}`, '#00ff00');
    player.pushChat(`Backed up ${allAccounts.length} accounts`, '#ffffff');
    
    console.log(`[ADMIN BACKUP] ${player.name} created account backup: ${backupFile}`);
    
  } catch (error) {
    console.error('[ADMIN ERROR] Backup failed:', error);
    player.pushError('Backup failed. Check server logs.');
  }
});

console.log('[ADMIN] Enhanced admin commands loaded');