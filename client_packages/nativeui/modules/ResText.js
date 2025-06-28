"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Alignment = void 0;
var Color_1 = require("../utils/Color");
var Point_1 = require("../utils/Point");
var Size_1 = require("../utils/Size");
var Text_1 = require("./Text");
var Screen_1 = require("../utils/Screen");
var Alignment;
(function (Alignment) {
    Alignment[Alignment["Left"] = 0] = "Left";
    Alignment[Alignment["Centered"] = 1] = "Centered";
    Alignment[Alignment["Right"] = 2] = "Right";
})(Alignment || (exports.Alignment = Alignment = {}));
var ResText = /** @class */ (function (_super) {
    __extends(ResText, _super);
    function ResText(caption, pos, scale, color, font, justify) {
        var _this = _super.call(this, caption, pos, scale, color || new Color_1.default(255, 255, 255), font || 0, false) || this;
        _this.TextAlignment = Alignment.Left;
        if (justify)
            _this.TextAlignment = justify;
        return _this;
    }
    ResText.prototype.Draw = function (arg1, pos, scale, color, font, arg2, dropShadow, outline, wordWrap) {
        var caption = arg1;
        var centered = arg2;
        var textAlignment = arg2;
        if (!arg1)
            arg1 = new Size_1.default(0, 0);
        if (arg1 && !pos) {
            textAlignment = this.TextAlignment;
            caption = this.caption;
            pos = new Point_1.default(this.pos.X + arg1.Width, this.pos.Y + arg1.Height);
            scale = this.scale;
            color = this.color;
            font = this.font;
            if (centered == true || centered == false) {
                centered = this.centered;
            }
            else {
                centered = undefined;
                dropShadow = this.DropShadow;
                outline = this.Outline;
                wordWrap = this.WordWrap;
            }
        }
        var screenw = Screen_1.Screen.width;
        var screenh = Screen_1.Screen.height;
        var height = 1080.0;
        var ratio = screenw / screenh;
        var width = height * ratio;
        var x = this.pos.X / width;
        var y = this.pos.Y / height;
        mp.game.ui.setTextFont(parseInt(font));
        mp.game.ui.setTextScale(1.0, scale);
        mp.game.ui.setTextColour(color.R, color.G, color.B, color.A);
        if (centered !== undefined) {
            mp.game.ui.setTextCentre(centered);
        }
        else {
            if (dropShadow)
                mp.game.ui.setTextDropshadow(2, 0, 0, 0, 0);
            if (outline)
                console.warn("not working!");
            switch (textAlignment) {
                case Alignment.Centered:
                    mp.game.ui.setTextCentre(true);
                    break;
                case Alignment.Right:
                    mp.game.ui.setTextRightJustify(true);
                    mp.game.ui.setTextWrap(0.0, x);
                    break;
            }
            if (wordWrap) {
                var xsize = (this.pos.X + wordWrap.Width) / width;
                mp.game.ui.setTextWrap(x, xsize);
            }
        }
        mp.game.ui.setTextEntry("STRING");
        ResText.AddLongString(caption);
        mp.game.ui.drawText(x, y);
    };
    ResText.AddLongString = function (str) {
        var strLen = 99;
        for (var i = 0; i < str.length; i += strLen) {
            var substr = str.substr(i, Math.min(strLen, str.length - i));
            mp.game.ui.addTextComponentSubstringPlayerName(substr);
        }
    };
    return ResText;
}(Text_1.default));
exports.default = ResText;
