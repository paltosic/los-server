// Client side script for Taxi Job Driver

// Event to start the taxi job UI and logic
mp.events.add('startTaxiJob', () => {
    mp.gui.chat.push("Taxi Job started. Go to the marked location to pick up clients.");
    // Additional UI and logic to be implemented here
});

// Event to set GPS blip for taxi job
mp.events.add('setTaxiJobBlip', (x, y, z) => {
    // Create or update GPS blip on client map
    // Implementation depends on client API
    mp.gui.chat.push(`GPS Blip set at: ${x}, ${y}, ${z}`);
});

// Event to notify client of job progress or payment
mp.events.add('taxiJobNotification', (message) => {
    mp.gui.chat.push(message);
});

// Additional client side event handlers and UI logic for taxi job can be added here
let vehicleTaxiSpawns = [
  [915.535, -170.851, 74.007, -0.44753211736679077, 2.864739418029785, 100.2274169921875],
  [917.479, -167.347, 74.156, -1.6691068410873413, 3.896448850631714, 99.70541381835938],
  [919.677, -163.721, 74.407, -0.8644842505455017, 2.224748134613037, 98.28567504882812],
  [913.932, -160.352, 74.353, -3.5400452613830566, 2.2609126567840576, 195.3765106201172],
  [911.649, -163.745, 73.975, -3.431643009185791, 4.500588417053223, 193.9409637451172],
  [899.928, -180.717, 73.466, 0.33203914761543274, 2.8437087535858154, 237.38009643554688],
  [897.836, -183.710, 73.381, 0.15592646598815918, 1.768542766571045, 237.74526977539062],
  [908.428, -183.183, 73.771, -0.9946990013122559, 0.9544326066970825, 59.7376708984375],
  [906.941, -186.461, 73.628, -2.10268497467041, 2.351876735687256, 58.481964111328125],
  [904.874, -188.820, 73.436, -1.7197872400283813, 1.8219612836837769, 60.093231201171875],
  [903.084, -191.757, 73.405, 0.21874195337295532, 0.04079774022102356, 58.70751953125]
]