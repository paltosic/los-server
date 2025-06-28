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
var Color_1 = require("../utils/Color");
var Point_1 = require("../utils/Point");
var IElement_1 = require("./IElement");
var ResText_1 = require("./ResText");
var Text = /** @class */ (function (_super) {
    __extends(Text, _super);
    function Text(caption, pos, scale, color, font, centered) {
        var _this = _super.call(this) || this;
        _this.caption = caption;
        _this.pos = pos;
        _this.scale = scale;
        _this.color = color || new Color_1.default(255, 255, 255, 255);
        _this.font = font || 0;
        _this.centered = centered || false;
        return _this;
    }
    Text.prototype.Draw = function (caption, pos, scale, color, font, centered) {
        if (caption && !pos && !scale && !color && !font && !centered) {
            pos = new Point_1.default(this.pos.X + caption.Width, this.pos.Y + caption.Height);
            scale = this.scale;
            color = this.color;
            font = this.font;
            centered = this.centered;
        }
        var x = pos.X / 1280.0;
        var y = pos.Y / 720.0;
        mp.game.ui.setTextFont(parseInt(font));
        mp.game.ui.setTextScale(scale, scale);
        mp.game.ui.setTextColour(color.R, color.G, color.B, color.A);
        mp.game.ui.setTextCentre(centered);
        mp.game.ui.setTextEntry("STRING");
        ResText_1.default.AddLongString(caption);
        mp.game.ui.drawText(x, y);
    };
    return Text;
}(IElement_1.default));
exports.default = Text;
exports = Text;
