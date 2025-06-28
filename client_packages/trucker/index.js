/////////////////////////////////////////////////////////////
                    /* ВАЖНЫЕ ПЕРМЕННЫЕ */
let colshape;
let colshapeMarker;
let colshapeMarkerVeh;
let trackMarker;
let trackColshape;
let showWork;
let playerLocal = mp.players.local
let workStatus = 0;
let muleSpawn = { x: 867.3721313476562, y: -2986.31494140625, z: 5.969782829284668, heading: -90.21881103515625}
let trackSpawn = { x: 1204.945068359375, y: -3102.91064453125, z: 5.777858734130859}
const markerPos = { x: 798.9253540039062, y: -2975.787109375, z: 3.940936489105225 }
let redColor = [255,0,0,100]

let workVehicle = null;

let truckerBlip = mp.blips.new(477, new mp.Vector3(markerPos, markerPos, markerPos),
    {
        name: 'Trucker',
        color: 4,
        shortRange: true,
});
                    /* ВАЖНЫЕ ПЕРМЕННЫЕ */                  
/////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////
                    /* РАЗНЫЕ ФУНКЦИИ */
const playerInitWork = (marker) => {
    colshapeSphere = mp.colshapes.newSphere(marker.x, marker.y ,marker.z+1, 2)
    colshapeMarker = mp.markers.new(1, [marker.x+1, marker.y, marker.z+1], 1, {color: redColor});
    mp.peds.new(
        mp.game.joaat('cs_dreyfuss'), 
        [marker.x+1, marker.y+0.5, marker.z+2.1, 1],
        180.0,
        playerLocal.dimension
    );
}
const beginWork = () => {
    showWork.execute("mp.invoke('focus', false)")
    showWork.active = false
    mp.game.graphics.stopScreenEffect("ChopVision")
    mp.gui.chat.activate(true)
}
const workNotify = (msgText) => {
    mp.game.ui.setNotificationTextEntry('STRING');
    mp.game.ui.setNotificationMessage('CHAR_RON', 'CHAR_RON', false, 2, 'Новое сообщение', msgText);
};
const spawnVehiclesForWork = (carName, carSpawn) => {
    workVehicle = mp.vehicles.new(mp.game.joaat(carName), carSpawn, {heading: carSpawn.heading, numberPlate : "Trucker"})
    colshapeMarkerVeh = mp.markers.new(39, [carSpawn.x, carSpawn.y, carSpawn.z+5], 5, {color: redColor});
    // muleSpawn.setRoute(true);


}
const startColshape = () => {
    showWork = mp.browsers.new('package://trucker/cef/index.html')
    showWork.execute("mp.invoke('focus', true)")
    mp.gui.chat.activate(false)
    mp.game.graphics.startScreenEffect("ChopVision", 0, true)
}

const setCheckPoint = () => {
    trackColshape = mp.colshapes.newSphere(trackSpawn.x, trackSpawn.y, trackSpawn.z, 3)
    trackMarker = mp.markers.new(1, [trackSpawn.x, trackSpawn.y, trackSpawn.z-2], 3, {color: redColor, visible: true});
    trackBlip = mp.blips.new(431, [trackSpawn.x, trackSpawn.y, trackSpawn.z], {shortRange: false});
    trackBlip.setRoute(true);
}
const vehicleCheck = () => {
    // if(!playerLocal.vehicle) {
    //     workNotify('Вы не можете доставить груз на ногах!')
    //     return false;
    // }
    if(playerLocal.vehicle !== workVehicle) {
        workNotify('Вы должны быть в рабочем транспортном средстве!')
        return false;
    }
}
const clearTrack = () => {
    trackColshape.destroy();
    trackMarker.destroy();
    trackBlip.destroy()
}
const startTrackShape = () => {
    if(!vehicleCheck()) return
    clearTrack()
    workStatus = 0
}
                    /* РАЗНЫЕ ФУНКЦИИ */                  
/////////////////////////////////////////////////////////////     

/////////////////////////////////////////////////////////////
                    /* ВЫЗОВ ИВЕНТОВ */
mp.events.add('playerInitLogistWork', (markerPos) => {
    playerInitWork(markerPos)
})   
/////////////////////////////////////////////////////////////
mp.events.add('playerEnterColshape', (colshape) => {
    if( colshape == colshapeSphere ) {
        startColshape()
    }
    if(colshape == trackColshape) {
        startTrackShape()
        workNotify('Ты доставил груз. Возвращайся!')
    }
})   
//////////////////////////////////////////////////////////////
mp.events.add('beginWork', () => {
    if(workStatus == 1 ) {
        beginWork()
        workNotify('Вы уже начали работу!')
    } 
    else {
        beginWork()
        spawnVehiclesForWork('mule3', muleSpawn)
        workNotify('Начинайте развозить товары!')
        workStatus = 1
    }
})   
//////////////////////////////////////////////////////////////
mp.events.add('playerEnterVehicle', () => {
    if(workStatus == 1 && playerLocal.vehicle === workVehicle) {
        setCheckPoint();
        colshapeMarkerVeh.destroy();
    }
})
                    /* ВЫЗОВ ИВЕНТОВ */                  
/////////////////////////////////////////////////////////////     