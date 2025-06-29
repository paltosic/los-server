const mysql = require('mysql');
const { Account } = require('../orm/models');
const bcrypt = require('bcrypt');
const saltRounds = 10;

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
  player.vars = {};
  player.loggedIn = false;
  player.dimension = (1000 + player.id);
  
  console.log(`[AUTH] ${player.name} connected from ${player.ip}`);
  player.call('showLoginDialog');
});

mp.events.add('onLoginAttempt', async (player, data) => {
  try {
    const rateLimitCheck = checkRateLimit(player.ip);
    if (!rateLimitCheck.allowed) {
      return player.call('showAuthError', [
        `Too many failed attempts. Wait ${rateLimitCheck.timeLeft} minutes.`
      ]);
    }

    const { login, password } = JSON.parse(data);

    const account = await Account.findOne({ where: { login } });
    if (!account) {
      recordFailedAttempt(player.ip);
      return player.call('showAuthError', ['Invalid login or password']);
    }

    const isPasswordMatch = await bcrypt.compare(password, account.password);
    if (!isPasswordMatch) {
      recordFailedAttempt(player.ip);
      return player.call('showAuthError', ['Invalid login or password']);
    }

    clearFailedAttempts(player.ip);

    await account.update({
      ip: player.ip,
      socialClub: player.socialClub,
      lastConnected: new Date(),
      online: true,
      totalConnections: account.totalConnections + 1
    });

    player.account = account;
    player.call('hideLoginDialog');

    setTimeout(() => {
      mp.events.call("loadAccount", player);
    }, 1000);

  } catch (error) {
    console.error('Login error:', error);
    player.call('showAuthError', ['Login failed']);
  }
});

mp.events.add('onRegisterAttempt', async (player, data) => {
  try {
    const { login, password, email } = JSON.parse(data);

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

    player.account = newAccount;
    player.call('hideLoginDialog');
    
    console.log(`[AUTH] New account registered: ${login}`);
    player.call('prepareCharacter');

  } catch (error) {
    console.error('Registration error:', error);
    player.call('showAuthError', ['Registration failed']);
  }
});

// Load other modules
require('./character');
require('./spawn');

console.log('[AUTH] Account system loaded');