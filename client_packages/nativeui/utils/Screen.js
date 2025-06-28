"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Screen = void 0;
var gameScreen = mp.game.graphics.getScreenActiveResolution(0, 0);
exports.Screen = {
    width: gameScreen.x,
    height: gameScreen.y
};
