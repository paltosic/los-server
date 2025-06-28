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
var IElement_1 = require("./IElement");
var Rectangle = /** @class */ (function (_super) {
    __extends(Rectangle, _super);
    function Rectangle(pos, size, color) {
        var _this = _super.call(this) || this;
        _this.enabled = true;
        _this.pos = pos;
        _this.size = size;
        _this.color = color;
        return _this;
    }
    Rectangle.prototype.Draw = function (pos, size, color) {
        if (!pos)
            pos = new Size_1.default(0, 0);
        if (!size && !color) {
            pos = new Point_1.default(this.pos.X + pos.Width, this.pos.Y + pos.Height);
            size = this.size;
            color = this.color;
        }
        var w = size.Width / 1280.0;
        var h = size.Height / 720.0;
        var x = pos.X / 1280.0 + w * 0.5;
        var y = pos.Y / 720.0 + h * 0.5;
        mp.game.graphics.drawRect(x, y, w, h, color.R, color.G, color.B, color.A);
    };
    return Rectangle;
}(IElement_1.default));
exports.default = Rectangle;
