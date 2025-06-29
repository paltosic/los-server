let authBrowser = null;
let characterBrowser = null;
let characterCamera = null;
let characterCameraTarget = null;
let isInCharacterCreation = false;

// Character creation coordinates
const creatorCoords = {
    camera: new mp.Vector3(402.9783020019531, -999.0242309570312, -99.0415802001953),
    cameraLookAt: new mp.Vector3(402.8664, -996.4108, -98.5)
};

console.log('[CLIENT AUTH] Auth module initializing...');

// Show login dialog
mp.events.add('showLoginDialog', () => {
    console.log('[CLIENT AUTH] Showing login dialog');
    
    if (authBrowser) {
        authBrowser.destroy();
        authBrowser = null;
    }
    
    authBrowser = mp.browsers.new('package://auth/ui/login.html');
    mp.gui.cursor.show(true, true);
    mp.game.ui.displayRadar(false);
    mp.game.ui.displayHud(false);
    
    console.log('[CLIENT AUTH] Login dialog created');
});

// Hide login dialog
mp.events.add('hideLoginDialog', () => {
    console.log('[CLIENT AUTH] Hiding login dialog');
    
    if (authBrowser) {
        authBrowser.destroy();
        authBrowser = null;
    }
    mp.gui.cursor.show(false, false);
});

// Show auth error
mp.events.add('showAuthError', (message) => {
    console.log('[CLIENT AUTH] Showing error:', message);
    
    if (authBrowser) {
        authBrowser.execute(`showError('${message.replace(/'/g, "\\\'")}')`);
    }
});

// Prepare character creation
mp.events.add('prepareCharacter', () => {
    console.log('[CLIENT AUTH] Preparing character creation');
    
    if (authBrowser) {
        authBrowser.destroy();
        authBrowser = null;
    }
    
    // Set character creation mode
    isInCharacterCreation = true;
    
    characterBrowser = mp.browsers.new('package://auth/ui/character.html');
    mp.gui.cursor.show(true, true);
    mp.game.ui.displayRadar(false);
    mp.game.ui.displayHud(false);
    
    // Set character creation camera
    mp.events.call('setCharacterCamera');
    
    // Request character creation spawn
    mp.events.callRemote('requestCharacterCreationSpawn');
});

// Update auth client
mp.events.add('updateAuthClient', () => {
    console.log('[CLIENT AUTH] Updating auth client - login successful');
    
    // Cleanup character creation
    mp.events.call('cleanupCharacterCreation');
    
    mp.game.ui.displayRadar(true);
    mp.game.ui.displayHud(true);
    mp.gui.cursor.show(false, false);
    
    if (characterBrowser) {
        characterBrowser.destroy();
        characterBrowser = null;
    }
    
    if (authBrowser) {
        authBrowser.destroy();
        authBrowser = null;
    }
});

// Set character creation camera
mp.events.add('setCharacterCamera', () => {
    console.log('[CLIENT AUTH] Setting character creation camera');
    
    try {
        // Destroy existing camera if any
        if (characterCamera) {
            characterCamera.setActive(false);
            characterCamera.destroy();
            characterCamera = null;
        }
        
        // Create new camera
        characterCamera = mp.cameras.new('default', 
            creatorCoords.camera, 
            new mp.Vector3(0, 0, 0), 
            50
        );
        
        // Point camera at character position
        characterCamera.pointAtCoord(
            creatorCoords.cameraLookAt.x,
            creatorCoords.cameraLookAt.y,
            creatorCoords.cameraLookAt.z
        );
        
        characterCamera.setActive(true);
        mp.game.cam.renderScriptCams(true, false, 0, true, false, 0);
        
        console.log('[CLIENT AUTH] Character camera set successfully');
        
    } catch (error) {
        console.error('[CLIENT AUTH] Error setting camera:', error);
    }
});

