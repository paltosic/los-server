// File: C:\Users\vnagu\Desktop\servera\proget5\server-files\packages\server\src\systems\account\auth\enhanced_auth.js

const accounts = require("../schema/accounts.js");
const EnhancedAccount = require("../schema/enhanced_accounts.js");
var hash = require('simple-encryptor')('bZgl4bXFJ3HNQ4Rkozpzzhurdock');

// Enhanced login attempts tracking
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

// Rate limiting for login attempts
function checkRateLimit(ip) {
  const attempts = loginAttempts.get(ip);
  if (!attempts) return true;
  
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    const timeLeft = LOCKOUT_TIME - (Date.now() - attempts.lastAttempt);
    if (timeLeft > 0) {
      return { blocked: true, timeLeft: Math.ceil(timeLeft / 1000 / 60) };
    } else {
      // Reset attempts after lockout period
      loginAttempts.delete(ip);
      return true;
    }
  }
  return true;
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

// Enhanced login handler
mp.events.add('receiveLoginData', async (player, password) => {
  try {
    // Rate limiting check
    const rateLimitCheck = checkRateLimit(player.ip);
    if (rateLimitCheck.blocked) {
      player.call('sendAuthResponse', [
        `Too many failed attempts. Please wait ${rateLimitCheck.timeLeft} minutes.`, 
        'login'
      ]);
      return false;
    }

    password = hash.hmac(password);
    
    // Try enhanced schema first, fallback to original
    let account = await EnhancedAccount.findOne({ username: player.name });
    if (!account) {
      account = await accounts.findOne({ username: player.name });
    }

    if (account == null) {
      recordFailedAttempt(player.ip);
      player.call('sendAuthResponse', [`Username ${player.name} is not registered.`, 'login']);
      return false;
    }

    if (account.password != password) {
      recordFailedAttempt(player.ip);
      player.call('sendAuthResponse', ['Password is incorrect.', 'login']);
      return false;
    }

    // Check ban status (enhanced)
    if (account.isBanned) {
      const banInfo = account.banStatus;
      let banMessage = `Account is banned. Reason: ${banInfo.reason}`;
      
      if (!banInfo.permanent && banInfo.expiresAt) {
        const timeLeft = Math.ceil((banInfo.expiresAt - new Date()) / (1000 * 60 * 60));
        banMessage += ` | Time left: ${timeLeft} hours`;
      } else if (banInfo.permanent) {
        banMessage += ' | This ban is permanent';
      }
      
      player.call('sendAuthResponse', [banMessage, 'login']);
      return false;
    }

    // Success - clear failed attempts and proceed
    clearFailedAttempts(player.ip);
    
    // Add security log
    if (account.addSecurityLog) {
      account.addSecurityLog('login', 'Successful login', null, player.ip);
      await account.save();
    }

    // Load account with delay for smooth transition
    player.loadAccountTimer = setTimeout(function() { 
      mp.events.call("loadAccount", player); 
    }, 1000);
    
    console.log(`[AUTH] ${player.name} logged in successfully from ${player.ip}`);
    return true;

  } catch (error) {
    console.error('[AUTH ERROR] Login failed:', error);
    player.call('sendAuthResponse', ['Server error. Please try again.', 'login']);
    return false;
  }
});

