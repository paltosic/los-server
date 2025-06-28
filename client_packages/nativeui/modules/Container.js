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
var Size_1 = require("../utils/Size");
var Rectangle_1 = require("./Rectangle");
var Screen_1 = require("../utils/Screen");
var Container = /** @class */ (function (_super) {
    __extends(Container, _super);
    function Container(pos, size, color) {
        var _this = _super.call(this, pos, size, color) || this;
        _this.Items = [];
        return _this;
    }
    Container.prototype.addItem = function (item) {
        this.Items.push(item);
    };
    Container.prototype.Draw = function (offset) {
        if (!this.enabled)
            return;
        offset = offset || new Size_1.default();
        var screenw = Screen_1.Screen.width;
        var screenh = Screen_1.Screen.height;
        var height = 1080.0;
        var ratio = screenw / screenh;
        var width = height * ratio;
        var w = this.size.Width / width;
        var h = this.size.Height / height;
        var x = (this.pos.X + offset.Width) / width + w * 0.5;
        var y = (this.pos.Y + offset.Height) / height + h * 0.5;
        mp.game.graphics.drawRect(x, y, w, h, this.color.R, this.color.G, this.color.B, this.color.A);
        for (var _i = 0, _a = this.Items; _i < _a.length; _i++) {
            var item = _a[_i];
            item.Draw(new Size_1.default(this.pos.X + offset.Width, this.pos.Y + offset.Height));
        }
    };
    return Container;
}(Rectangle_1.default));
exports.default = Container;
