
let loggedIn = true;
let interfaceOpened = false;
let DeathScreen = false;
let HideState = false;

mp.events.add("playerDeath", (player, reason, killer) => {
  if(loggedIn == true) {
    mp.events.call("client_1_deathEffect", true);
    DeathScreen = true;
    setTimeout(() => {
      mp.events.call("client_1_deathEffect", false);     
      DeathScreen = false; 
    }, 5000);
  }
});

mp.events.add('playSoundEffect', (soundName, setName) => {
  mp.game.audio.playSoundFrontend(-1, soundName, setName, true);
});

mp.events.add('client_1_deathEffect', (toggle) => {
  if(loggedIn == true) {
    if(toggle == true) {
      mp.game.audio.playSoundFrontend(-1, "Bed", "WastedSounds", true);
      mp.game.graphics.startScreenEffect("DeathFailMPIn", 0, true);
      mp.game.cam.setCamEffect(1);
      mp.events.call("prepareForBrowser", `nothing`);
    } else {
      mp.game.graphics.stopScreenEffect("DeathFailMPIn");
      mp.game.cam.setCamEffect(0);
      mp.events.call("comeBackFromBrowser");
      mp.events.callRemote("spawnPlayer");
    }
  }
});

mp.events.add('updateAuthClient', () => {
  loggedIn = true;
});

mp.events.add('requestIPL', (ipl) => {
  mp.game.streaming.requestIpl(ipl);
});

global.IsACar = function (model) {
  if(mp.game.vehicle.isThisModelACar(model) || mp.game.vehicle.isThisModelABike(model)) 
  {
    if(!mp.game.vehicle.isThisModelABicycle(model)) {
      return true;
    }
  }
  return false;
}

let vehiclesWithEngines = [2053223216,850991848,1518533038,387748548,904750859,3244501995,2242229361,1945374990,569305213,2157618379,2645431192,177270108,2112052861,1653666139,1747439474,4080511798,2306538597,3950024287,1549126457,3164157193,1682114128,3117102977,3863274624,2844316578,841808271,330661258,4289813342,3703357000,3903372712,4205676014,3670438162,1348744438,3783366066,1349725314,873639469,1581459400,2364918497,3172678083,3101863448,1171614426,1127131465,2647026068,1938952078,469291905,2287941233,2046537925,2667966721,1912215274,2321795001,4260343491,353883353,2758042359,2515846680,456714581,741586030,3089277354,2601952180,2611638396,1922257928,1886712733,3288047904,2164484578,1353720154,2186977100,444583674,3510150843,475220373,2589662668,48339065,3347205726,562680400,3471458123,1074326203,630371791,4081974053,3602674979,321739290,4262731174,2859440138,782665360,1672195559,2179174271,2154536131,4180675781,3403504941,86520421,11251904,6774487,390201602,2006142190,2890830793,822018448,4055125828,1790834270,2623969160,1753414259,2035069708,2452219115,55628203,3005788552,627535535,3537231886,741090084,1265391242,4039289119,301427732,4135840458,640818791,2771538552,3660088182,2688780135,884483972,2069146067,3385765638,1873600305,3401388520,2841686334,1491277511,3889340782,743478836,1836027715,4154065143,2941886209,3685342204,3676349299,3285698347,3724934023,3089165662,3612755468,3281516360,349605904,2933279331,784565758,80636076,3379262425,723973206,3968823444,2175389151,2504420315,2255212070,2494797253,349315417,15219735,37348240,2068293287,525509695,1896491931,2351681756,1312550391,1507916787,3627815886,3705788919,4067225593,941494461,777714999,2609945748,223258115,729783779,833469436,1119641113,1923400478,3893323758,972671128,3084515313,3469130167,3796912450,3395457658,16646064,2006667053,523724515,1871995513,1126868326,3945366167,2166734073,4246935337,3025077634,3854198872,2704629607,2859047862,2815302597,1770332643,3057713523,2633113103,534258863,1897744184,3467805257,3982671785,4240635011,2434067162,2071877360,2370534026,92612664,1233534620,2230595153,3449006043,2044532910,433954513,1645267888,1933662059,3087195462,2249373259,2762269779,3105951696,989381445,2198148358,1180875963,1356124575,101905590,3631668194,3486135912,142944341,1878062887,634118882,470404958,666166960,850565707,2006918058,3505073125,683047626,1177543287,3900892662,3157435195,2519238556,2751205197,884422927,486987393,1269098716,914654722,3546958660,3486509883,3874056184,2643899483,2136773105,1221512915,1337041428,1203490606,3862958888,2485144969,2487343317,2391954683,906642318,704435172,2264796000,3690124666,3609690755,2411965148,3053254478,1909141499,75131841,3005245074,886934177,4180339789,2411098011,3144368207,2254540506,4280472072,627094268,3039514899,3406724313,1922255844,321186144,2817386317,1723137093,2333339779,1123216662,2400073108,3286105550,1373123368,1777363799,128351698,3989239879,3581397346,2222034228,345756458,2191146052,3196165219,3338918751,1941029835,1917016601,3039269212,2382949506,767087018,3253274834,1274868363,1039032026,3703315515,3990165190,736902334,237764926,2072687711,3249425686,2272483501,1561920505,108773431,196747873,3728579874,2299640309,3205927392,499169875,2016857647,2997294755,3188613414,544021352,2922118804,410882957,1573551258,4152024626,3663206819,2445973230,1032823388,2833484545,3517794615,867799010,3917501776,2765724541,2360515092,1737773231,3620039993,3884762073,719660200,2809443750,1489967196,3548084598,1104234922,2537130571,1886268224,1074745671,1741861769,970598228,384071873,3223586949,1887331236,1102544804,159274291,117401876,3463132580,3692679425,941800958,223240013,1011753235,1483171323,2728226064,2215179066,2889029532,1051415893,2634021974,2170765704,3861591579,1830407356,1078682497,2049897956,1841130506,903794909,1545842587,2196019706,886810209,500482303,1504306544,464687292,1531094468,1762279763,2261744861,2497353967,2736567667,3312836369,3903371924,758895617,3078201489,3981782132,633712403,2598821281,2983812512,1392481335,3003014393,1426219628,1234311532,418536135,2246633323,3812247419,3062131285,1034187331,1093792632,1987142870,2536829930,2465164804,2123327359,234062309,1352136073,3656405053,819197656,3999278268,1663218586,272929391,408192225,2067820283,338562499,1939284556,3052358707,3296789504,2672523198,989294410,917809321,2891838741,1030400667,184361638,920453016,240201337,642617954,586013744,1560980623,1147287684,3757070668,3525819835,3410276810,1491375716,1783355638,3448987385,3695398481,734217681,2594165727,2971866336,3852654278,1641462412,2218488798,1445631933,516990260,887537515,2132890591,4278019151,2072156101,1739845664,1069929536,2307837162,4061868990,121658888,444171386,682434785,2948279460,3387490166,2551651283,893081117,1132262048,1876516712,2549763894,296357396,4174679674,3984502180,3168702960,1488164764,4175309224,943752001,1162065741,2518351607,1475773103,3484649228,728614474,219613597,699456151,2983726598,1951180813,65402552,1026149675];

