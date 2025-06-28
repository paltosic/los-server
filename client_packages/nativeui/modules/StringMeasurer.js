"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Screen_1 = require("../utils/Screen");
var ResText_1 = require("./ResText");
var StringMeasurer = /** @class */ (function () {
    function StringMeasurer() {
    }
    StringMeasurer.MeasureStringWidthNoConvert = function (input) {
        mp.game.ui.setTextEntryForWidth("STRING");
        ResText_1.default.AddLongString(input);
        mp.game.ui.setTextFont(0);
        mp.game.ui.setTextScale(0.35, 0.35);
        return mp.game.ui.getTextScreenWidth(false);
    };
    StringMeasurer.MeasureString = function (str) {
        var screenw = Screen_1.Screen.width;
        var screenh = Screen_1.Screen.height;
        var height = 1080.0;
        var ratio = screenw / screenh;
        var width = height * ratio;
        return this.MeasureStringWidthNoConvert(str) * width;
    };
    return StringMeasurer;
}());
exports.default = StringMeasurer;