// Enhanced registration handler
mp.events.add('receiveRegisterData', async (player, password, email = null) => {
  try {
    // Input validation
    if (!password || password.length < 6) {
      player.call('sendAuthResponse', ['Password must be at least 6 characters long.', 'register']);
      return false;
    }

    if (player.name.length < 3 || player.name.length > 20) {
      player.call('sendAuthResponse', ['Username must be between 3 and 20 characters.', 'register']);
      return false;
    }

    // Check for inappropriate content in username
    const inappropriateWords = ['admin', 'moderator', 'staff', 'owner', 'developer'];
    if (inappropriateWords.some(word => player.name.toLowerCase().includes(word))) {
      player.call('sendAuthResponse', ['This username is not allowed.', 'register']);
      return false;
    }

    password = hash.hmac(password);

    // Check if account exists in both schemas
    const existingAccount = await accounts.findOne({ username: player.name });
    const existingEnhanced = await EnhancedAccount.findOne({ username: player.name });

    if (existingAccount || existingEnhanced) {
      player.call('sendAuthResponse', [`${player.name} is already registered.`, 'register']);
      return false;
    }

    // Create enhanced account
    const newAccount = new EnhancedAccount({
      username: player.name,
      password: password,
      registered: new Date(),
      lastConnected: new Date(),
      lastDisconnected: new Date(),
      ip: player.ip,
      socialClub: player.socialClub,
      serial: player.serial || 'unknown',
      info: {
        justRegistered: true,
        level: 1,
        wallet: 1000, // Increased starting money
        bank: 75000,  // Increased starting bank money
        respect: 0,
        hoursPlayed: 0,
        admin: 0,
        warns: 0,
        muted: null,
        member: null,
        leader: null,
        rank: 0,
        fwarns: 0,
        spawn: 0,
        houseSpawn: null,
        prisonTime: 0,
        wantedLevel: 0,
        paycheck: 500,
        premium: 0,
        personalSlots: 3,
        licenses: {
          driving: false,
          weapon: false
        },
        inventory: [
          // Starting items
          {
            title: "Cell Phone",
            type: 1,
            stackable: false,
            quantity: 1,
            canBeUsed: true,
            canBeTradable: false,
            markedForTrade: false
          },
          {
            title: "Wallet",
            type: 2,
            stackable: false,
            quantity: 1,
            canBeUsed: false,
            canBeTradable: false,
            markedForTrade: false
          }
        ],
        character: null,
        online: true
      },
      stats: {
        totalConnections: 1,
        totalPlaytime: 0,
        firstConnection: new Date(),
        averageSessionLength: 0,
        longestSession: 0
      }
    });

    // Add registration security log
    newAccount.addSecurityLog('login', 'Account registered', null, player.ip);

    await newAccount.save();

    console.log(`[AUTH] New account registered: ${player.name} from ${player.ip}`);
    
    // Start character creation
    player.call('prepareCharacter');
    return true;

  } catch (error) {
    console.error('[AUTH ERROR] Registration failed:', error);
    player.call('sendAuthResponse', ['Registration failed. Please try again.', 'register']);
    return false;
  }
});

