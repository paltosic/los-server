const mysql = require('mysql');
const { Account } = require('../orm/models');
const bcrypt = require('bcrypt');
const saltRounds = 10;

// Rate limiting for login attempts
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

// Check rate limit
function checkRateLimit(ip) {
  const attempts = loginAttempts.get(ip);
  if (!attempts) return { allowed: true };
  
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    const timeLeft = LOCKOUT_TIME - (Date.now() - attempts.lastAttempt);
    if (timeLeft > 0) {
      return { 
        allowed: false, 
        blocked: true, 
        timeLeft: Math.ceil(timeLeft / 1000 / 60) 
      };
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

// Spawn locations
const spawns = {
  general: [
    [-1041.917, -2745.744, 21.359, 330.450]
  ]
};

mp.events.add('playerReady', (player) => {
  player.vars = {};
  player.loggedIn = false;
  player.dimension = (1000 + player.id);
  
  console.log(`[${player.ip}] ${player.name} has connected to server.`);
  player.call('showLoginDialog');
});

mp.events.add('onLoginAttempt', async (player, data) => {
  try {
    // Check rate limit
    const rateLimitCheck = checkRateLimit(player.ip);
    if (!rateLimitCheck.allowed) {
      return player.call('showAuthError', [
        `Занадто багато невдалих спроб. Зачекайте ${rateLimitCheck.timeLeft} хвилин.`
      ]);
    }

    const { login, password } = JSON.parse(data);

    const account = await Account.findOne({ where: { login } });
    if (!account) {
      recordFailedAttempt(player.ip);
      return player.call('showAuthError', ['Неправильний логін або пароль']);
    }

    const isPasswordMatch = await bcrypt.compare(password, account.password);
    if (!isPasswordMatch) {
      recordFailedAttempt(player.ip);
      return player.call('showAuthError', ['Неправильний логін або пароль']);
    }

    // Clear failed attempts on successful login
    clearFailedAttempts(player.ip);

    // Update account connection info
    await account.update({
      ip: player.ip,
      socialClub: player.socialClub,
      lastConnected: new Date(),
      online: true,
      totalConnections: account.totalConnections + 1
    });

    player.account = account;
    player.call('hideLoginDialog');

    // Load account after successful login
    setTimeout(() => {
      mp.events.call("loadAccount", player);
    }, 1000);

  } catch (error) {
    console.error('Error during login attempt:', error);
    player.call('showAuthError', ['Виникла помилка під час входу']);
  }
});

mp.events.add('onRegisterAttempt', async (player, data) => {
  try {
    const { login, password, email } = JSON.parse(data);

    // Validation
    if (!password || password.length < 6) {
      return player.call('showAuthError', ['Пароль повинен містити принаймні 6 символів']);
    }

    if (!login || login.length < 3 || login.length > 20) {
      return player.call('showAuthError', ['Логін повинен бути від 3 до 20 символів']);
    }

    // Check for inappropriate content
    const inappropriateWords = ['admin', 'moderator', 'staff', 'owner', 'developer'];
    if (inappropriateWords.some(word => login.toLowerCase().includes(word))) {
      return player.call('showAuthError', ['Цей логін заборонений']);
    }

    // Check if account exists
    const existingAccount = await Account.findOne({ where: { login } });
    if (existingAccount) {
      return player.call('showAuthError', ['Аккаунт вже існує']);
    }

    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create new account with initial data
    const newAccount = await Account.create({
      login,
      password: passwordHash,
      email: email || null,
      ip: player.ip,
      socialClub: player.socialClub,
      serial: player.serial || 'unknown',
      
      // Initial player data
      level: 1,
      wallet: 1000,
      bank: 75000,
      respect: 0,
      hoursPlayed: 0,
      admin: 0,
      warns: 0,
      
      // Starting inventory
      inventory: JSON.stringify([
        {
          title: "Мобільний телефон",
          type: 1,
          stackable: false,
          quantity: 1,
          canBeUsed: true,
          canBeTradable: false,
          markedForTrade: false
        },
        {
          title: "Гаманець",
          type: 2,
          stackable: false,
          quantity: 1,
          canBeUsed: false,
          canBeTradable: false,
          markedForTrade: false
        }
      ]),
      
      // Statistics
      totalConnections: 1,
      firstConnection: new Date(),
      lastConnected: new Date(),
      online: true,
      
      // Character data will be null initially
      character: null,
      justRegistered: true
    });

    player.account = newAccount;
    player.call('hideLoginDialog');
    
    console.log(`[AUTH] New account registered: ${login} from ${player.ip}`);
    
    // Start character creation
    player.call('prepareCharacter');

  } catch (error) {
    console.error('Error during register attempt:', error);
    player.call('showAuthError', ['Виникла помилка під час реєстрації']);
  }
});