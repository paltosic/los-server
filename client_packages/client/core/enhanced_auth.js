// File: C:\Users\vnagu\Desktop\servera\proget5\server-files\client_packages\client\core\enhanced_auth.js

// Enhanced authentication with better UI and error handling
let authenticationState = {
  isAuthenticating: false,
  attempts: 0,
  maxAttempts: 5,
  lastAttempt: 0,
  cooldownTime: 3000 // 3 seconds between attempts
};

// Enhanced auth camera event with smooth transitions
mp.events.add('authCamera', (stage, path) => {
  if (stage == 1) {
    // Setup authentication environment
    player.position = new mp.Vector3(-1263.4312744140625, -716.9706420898438, 30);
    
    // Create camera with smooth movement
    camera = mp.cameras.new("authCamera", 
      new mp.Vector3(-1263.4312744140625, -716.9706420898438, 65.55624389648438), 
      new mp.Vector3(0, 0, 30), 30
    );
    camera.pointAtCoord(new mp.Vector3(-1075.4251708984375, -1276.5439453125, 4.83953857421875));
    camera.setActive(true);
    
    // Smooth camera transition
    mp.game.cam.renderScriptCams(true, true, 3000, true, false);
    
    // Setup UI environment
    mp.gui.chat.show(false);
    mp.gui.cursor.show(true, true);
    mp.game.ui.displayRadar(false);
    mp.game.ui.displayAreaName(false);
    mp.game.ui.displayCash(false);
    player.freezePosition(true);
    
    // Create enhanced browser with loading screen
    browser = mp.browsers.new(cefDomain + '/auth');
    
    // Setup authentication interface
    setTimeout(() => {
      if (browser && mp.browsers.exists(browser)) {
        browser.execute(`initializeAuth('${path}');`);
        browser.execute(`setAuthMethod('${path}');`);
      }
    }, 500);
    
    // Apply cinematic effects
    mp.game.graphics.setTimecycleModifier('hud_def_blur');
    
    // Reset authentication state
    authenticationState.isAuthenticating = false;
    authenticationState.attempts = 0;
    
    // Play ambient sound
    mp.game.audio.playAmbientSpeech("GENERIC_HI", "s_m_y_dealer_01", "SPEECH_PARAMS_FORCE_NORMAL");
    
    console.log(`[AUTH CLIENT] Authentication cleanup completed`);
  }
});

// Enhanced login data sender with validation
mp.events.add('sendLoginData', (password) => {
  // Validate input
  if (!password || password.length < 1) {
    showAuthError('Please enter a password');
    return;
  }

  // Check rate limiting
  const now = Date.now();
  if (now - authenticationState.lastAttempt < authenticationState.cooldownTime) {
    const remaining = Math.ceil((authenticationState.cooldownTime - (now - authenticationState.lastAttempt)) / 1000);
    showAuthError(`Please wait ${remaining} seconds before trying again`);
    return;
  }

  // Check attempt limits
  if (authenticationState.attempts >= authenticationState.maxAttempts) {
    showAuthError('Too many failed attempts. Please restart your game.');
    return;
  }

  // Set authentication state
  authenticationState.isAuthenticating = true;
  authenticationState.lastAttempt = now;
  authenticationState.attempts++;

  // Show loading state
  if (browser && mp.browsers.exists(browser)) {
    browser.execute(`setLoadingState(true, 'Logging in...');`);
  }

  // Send to server
  mp.events.callRemote("receiveLoginData", password);
  console.log(`[AUTH CLIENT] Login attempt ${authenticationState.attempts}/${authenticationState.maxAttempts}`);
});

// Enhanced registration data sender with validation
mp.events.add('sendRegisterData', (password, confirmPassword, email) => {
  // Input validation
  if (!password || password.length < 6) {
    showAuthError('Password must be at least 6 characters long');
    return;
  }

  if (password !== confirmPassword) {
    showAuthError('Passwords do not match');
    return;
  }

  if (email && !isValidEmail(email)) {
    showAuthError('Please enter a valid email address');
    return;
  }

  // Check rate limiting
  const now = Date.now();
  if (now - authenticationState.lastAttempt < authenticationState.cooldownTime) {
    const remaining = Math.ceil((authenticationState.cooldownTime - (now - authenticationState.lastAttempt)) / 1000);
    showAuthError(`Please wait ${remaining} seconds before trying again`);
    return;
  }

  // Set authentication state
  authenticationState.isAuthenticating = true;
  authenticationState.lastAttempt = now;

  // Show loading state
  if (browser && mp.browsers.exists(browser)) {
    browser.execute(`setLoadingState(true, 'Creating account...');`);
  }

  // Send to server
  mp.events.callRemote("receiveRegisterData", password, email);
  console.log(`[AUTH CLIENT] Registration attempt for ${player.name}`);
});

// Enhanced auth response handler
mp.events.add('sendAuthResponse', (data, target) => {
  authenticationState.isAuthenticating = false;
  
  if (browser && mp.browsers.exists(browser)) {
    browser.execute(`setLoadingState(false);`);
    browser.execute(`showAuthError('${data}');`);
  }
  
  console.log(`[AUTH CLIENT] Auth response: ${data} for ${target}`);
});

