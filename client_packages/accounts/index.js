let loginBrowser;
let vector = { x: 211.5498504638672, y: -927.4462890625, z: 54.709598541259766}
// let vector = { x: 213.3044891357422, y: -925.9388427734375, z: 54.17511749267578}
let loginCamera = mp.cameras.new('start' , vector, new mp.Vector3(-20,0,0),40);

mp.events.add('showLoginDialog', () => {
  loginCamera.setActive(true);
  mp.game.cam.renderScriptCams(true, false, 0, true, false);

  mp.game.ui.displayHud(false);
  mp.game.ui.displayRadar(false);

  loginBrowser = mp.browsers.new('package://accounts/cef/index.html');
  loginBrowser.execute("mp.invoke('focus', true)");
  mp.gui.chat.activate(false);
});

mp.events.add('hideLoginDialog', () => {
  loginCamera.setActive(false);
  mp.game.cam.renderScriptCams(false, false, 0, true, false);
  
  mp.game.ui.displayHud(true);
  mp.game.ui.displayRadar(true);
  mp.gui.chat.activate(true);

  loginBrowser.execute("mp.invoke('focus', false)");
  loginBrowser.active = false;
});

mp.events.add('loginAttempt', (data) => {
    mp.events.callRemote('onLoginAttempt', data);
});

mp.events.add('registerAttempt', (data) => {
    mp.events.callRemote('onRegisterAttempt', data);
});

mp.events.add('showAuthError', (errorMessage) => {
  loginBrowser.execute(`showError("${errorMessage}")`);
});


