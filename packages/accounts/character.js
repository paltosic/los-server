const { Account } = require('../orm/models');

// Character creation coordinates
const creatorPlayerPos = new mp.Vector3(402.8664, -996.4108, -99.00027);
const creatorPlayerHeading = -185.0;

// Handle character creation spawn request
mp.events.add('requestCharacterCreationSpawn', (player) => {
    console.log(`[CHARACTER] Setting up character creation for ${player.name}`);
    
    try {
        // Set player to character creation position
        player.position = creatorPlayerPos;
        player.heading = creatorPlayerHeading;
        player.dimension = 1000 + player.id; // Isolated dimension
        
        // Set default model based on gender (default to male)
        player.model = mp.joaat("mp_m_freemode_01");
        
        // Reset player state
        player.health = 100;
        player.armour = 0;
        
        // Apply default character appearance
        const defaultCharacter = {
            gender: 0,
            father: 0,
            mother: 21,
            resemblance: 0.5,
            skinTone: 0.5,
            hair: 1,
            hairColor1: 0,
            hairColor2: 0,
            eyes: 0,
            eyebrows: 0,
            facial: 0,
            facialColor: 0,
            ageing: 0,
            makeup: 0,
            lipstick: 0,
            lipstickColor: 0,
            top: 0,
            undershirt: 0,
            pants: 0,
            shoes: 0,
            torso: 0,
            mask: 0,
            hat: -1,
            glasses: -1
        };
        
        // Store current character data
        player.creationCharacter = defaultCharacter;
        
        // Apply default appearance
        mp.events.call('applyCharacterAppearance', player, defaultCharacter);
        
        console.log(`[CHARACTER] Character creation setup complete for ${player.name}`);
        
    } catch (error) {
        console.error('[CHARACTER] Error setting up character creation:', error);
    }
});

// Apply character appearance
mp.events.add('applyCharacterAppearance', (player, character) => {
    try {
        // Set model based on gender
        const targetModel = character.gender === 0 ? mp.joaat("mp_m_freemode_01") : mp.joaat("mp_f_freemode_01");
        
        if (player.model !== targetModel) {
            player.model = targetModel;
            
            // Small delay to ensure model is loaded
            setTimeout(() => {
                mp.events.call('applyCharacterFeatures', player, character);
            }, 500);
        } else {
            mp.events.call('applyCharacterFeatures', player, character);
        }
        
    } catch (error) {
        console.error('[CHARACTER] Error applying character appearance:', error);
    }
});

// Apply character features
mp.events.add('applyCharacterFeatures', (player, character) => {
    try {
        if (player.model !== mp.joaat("mp_m_freemode_01") && player.model !== mp.joaat("mp_f_freemode_01")) {
            console.log('[CHARACTER] Invalid model for character features');
            return;
        }
        
        // Set head blend (genetics)
        player.setHeadBlend(
            character.mother || 0, 
            character.father || 0, 
            0, 
            character.mother || 0, 
            character.father || 0, 
            0, 
            character.resemblance || 0.5, 
            character.skinTone || 0.5, 
            0.0
        );
        
        // Set head overlays
        player.setHeadOverlay(1, [
            character.facial === 0 ? -1 : character.facial, 
            1.0, 
            character.facialColor || 0, 
            character.facialColor || 0
        ]);
        
        player.setHeadOverlay(2, [
            character.eyebrows || 0, 
            1, 
            character.facialColor || 0, 
            character.facialColor || 0
        ]);
        
        player.setHeadOverlay(3, [
            character.ageing === 0 ? -1 : character.ageing, 
            1, 
            255, 
            255
        ]);
        
        player.setHeadOverlay(4, [
            character.makeup === 0 ? -1 : character.makeup, 
            1, 
            255, 
            255
        ]);
        
        player.setHeadOverlay(8, [
            character.lipstick === 0 ? -1 : character.lipstick, 
            1, 
            character.lipstickColor || 0, 
            character.lipstickColor || 0
        ]);
        
        // Set clothes
        player.setClothes(1, character.mask || 0, 0, 0);
        player.setClothes(2, character.hair || 0, 0, 0);
        player.setClothes(3, character.torso || 0, 0, 0);
        player.setClothes(11, character.top || 0, 0, 0);
        player.setClothes(4, character.pants || 0, 0, 0);
        player.setClothes(6, character.shoes || 0, 0, 0);
        player.setClothes(8, character.undershirt || 0, 0, 0);
        
        // Set props
        player.setProp(0, (character.hat !== undefined && character.hat >= 0) ? character.hat : -1, 0);
        player.setProp(1, (character.glasses !== undefined && character.glasses >= 0) ? character.glasses : -1, 0);
        
        // Set colors
        player.setHairColor(character.hairColor1 || 0, character.hairColor2 || 0);
        player.eyeColor = character.eyes || 0;
        
        console.log(`[CHARACTER] Features applied for ${player.name}`);
        
    } catch (error) {
        console.error('[CHARACTER] Error applying character features:', error);
    }
});

// Handle character preview updates
mp.events.add('updateCharacterPreview', (player, characterData) => {
    try {
        const character = JSON.parse(characterData);
        
        // Store current character data
        player.creationCharacter = character;
        
        // Apply appearance in real-time
        mp.events.call('applyCharacterAppearance', player, character);
        
        console.log(`[CHARACTER] Preview updated for ${player.name}`);
        
    } catch (error) {
        console.error('[CHARACTER] Preview update failed:', error);
    }
});

mp.events.add('saveCharacter', async (player, characterData) => {
    try {
        if (!player.account) {
            return player.call('showAuthError', ['Account not found']);
        }

        const character = JSON.parse(characterData);
        
        // Validate character data
        if (character.gender !== 0 && character.gender !== 1) {
            character.gender = 0;
        }
        
        // Save to database
        await player.account.update({ 
            character: JSON.stringify(character)
        });
        
        console.log(`[CHARACTER] Character saved for ${player.account.login}`);
        
        // Load account after character creation
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
                
                try {
                    player.call('showSubtitle', [`Welcome to Los Santos! Enjoy your stay.`, 30]);
                } catch (error) {
                    console.log('[CHARACTER] Subtitle error:', error);
                }
                
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

// Enhanced load variables
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

    player.checkAdminRank = function(level) {
        return (player.info && player.info.admin >= level);
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

// Enhanced clothing system for normal gameplay
mp.events.add('loadClothes', (player) => {
    let char = player.info.character;
    if (!char) return;

    mp.events.call('applyCharacterFeatures', player, char);
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

// Debug commands
mp.events.addCommand('testchar', (player) => {
    console.log(`[DEBUG] Testing character for ${player.name}`);
    player.call('prepareCharacter');
});

mp.events.addCommand('reloadchar', (player) => {
    if (player.info && player.info.character) {
        mp.events.call("loadClothes", player);
        player.pushChat('Character appearance reloaded.');
    }
});