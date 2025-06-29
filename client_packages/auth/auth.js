let authBrowser = null;
let characterBrowser = null;

// Show login dialog
mp.events.add('showLoginDialog', () => {
  if (authBrowser) authBrowser.destroy();
  
  authBrowser = mp.browsers.new('package://auth/ui/login.html');
  mp.gui.cursor.show(true, true);
  mp.game.ui.displayRadar(false);
  mp.game.ui.displayHud(false);
});

// Hide login dialog
mp.events.add('hideLoginDialog', () => {
  if (authBrowser) {
    authBrowser.destroy();
    authBrowser = null;
  }
  mp.gui.cursor.show(false, false);
});

// Show auth error
mp.events.add('showAuthError', (message) => {
  if (authBrowser) {
    authBrowser.execute(`showError('${message}')`);
  }
});

// Prepare character creation
mp.events.add('prepareCharacter', () => {
  if (authBrowser) {
    authBrowser.destroy();
    authBrowser = null;
  }
  
  characterBrowser = mp.browsers.new('package://auth/ui/character.html');
  mp.gui.cursor.show(true, true);
  
  // Set character creation camera
  mp.events.call('setCharacterCamera');
});

// Update auth client
mp.events.add('updateAuthClient', () => {
  mp.game.ui.displayRadar(true);
  mp.game.ui.displayHud(true);
  mp.gui.cursor.show(false, false);
  
  if (characterBrowser) {
    characterBrowser.destroy();
    characterBrowser = null;
  }
});

// Set character creation camera
mp.events.add('setCharacterCamera', () => {
  const camera = mp.cameras.new('default', new mp.Vector3(402.8664, -998.5618, -99.0), new mp.Vector3(0, 0, 0), 50);
  camera.setActive(true);
  mp.game.cam.renderScriptCams(true, false, 0, true, false, 0);
});

// Chat system
mp.events.add('SendToChat', (message, color) => {
  mp.gui.chat.push(message);
});

// Subtitle system
mp.events.add('showSubtitle', (text, duration) => {
  mp.game.ui.setTextComponentFormat('STRING');
  mp.game.ui.addTextComponentString(text);
  mp.game.ui.displaySubtitle(duration * 1000, true);
});

// Login form submission
function submitLogin() {
  const login = document.getElementById('login').value;
  const password = document.getElementById('password').value;
  
  if (!login || !password) {
    showError('Please fill all fields');
    return;
  }
  
  mp.trigger('onLoginAttempt', JSON.stringify({ login, password }));
}

// Register form submission  
function submitRegister() {
  const login = document.getElementById('login').value;
  const password = document.getElementById('password').value;
  const email = document.getElementById('email').value;
  
  if (!login || !password) {
    showError('Please fill all fields');
    return;
  }
  
  mp.trigger('onRegisterAttempt', JSON.stringify({ login, password, email }));
}

// Character creation submission
function submitCharacter() {
  const characterData = {
    gender: 0, // 0 = male, 1 = female
    mother: 21,
    father: 0,
    resemblance: 0.5,
    skinTone: 0.5,
    hair: 1,
    hairColor1: 0,
    hairColor2: 0,
    eyes: 0,
    // Add more character customization options as needed
  };
  
  mp.trigger('saveCharacter', JSON.stringify(characterData));
}