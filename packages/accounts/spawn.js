const spawns = {
  general: [
    [-1041.917, -2745.744, 21.359, 330.450]
  ]
};

mp.events.add("spawnPlayer", (player) => {
    console.log(`[SPAWN] Spawning player ${player.name}`);
    
    // Clear character creation data
    if (player.creationCharacter) {
        delete player.creationCharacter;
    }
    
    // Choose random spawn point
    let chosenSpawn = Math.floor(Math.random() * spawns.general.length);
    let spawn = spawns.general[chosenSpawn];
    
    player.spawn(new mp.Vector3(spawn[0], spawn[1], spawn[2]));
    player.position = new mp.Vector3(spawn[0], spawn[1], spawn[2]);
    player.heading = spawn[3];
    player.health = 100;
    player.armour = 0;
    player.dimension = 0; // Back to main world
    
    // Set character model based on saved character
    if (player.info.character && player.info.character.gender !== undefined) {
        player.model = player.info.character.gender === 0 ? 
            mp.joaat("mp_m_freemode_01") : 
            mp.joaat("mp_f_freemode_01");
    } else {
        player.model = mp.joaat("mp_m_freemode_01");
    }
    
    // Apply character appearance
    setTimeout(() => {
        mp.events.call("loadClothes", player);
    }, 1000);
    
    console.log(`[SPAWN] ${player.account ? player.account.login : player.name} spawned at ${spawn[0]}, ${spawn[1]}, ${spawn[2]}`);
});