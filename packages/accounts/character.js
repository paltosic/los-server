const { Account } = require('../orm/models');

mp.events.add('saveCharacter', async (player, characterData) => {
  try {
    if (!player.account) {
      return player.call('showAuthError', ['Account not found']);
    }

    const character = JSON.parse(characterData);
    
    await player.account.update({ 
      character: JSON.stringify(character)
    });
    
    console.log(`[CHARACTER] Character created for ${player.account.login}`);
    mp.events.call("loadAccount", player);

  } catch (error) {
    console.error('[CHARACTER] Creation failed:', error);
    player.call('showAuthError', ['Character creation failed']);
  }
});

mp.events.add('loadAccount', async (player) => {
  try {
    if (!player.account) {
      return player.kick('Account data not found');
    }

    const account = player.account;
    
    // Convert database data to game format
    player.info = {
      justRegistered: account.justRegistered || false,
      level: account.level || 1,
      wallet: account.wallet || 1000,
      bank: account.bank || 75000,
      respect: account.respect || 0,
      hoursPlayed: account.hoursPlayed || 0,
      admin: account.admin || 0,
      warns: account.warns || 0,
      inventory: account.inventory ? JSON.parse(account.inventory) : [],
      character: account.character ? JSON.parse(account.character) : null,
      online: true
    };

    if (player.info.character != null) {
      // Character exists - spawn player
      player.loggedIn = true;
      player.call('updateAuthClient');
      
      mp.events.call("loadVariables", player);
      mp.events.call("spawnPlayer", player);
      
      player.setVariable('money', player.info.wallet);
      player.setVariable('bank', player.info.bank);

      if (player.info.justRegistered == true) {
        // First time login
        player.pushChat(`Welcome! You have successfully registered!`);
        player.pushChat(`Visit the driving school to get your license.`);
        
        await account.update({ justRegistered: false });
        player.info.justRegistered = false;
        
        player.giveSubtitle(`Welcome to ~r~Los Santos~w~! Enjoy your stay.`, 30);
        mp.events.call("registeredJoin", player);
      } else {
        // Returning player
        const lastConnection = account.lastConnected || new Date();
        const dateString = lastConnection.toLocaleDateString();
        const timeString = lastConnection.toLocaleTimeString();
        
        player.pushChat(`Welcome back ${player.account.login}!`);
        player.pushChat(`Last online: ${dateString} at ${timeString}`);
        
        mp.events.call("loggedJoin", player);
      }
    } else {
      // No character - go to character creation
      player.call('prepareCharacter');
    }

  } catch (error) {
    console.error('[CHARACTER] Account loading failed:', error);
    player.kick('Account loading error');
  }
});

mp.events.add("loadVariables", (player) => {
  // Helper functions
  player.haveMoney = function(amount) {
    return player.info.wallet >= amount;
  };

  player.takeMoney = function(amount) {
    if (player.haveMoney(amount)) {
      player.info.wallet -= amount;
      player.setVariable('money', player.info.wallet);
      return true;
    }
    return false;
  };

  player.giveMoney = function(amount) {
    player.info.wallet += amount;
    player.setVariable('money', player.info.wallet);
  };

  player.pushChat = function(message, color) {
    player.call('SendToChat', [message, color || '#FFFFFF']);
  };

  player.giveSubtitle = function(text, duration) {
    player.call('showSubtitle', [text, duration]);
  };

  player.savePlayerInfo = async function() {
    try {
      if (player.account && player.info) {
        await player.account.update({
          level: player.info.level,
          wallet: player.info.wallet,
          bank: player.info.bank,
          respect: player.info.respect,
          hoursPlayed: player.info.hoursPlayed,
          character: player.info.character ? JSON.stringify(player.info.character) : null,
          inventory: player.info.inventory ? JSON.stringify(player.info.inventory) : '[]',
          lastDisconnected: new Date(),
          online: false
        });
      }
    } catch (error) {
      console.error('[CHARACTER] Save error:', error);
    }
  };
});

mp.events.add('loadClothes', (player) => {
  let char = player.info.character;
  if (!char) return;

  if (player.model == mp.joaat("mp_m_freemode_01") || player.model == mp.joaat("mp_f_freemode_01")) {
    // Apply character appearance
    player.setClothes(2, char.hair || 0, 0, 0);
    player.setClothes(11, char.top || 0, 0, 0);
    player.setClothes(4, char.pants || 0, 0, 0);
    player.setClothes(6, char.shoes || 0, 0, 0);
    
    player.setHairColor(char.hairColor1 || 0, char.hairColor2 || 0);
    player.eyeColor = char.eyes || 0;
    player.setHeadBlend(
      char.mother || 0, 
      char.father || 0, 
      0, 
      char.mother || 0, 
      char.father || 0, 
      0, 
      char.resemblance || 0.5, 
      char.skinTone || 0.5, 
      0.0
    );
  }
});

mp.events.add('registeredJoin', (player) => {
  console.log(`[CHARACTER] ${player.account.login} completed registration`);
});

mp.events.add('loggedJoin', (player) => {
  console.log(`[CHARACTER] ${player.account.login} logged in`);
});

mp.events.add("playerQuit", async (player, exitType, reason) => {
  if (player.loggedIn == true && player.account) {
    try {
      await player.account.update({ online: false });
      await player.savePlayerInfo();
      console.log(`[CHARACTER] ${player.account.login} disconnected`);
    } catch (error) {
      console.error('[CHARACTER] Disconnect save error:', error);
    }
  }
});