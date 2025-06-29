const { Account } = require('../orm/models');
const bcrypt = require('bcrypt');
const saltRounds = 10;

console.log('[SERVER AUTH] Loading authentication system...');

// Rate limiting
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000;

function checkRateLimit(ip) {
  const attempts = loginAttempts.get(ip);
  if (!attempts) return { allowed: true };
  
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    const timeLeft = LOCKOUT_TIME - (Date.now() - attempts.lastAttempt);
    if (timeLeft > 0) {
      return { allowed: false, timeLeft: Math.ceil(timeLeft / 1000 / 60) };
    } else {
      loginAttempts.delete(ip);
      return { allowed: true };
    }
  }
  return { allowed: true };
}

function recordFailedAttempt(ip) {
  const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: Date.now() };
  attempts.count++;
  attempts.lastAttempt = Date.now();
  loginAttempts.set(ip, attempts);
}

function clearFailedAttempts(ip) {
  loginAttempts.delete(ip);
}

mp.events.add('playerReady', (player) => {
  console.log(`[SERVER AUTH] Player ${player.name} (${player.ip}) connected`);
  
  player.vars = {};
  player.loggedIn = false;
  player.dimension = (1000 + player.id);
  
  // Small delay to ensure client is ready
  setTimeout(() => {
    player.call('showLoginDialog');
    console.log(`[SERVER AUTH] Sent login dialog to ${player.name}`);
  }, 2000);
});

mp.events.add('onLoginAttempt', async (player, data) => {
  console.log(`[SERVER AUTH] Login attempt from ${player.name}: ${data}`);
  
  try {
    const rateLimitCheck = checkRateLimit(player.ip);
    if (!rateLimitCheck.allowed) {
      console.log(`[SERVER AUTH] Rate limited: ${player.name}`);
      return player.call('showAuthError', [
        `Too many failed attempts. Wait ${rateLimitCheck.timeLeft} minutes.`
      ]);
    }

    const { login, password } = JSON.parse(data);
    console.log(`[SERVER AUTH] Attempting login for: ${login}`);

    const account = await Account.findOne({ where: { login } });
    if (!account) {
      console.log(`[SERVER AUTH] Account not found: ${login}`);
      recordFailedAttempt(player.ip);
      return player.call('showAuthError', ['Invalid login or password']);
    }

    const isPasswordMatch = await bcrypt.compare(password, account.password);
    if (!isPasswordMatch) {
      console.log(`[SERVER AUTH] Invalid password for: ${login}`);
      recordFailedAttempt(player.ip);
      return player.call('showAuthError', ['Invalid login or password']);
    }

    console.log(`[SERVER AUTH] Login successful: ${login}`);
    clearFailedAttempts(player.ip);

    await account.update({
      ip: player.ip,
      socialClub: player.socialClub,
      lastConnected: new Date(),
      online: true,
      totalConnections: (account.totalConnections || 0) + 1
    });

    player.account = account;
    player.call('hideLoginDialog');

    setTimeout(() => {
      mp.events.call("loadAccount", player);
    }, 1000);

  } catch (error) {
    console.error('[SERVER AUTH] Login error:', error);
    player.call('showAuthError', ['Login failed - server error']);
  }
});

mp.events.add('onRegisterAttempt', async (player, data) => {
  console.log(`[SERVER AUTH] Register attempt from ${player.name}: ${data}`);
  
  try {
    const { login, password, email } = JSON.parse(data);
    console.log(`[SERVER AUTH] Attempting registration for: ${login}`);

    // Validation
    if (!password || password.length < 6) {
      return player.call('showAuthError', ['Password must be at least 6 characters']);
    }

    if (!login || login.length < 3 || login.length > 20) {
      return player.call('showAuthError', ['Login must be 3-20 characters']);
    }

    const inappropriateWords = ['admin', 'moderator', 'staff', 'owner', 'developer'];
    if (inappropriateWords.some(word => login.toLowerCase().includes(word))) {
      return player.call('showAuthError', ['This login is forbidden']);
    }

    const existingAccount = await Account.findOne({ where: { login } });
    if (existingAccount) {
      console.log(`[SERVER AUTH] Account already exists: ${login}`);
      return player.call('showAuthError', ['Account already exists']);
    }

    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const newAccount = await Account.create({
      login,
      password: passwordHash,
      email: email || null,
      ip: player.ip,
      socialClub: player.socialClub,
      serial: player.serial || 'unknown',
      
      // Initial values
      level: 1,
      wallet: 1000,
      bank: 75000,
      respect: 0,
      hoursPlayed: 0,
      admin: 0,
      warns: 0,
      
      inventory: JSON.stringify([
        {
          title: "Mobile Phone",
          type: 1,
          stackable: false,
          quantity: 1,
          canBeUsed: true,
          canBeTradable: false
        },
        {
          title: "Wallet",
          type: 2,
          stackable: false,
          quantity: 1,
          canBeUsed: false,
          canBeTradable: false
        }
      ]),
      
      totalConnections: 1,
      firstConnection: new Date(),
      lastConnected: new Date(),
      online: true,
      character: null,
      justRegistered: true
    });

    console.log(`[SERVER AUTH] Registration successful: ${login}`);
    
    player.account = newAccount;
    player.call('hideLoginDialog');
    
    setTimeout(() => {
      player.call('prepareCharacter');
    }, 1000);

  } catch (error) {
    console.error('[SERVER AUTH] Registration error:', error);
    player.call('showAuthError', ['Registration failed - server error']);
  }
});

// Load other modules
require('./character');
require('./spawn');

console.log('[SERVER AUTH] Authentication system loaded');


// Debug commands for character system
mp.events.addCommand('testchar', (player) => {
    if (!player.checkAdminRank || !player.checkAdminRank(1)) {
        console.log(`[DEBUG] Testing character for ${player.name}`);
        player.call('prepareCharacter');
    }
});

mp.events.addCommand('reloadchar', (player) => {
    if (player.info && player.info.character) {
        mp.events.call("loadClothes", player);
        player.pushChat('Character appearance reloaded.');
    }
});

// Helper function for admin rank checking
mp.events.add("loadVariables", (player) => {
    // Add this to existing loadVariables
    player.checkAdminRank = function(level) {
        return (player.info && player.info.admin >= level);
    };
});