global.vehicleModelHaveEngine = function(name) {
  if(vehiclesWithEngines.includes(name)) {
    return true;
  } else {
    return false;
  }
}

global.formatMoney = function (n, c, d, t) {
  var c = isNaN(c = Math.abs(c)) ? 2 : c,
    d = d == undefined ? "." : d,
    t = t == undefined ? "," : t,
    s = n < 0 ? "-" : "",
    i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))),
    j = (j = i.length) > 3 ? j % 3 : 0;
  return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};

let frozenPlayer = false;

mp.events.add('freezePlayer', (toggle) => {
  frozenPlayer = toggle;
});

mp.events.add('render', () => {
  if(frozenPlayer == true && interfaceOpened == false) {
    mp.game.controls.disableAllControlActions(0);
  }
});

mp.events.add('setNotificationMessage', (picName1, picName2, flash, iconType, sender, subject, message) => {
  mp.game.graphics.requestStreamedTextureDict(picName1, true);
  mp.game.ui.setNotificationMessage(picName1, picName2, flash, iconType, sender, subject);
  mp.game.ui.setNotificationTextEntry(message);
  mp.game.ui.drawNotification(false, false);
});

mp.events.add('updateFactionMember', (obj) => {
  mp.events.callRemote("updateFactionMember", obj);
});

mp.events.add('sendFactionApplicationAnswer', (obj) => {
  mp.events.callRemote("sendFactionApplicationAnswer", obj);
});

mp.events.add('sendFactionApplication', (obj) => {
  mp.events.callRemote("sendFactionApplication", obj);
});

notifyError = function(message) { mp.events.call('sendNotify', 0, message); }
notifySuccess = function(message) { mp.events.call('sendNotify', 1, message); }
notifyInfo = function(message) { mp.events.call('sendNotify', 2, message); }
notifyWarning = function(message) { mp.events.call('sendNotify', 3, message); }

mp.events.add('sendNotify', (type, message) => {
  message = escape(message);
  hud.execute(`gui.notify.push('${type}', 9, '${message}', 10000);`);
});

mp.events.add('ToggleVehicleCollision', (toggle) => {
  if(player.vehicle) {
    mp.players.forEach(_player => {
      if(!_player.loggedIn || _player.loggedIn == false) return;
      if(!_player.vehicle) return;
      player.vehicle.setNoCollision(_player.vehicle.handle, toggle);
    });
  }

});

mp.events.add('stopAnimation', () => {
  mp.events.callRemote("stopAnimation");
});

mp.events.add('LookingAtPhone', () => {
  mp.events.callRemote("LookingAtPhone");
});

mp.keys.bind(0x0D, true, function() {
  if(loggedIn == true && interfaceOpened == false) {
    mp.events.callRemote("enterEvent");    
  }
});

mp.events.add('setClientTimeEffect', (time) => {
  mp.game.graphics.setTimecycleModifier(time);
});

mp.events.add('buyFromShop', (index) => {
  mp.events.callRemote("buyFromShop", index);
});

global.HideState = false;

mp.keys.bind(0x76, true, function() {
  if(loggedIn == true) {
    if(HideState == true) {
      mp.events.call("comeBackFromBrowser");
      HideState = false;
    } else if(interfaceOpened == false) {
      mp.events.call("prepareForBrowser", `nothing`);
      mp.gui.cursor.show(false, false);
      HideState = true;
    }
  }
});

mp.keys.bind(0x77, true, function() {
  if(loggedIn == true) {
    let d = new Date(),
    h = d.getHours(),
    m = d.getMinutes(),
    s = d.getSeconds(),
    month = d.getMonth() + 1,
    year = d.getFullYear(),
    day = d.getDate();

    h = h < 10 ? "0" + h : h;
    m = m < 10 ? "0" + m : m;
    s = s < 10 ? "0" + s : s;
    d = d < 10 ? "0" + d : d;
    month = month < 10 ? "0" + month : month;
    mp.gui.takeScreenshot(`screenshot_${day}_${month}_${year}_${h}_${m}_${s}.jpg`, 0, 100, 100);
    mp.game.graphics.notify(`~o~Saved as screenshot_${day}_${month}_${year}_${h}_${m}_${s}.jpg`);
  }
});