// Enhanced account loading
mp.events.add('loadAccount', async (player) => {
  try {
    // Try enhanced schema first
    let user = await EnhancedAccount.findOne({ username: player.name });
    
    // Fallback to original schema
    if (!user) {
      user = await accounts.findOne({ username: player.name });
    }

    if (!user) {
      console.error(`[AUTH ERROR] Account not found for ${player.name}`);
      player.kick('Account loading failed');
      return;
    }

    // Load player info
    player.info = user.info;
    player.lastConnected = user.lastConnected;
    player.password = user.password;

    // Update connection info
    user.lastConnected = new Date();
    if (user.set) {
      user.set({ 'info.online': true });
    } else {
      user.info.online = true;
    }
    
    await user.save();

    // Format last connection date
    const lastConnection = player.lastConnected;
    const month = (lastConnection.getMonth() + 1).toString().padStart(2, '0');
    const day = lastConnection.getDate().toString().padStart(2, '0');
    const hour = lastConnection.getHours().toString().padStart(2, '0');
    const minutes = lastConnection.getMinutes().toString().padStart(2, '0');
    const year = lastConnection.getFullYear();

    if (user.info.character != null) {
      // Existing character - spawn player
      player.loggedIn = true;
      player.call('updateAuthClient');
      player.call('authCamera', [2]);
      
      // Load game variables and spawn
      mp.events.call("loadVariables", player);
      mp.events.call("spawnPlayer", player);
      
      // Update client variables
      player.updateSecurityInfo();
      player.setVariable('money', player.info.wallet);
      player.setVariable('bank', player.info.bank);
      player.call('updateHud');

      if (player.info.justRegistered == true) {
        // First time login
        player.pushChat(`[Welcome] You have registered successfully on our server!`, null, 'server-message');
        player.pushChat(`[Info] Visit the purple checkpoint on your map to get your driving license.`, null, 'server-message');
        player.pushChat(`[Info] Type /help in chat to see available commands.`, null, 'server-message');
        player.sendMessageToAdmins(`[New Player] ${player.name} just registered from ${player.ip}`, null, 'admin-message');
        
        // Reset first time flag
        player.info.justRegistered = false;
        
        // Welcome sequence
        player.giveSubtitle(`Welcome to ~r~Los Santos~w~! Enjoy your stay.`, 30);
        player.giveSubtitle(`Visit the ~p~DMV~w~ to get your driving license.`, 30);
        player.call('createGPSBlip', [-828.446, -1086.113, 11.132, `DMV - Driving License`]);

        // Call registration events
        mp.events.call("registeredJoin", player);
      } else {
        // Returning player
        player.pushChat(`[Welcome Back] ${player.name} (ID: ${player.id})`, null, 'server-message');
        player.pushChat(`[Info] Last online: ${day}.${month}.${year} at ${hour}:${minutes}`, null, 'server-message');
        
        if (player.info.admin != 0) {
          player.pushChat(`[Staff] Logged in as Admin Level ${player.info.admin}`, null, 'admin-message');
        }

        // Show faction MOTD if applicable
        if (player.info.member != null && databox && databox[4] && databox[4].data.factions[player.info.member]) {
          const faction = databox[4].data.factions[player.info.member];
          if (faction.motd != null) {
            player.pushChat('[Faction MOTD] ' + faction.motd, null, 'faction-message');
          }
        }

        mp.events.call("loggedJoin", player);
      }
    } else {
      // No character - go to character creation
      player.call('prepareCharacter');
    }

    console.log(`[AUTH] ${player.name} account loaded successfully`);

  } catch (error) {
    console.error('[AUTH ERROR] Account loading failed:', error);
    player.kick('Account loading failed');
  }
});

// Enhanced security tracking
mp.events.add("loadVariables", player => {
  // Enhanced security info update
  player.updateSecurityInfo = async function() {
    try {
      let account = await EnhancedAccount.findOne({ username: player.name });
      if (!account) {
        account = await accounts.findOne({ username: player.name });
      }

      if (account) {
        if (account.set) {
          account.set({ 
            ip: player.ip, 
            socialClub: player.socialClub,
            serial: player.serial || 'unknown',
            lastConnected: new Date() 
          });
        } else {
          account.ip = player.ip;
          account.socialClub = player.socialClub;
          account.lastConnected = new Date();
        }
        
        await account.save();
      }
    } catch (error) {
      console.error('[AUTH ERROR] Security info update failed:', error);
    }
  };

  // Enhanced save function
  player.savePlayerInfo = async function() {
    try {
      let account = await EnhancedAccount.findOne({ username: player.name });
      if (!account) {
        account = await accounts.findOne({ username: player.name });
      }

      if (account) {
        if (account.set) {
          account.set({
            info: player.info,
            lastDisconnected: new Date()
          });
        } else {
          account.info = player.info;
          account.lastDisconnected = new Date();
        }
        
        await account.save();
        console.log(`[AUTH] Saved data for ${player.name}`);
      }
    } catch (error) {
      console.error('[AUTH ERROR] Save failed:', error);
    }
  };
});

// Cleanup on disconnect
mp.events.add("playerQuit", async (player, exitType, reason) => {
  if (player.loggedIn == true) {
    try {
      player.info.online = false;
      await player.savePlayerInfo();
      
      // Add security log for logout
      const account = await EnhancedAccount.findOne({ username: player.name });
      if (account && account.addSecurityLog) {
        account.addSecurityLog('logout', `Disconnected: ${reason}`, null, player.ip);
        await account.save();
      }
      
      mp.events.call("loggedQuit", player);
      console.log(`[AUTH] ${player.name} disconnected and data saved`);
    } catch (error) {
      console.error('[AUTH ERROR] Disconnect save failed:', error);
    }
  }
});

console.log('[AUTH] Enhanced authentication system loaded');