"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Common = /** @class */ (function () {
    function Common() {
    }
    Common.PlaySound = function (audioName, audioRef) {
        mp.game.audio.playSound(-1, audioName, audioRef, false, 0, true);
    };
    return Common;
}());
exports.default = Common;
