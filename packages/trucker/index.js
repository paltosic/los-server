// Start trucker job
const markerPos = { x: 798.9253540039062, y: -2975.787109375, z: 3.940936489105225 }
mp.events.add('playerReady', (player) => {
    player.call('playerInitLogistWork', [markerPos]);
})

mp.events.addCommand('spveh', (player) => {
    const {position} = player.vehicle
    console.log(`{ x: ${position.x}, y: ${position.y}, z: ${position.z}, heading: ${player.vehicle.rotation.z}}`)
})

mp.events.addCommand('sp', (player) => {
    const {position} = player
    console.log(`{ x: ${position.x}, y: ${position.y}, z: ${position.z} }`)
})  