// Load ban client with enhanced UI
mp.events.add('loadBanClient', () => {
  mp.gui.chat.show(false);
  
  // Create HUD for ban screen
  hud = mp.browsers.new(cefDomain + '/hud');
  hud.markAsChat();
  
  // Apply visual effects
  mp.game.graphics.setTimecycleModifier('hud_def_blur');
  
  // Setup ban camera
  player.position = new mp.Vector3(-1263.4312744140625, -716.9706420898438, 30);
  camera = mp.cameras.new("banCamera", 
    new mp.Vector3(-1263.4312744140625, -716.9706420898438, 65.55624389648438), 
    new mp.Vector3(0, 0, 30), 30
  );
  camera.pointAtCoord(new mp.Vector3(-1075.4251708984375, -1276.5439453125, 4.83953857421875));
  camera.setActive(true);
  mp.game.cam.renderScriptCams(true, false, 0, true, false);
  
  // Setup UI
  mp.gui.cursor.show(true, true);
  mp.game.ui.displayRadar(false);
  mp.game.ui.displayAreaName(false);
  mp.game.ui.displayCash(true);
  player.freezePosition(true);
  
  console.log(`[AUTH CLIENT] Ban screen loaded`);
});

// Enhanced browser destruction
mp.events.add('destroyBrowserAuth', () => {
  if (mp.browsers.exists(browser)) { 
    browser.destroy(); 
    browser = null;
  }
  console.log(`[AUTH CLIENT] Auth browser destroyed`);
});

// Helper functions
function showAuthError(message) {
  if (browser && mp.browsers.exists(browser)) {
    browser.execute(`showAuthError('${message}');`);
  }
  console.log(`[AUTH CLIENT ERROR] ${message}`);
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Enhanced security features
mp.events.add('authSecurityCheck', () => {
  // Basic security validation
  const currentTime = Date.now();
  
  // Check for rapid authentication attempts
  if (authenticationState.attempts > authenticationState.maxAttempts) {
    mp.events.callRemote('reportSuspiciousActivity', 'excessive_auth_attempts');
  }
  
  // Validate browser existence
  if (authenticationState.isAuthenticating && (!browser || !mp.browsers.exists(browser))) {
    console.log('[AUTH CLIENT SECURITY] Browser validation failed');
    authenticationState.isAuthenticating = false;
  }
});

// Run security check every 30 seconds
setInterval(() => {
  mp.events.call('authSecurityCheck');
}, 30000);

// Enhanced keyboard handling for auth
mp.keys.bind(0x0D, true, function() { // Enter key
  if (browser && mp.browsers.exists(browser)) {
    browser.execute(`handleEnterKey();`);
  }
});

mp.keys.bind(0x1B, true, function() { // Escape key
  if (browser && mp.browsers.exists(browser)) {
    browser.execute(`handleEscapeKey();`);
  }
});

// Connection quality monitoring
let connectionQuality = {
  ping: 0,
  lastUpdate: Date.now(),
  status: 'good'
};

setInterval(() => {
  const currentPing = mp.game.network.getNetworkTime();
  connectionQuality.ping = currentPing;
  connectionQuality.lastUpdate = Date.now();
  
  if (currentPing > 200) {
    connectionQuality.status = 'poor';
  } else if (currentPing > 100) {
    connectionQuality.status = 'fair';
  } else {
    connectionQuality.status = 'good';
  }
  
  // Update auth interface if active
  if (browser && mp.browsers.exists(browser)) {
    browser.execute(`updateConnectionStatus('${connectionQuality.status}', ${connectionQuality.ping});`);
  }
}, 2000);

// Enhanced notification system for auth
function notifyAuthStatus(message, type = 'info') {
  const colors = {
    'info': '#3498db',
    'success': '#2ecc71',
    'warning': '#f39c12',
    'error': '#e74c3c'
  };
  
  const color = colors[type] || colors['info'];
  
  if (browser && mp.browsers.exists(browser)) {
    browser.execute(`showNotification('${message}', '${type}', '${color}');`);
  }
}

// Export functions for browser use
global.sendLoginData = (password) => {
  mp.events.call('sendLoginData', password);
};

global.sendRegisterData = (password, confirmPassword, email) => {
  mp.events.call('sendRegisterData', password, confirmPassword, email);
};

global.getConnectionQuality = () => {
  return connectionQuality;
};

console.log('[AUTH CLIENT] Enhanced authentication client loaded');.log(`[AUTH CLIENT] Authentication interface loaded for ${path}`);
  }
  else if (stage == 2) {
    // Cleanup authentication interface with smooth transitions
    mp.game.cam.renderScriptCams(false, true, 3000, false, false);
    mp.gui.cursor.show(false, false);
    mp.game.ui.displayRadar(true);
    mp.game.ui.displayCash(true);
    player.freezePosition(false);
    
    // Destroy browser safely
    if (mp.browsers.exists(browser)) { 
      browser.destroy(); 
      browser = null;
    }
    
    // Reset game state
    showMoney = true;
    mp.game.graphics.setTimecycleModifier('default');
    
    // Initialize HUD if needed
    if (hud == null) {
      hud = mp.browsers.new(cefDomain + '/hud');
      hud.markAsChat();
    }
    
    console