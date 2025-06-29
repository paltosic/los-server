// Add this to your main client index.js for debugging
setInterval(() => {
    console.log('[DEBUG] Client is running...');
}, 10000);

mp.events.add('render', () => {
    console.log('[DEBUG] Client render event fired');
});