// Cleanup character creation
mp.events.add('cleanupCharacterCreation', () => {
    console.log('[CLIENT AUTH] Cleaning up character creation');
    
    isInCharacterCreation = false;
    
    // Destroy camera
    if (characterCamera) {
        characterCamera.setActive(false);
        characterCamera.destroy();
        characterCamera = null;
    }
    
    // Restore normal camera
    mp.game.cam.renderScriptCams(false, false, 0, true, false, 0);
});

// Rotate character camera
mp.events.add('rotateCharacterCamera', (direction) => {
    if (!characterCamera || !isInCharacterCreation) return;
    
    try {
        const currentPos = characterCamera.getCoord();
        const centerPoint = creatorCoords.cameraLookAt;
        
        // Calculate current angle
        const deltaX = currentPos.x - centerPoint.x;
        const deltaY = currentPos.y - centerPoint.y;
        let currentAngle = Math.atan2(deltaY, deltaX);
        
        // Rotate by 15 degrees
        const rotationAmount = direction * (Math.PI / 12); // 15 degrees in radians
        const newAngle = currentAngle + rotationAmount;
        
        // Calculate new position (maintain same distance from center)
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const newX = centerPoint.x + Math.cos(newAngle) * distance;
        const newY = centerPoint.y + Math.sin(newAngle) * distance;
        
        // Update camera position
        characterCamera.setCoord(newX, newY, currentPos.z);
        characterCamera.pointAtCoord(centerPoint.x, centerPoint.y, centerPoint.z);
        
    } catch (error) {
        console.error('[CLIENT AUTH] Error rotating camera:', error);
    }
});

// Chat system
mp.events.add('SendToChat', (message, color) => {
    mp.gui.chat.push(message);
});

// Fixed subtitle system
mp.events.add('showSubtitle', (text, duration) => {
    try {
        mp.game.ui.setTextComponentFormat('STRING');
        mp.game.ui.addTextComponentSubstringPlayerName(text);
        mp.game.ui.endTextCommandDisplaySubtitle(duration * 1000, true);
    } catch (error) {
        console.log('[CLIENT AUTH] Subtitle error, using chat instead:', error);
        mp.gui.chat.push(`[INFO] ${text}`);
    }
});

// Handle login attempt from browser
mp.events.add('browserLoginAttempt', (data) => {
    console.log('[CLIENT AUTH] Browser login attempt:', data);
    mp.events.callRemote('onLoginAttempt', data);
});

// Handle register attempt from browser
mp.events.add('browserRegisterAttempt', (data) => {
    console.log('[CLIENT AUTH] Browser register attempt:', data);
    mp.events.callRemote('onRegisterAttempt', data);
});

// Handle character creation from browser
mp.events.add('browserSaveCharacter', (data) => {
    console.log('[CLIENT AUTH] Browser character save:', data);
    mp.events.callRemote('saveCharacter', data);
});

// Handle character preview updates from browser
mp.events.add('browserUpdateCharacter', (data) => {
    console.log('[CLIENT AUTH] Browser character update:', data);
    mp.events.callRemote('updateCharacterPreview', data);
});

// Handle camera rotation from browser
mp.events.add('browserRotateCamera', (direction) => {
    mp.events.call('rotateCharacterCamera', direction);
});


// Handle keyboard input for character creation
mp.keys.bind(0x41, true, () => { // A key
    if (isInCharacterCreation) {
        mp.events.call('rotateCharacterCamera', -1);
    }
});

mp.keys.bind(0x44, true, () => { // D key
    if (isInCharacterCreation) {
        mp.events.call('rotateCharacterCamera', 1);
    }
});

// Initial distance between camera and lookAt point
const initialDistance = Math.sqrt(
    Math.pow(creatorCoords.camera.x - creatorCoords.cameraLookAt.x, 2) +
    Math.pow(creatorCoords.camera.y - creatorCoords.cameraLookAt.y, 2) +
    Math.pow(creatorCoords.camera.z - creatorCoords.cameraLookAt.z, 2)
);

