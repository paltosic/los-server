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
var Point_1 = require("../utils/Point");
var Size_1 = require("../utils/Size");
var Rectangle_1 = require("./Rectangle");
var Screen_1 = require("../utils/Screen");
var ResRectangle = /** @class */ (function (_super) {
    __extends(ResRectangle, _super);
    function ResRectangle(pos, size, color) {
        return _super.call(this, pos, size, color) || this;
    }
    ResRectangle.prototype.Draw = function (pos, size, color) {
        if (!pos)
            pos = new Size_1.default();
        if (pos && !size && !color) {
            pos = new Point_1.default(this.pos.X + pos.Width, this.pos.Y + pos.Height);
            size = this.size;
            color = this.color;
        }
        var screenw = Screen_1.Screen.width;
        var screenh = Screen_1.Screen.height;
        var height = 1080.0;
        var ratio = screenw / screenh;
        var width = height * ratio;
        var w = size.Width / width;
        var h = size.Height / height;
        var x = pos.X / width + w * 0.5;
        var y = pos.Y / height + h * 0.5;
        mp.game.graphics.drawRect(x, y, w, h, color.R, color.G, color.B, color.A);
    };
    return ResRectangle;
}(Rectangle_1.default));
exports.default = ResRectangle;