// Zoom factor (adjust for speed)
const zoomStep = 0.1;
const maxZoomSteps = 10;

// Handle zoom in/out with W and S keys
mp.keys.bind(0x57, true, () => { // W key - zoom in
    if (isInCharacterCreation && characterCamera) {
        try {
            const currentPos = characterCamera.getCoord();
            const centerPoint = creatorCoords.cameraLookAt;

            // Calculate current distance
            const currentDistance = Math.sqrt(
                Math.pow(currentPos.x - centerPoint.x, 2) +
                Math.pow(currentPos.y - centerPoint.y, 2) +
                Math.pow(currentPos.z - centerPoint.z, 2)
            );

            // Allow zoom in only if distance is greater than minimum allowed
            if (currentDistance > initialDistance - maxZoomSteps * zoomStep) {
                // Vector from camera to center
                const vectorX = centerPoint.x - currentPos.x;
                const vectorY = centerPoint.y - currentPos.y;
                const vectorZ = centerPoint.z - currentPos.z;

                // New camera position closer to center
                const newX = currentPos.x + vectorX * zoomStep;
                const newY = currentPos.y + vectorY * zoomStep;
                const newZ = currentPos.z + vectorZ * zoomStep;

                characterCamera.setCoord(newX, newY, newZ);
                characterCamera.pointAtCoord(centerPoint.x, centerPoint.y, centerPoint.z);
            }
        } catch (error) {
            console.error('[CLIENT AUTH] Error zooming in camera:', error);
        }
    }
});

mp.keys.bind(0x53, true, () => { // S key - zoom out
    if (isInCharacterCreation && characterCamera) {
        try {
            const currentPos = characterCamera.getCoord();
            const centerPoint = creatorCoords.cameraLookAt;

            // Calculate current distance
            const currentDistance = Math.sqrt(
                Math.pow(currentPos.x - centerPoint.x, 2) +
                Math.pow(currentPos.y - centerPoint.y, 2) +
                Math.pow(currentPos.z - centerPoint.z, 2)
            );

            // Allow zoom out only if distance is less than maximum allowed
            if (currentDistance < initialDistance + maxZoomSteps * zoomStep) {
                // Vector from camera to center
                const vectorX = currentPos.x - centerPoint.x;
                const vectorY = currentPos.y - centerPoint.y;
                const vectorZ = currentPos.z - centerPoint.z;

                // New camera position farther from center
                const newX = currentPos.x + vectorX * zoomStep;
                const newY = currentPos.y + vectorY * zoomStep;
                const newZ = currentPos.z + vectorZ * zoomStep;

                characterCamera.setCoord(newX, newY, newZ);
                characterCamera.pointAtCoord(centerPoint.x, centerPoint.y, centerPoint.z);
            }
        } catch (error) {
            console.error('[CLIENT AUTH] Error zooming out camera:', error);
        }
    }
});

// Disable controls during character creation
mp.events.add('render', () => {
    if (isInCharacterCreation) {
        // Disable movement controls
        mp.game.controls.disableControlAction(0, 30, true); // Move Left/Right
        mp.game.controls.disableControlAction(0, 31, true); // Move Forward/Back
        mp.game.controls.disableControlAction(0, 32, true); // Move Up
        mp.game.controls.disableControlAction(0, 33, true); // Move Down
        mp.game.controls.disableControlAction(0, 34, true); // Look Left/Right
        mp.game.controls.disableControlAction(0, 35, true); // Look Up/Down
        mp.game.controls.disableControlAction(0, 266, true); // Look Behind
        mp.game.controls.disableControlAction(0, 267, true); // Look Behind Alt
        
        // Keep cursor enabled
        mp.game.controls.disableControlAction(0, 1, true); // Look Left/Right Mouse
        mp.game.controls.disableControlAction(0, 2, true); // Look Up/Down Mouse
    }
});

console.log('[CLIENT AUTH] Enhanced auth events registered');