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
var ResRectangle_1 = require("../modules/ResRectangle");
var Sprite_1 = require("../modules/Sprite");
var Color_1 = require("../utils/Color");
var Point_1 = require("../utils/Point");
var Size_1 = require("../utils/Size");
var UIMenuItem_1 = require("./UIMenuItem");
var UIMenuSliderItem = /** @class */ (function (_super) {
    __extends(UIMenuSliderItem, _super);
    function UIMenuSliderItem(text, items, index, description, divider) {
        if (description === void 0) { description = ""; }
        if (divider === void 0) { divider = false; }
        var _this = _super.call(this, text, description) || this;
        var y = 0;
        _this._items = items;
        _this._arrowLeft = new Sprite_1.default("commonmenutu", "arrowleft", new Point_1.default(0, 105 + y), new Size_1.default(15, 15));
        _this._arrowRight = new Sprite_1.default("commonmenutu", "arrowright", new Point_1.default(0, 105 + y), new Size_1.default(15, 15));
        _this._rectangleBackground = new ResRectangle_1.default(new Point_1.default(0, 0), new Size_1.default(150, 9), new Color_1.default(4, 32, 57, 255));
        _this._rectangleSlider = new ResRectangle_1.default(new Point_1.default(0, 0), new Size_1.default(75, 9), new Color_1.default(57, 116, 200, 255));
        if (divider) {
            _this._rectangleDivider = new ResRectangle_1.default(new Point_1.default(0, 0), new Size_1.default(2.5, 20), Color_1.default.WhiteSmoke);
        }
        else {
            _this._rectangleDivider = new ResRectangle_1.default(new Point_1.default(0, 0), new Size_1.default(2.5, 20), Color_1.default.Transparent);
        }
        _this.Index = index;
        return _this;
    }
    Object.defineProperty(UIMenuSliderItem.prototype, "Index", {
        get: function () {
            return this._index % this._items.length;
        },
        set: function (value) {
            this._index = 100000000 - (100000000 % this._items.length) + value;
        },
        enumerable: false,
        configurable: true
    });
    UIMenuSliderItem.prototype.SetVerticalPosition = function (y) {
        this._rectangleBackground.pos = new Point_1.default(250 + this.Offset.X + this.Parent.WidthOffset, y + 158.5 + this.Offset.Y);
        this._rectangleSlider.pos = new Point_1.default(250 + this.Offset.X + this.Parent.WidthOffset, y + 158.5 + this.Offset.Y);
        this._rectangleDivider.pos = new Point_1.default(323.5 + this.Offset.X + this.Parent.WidthOffset, y + 153 + this.Offset.Y);
        this._arrowLeft.pos = new Point_1.default(235 + this.Offset.X + this.Parent.WidthOffset, 155.5 + y + this.Offset.Y);
        this._arrowRight.pos = new Point_1.default(400 + this.Offset.X + this.Parent.WidthOffset, 155.5 + y + this.Offset.Y);
        _super.prototype.SetVerticalPosition.call(this, y);
    };
    UIMenuSliderItem.prototype.IndexToItem = function (index) {
        return this._items[index];
    };
    UIMenuSliderItem.prototype.Draw = function () {
        _super.prototype.Draw.call(this);
        this._arrowLeft.color = this.Enabled
            ? this.Selected
                ? Color_1.default.Black
                : Color_1.default.WhiteSmoke
            : new Color_1.default(163, 159, 148);
        this._arrowRight.color = this.Enabled
            ? this.Selected
                ? Color_1.default.Black
                : Color_1.default.WhiteSmoke
            : new Color_1.default(163, 159, 148);
        var offset = ((this._rectangleBackground.size.Width -
            this._rectangleSlider.size.Width) /
            (this._items.length - 1)) *
            this.Index;
        this._rectangleSlider.pos = new Point_1.default(250 + this.Offset.X + offset + +this.Parent.WidthOffset, this._rectangleSlider.pos.Y);
        if (this.Selected) {
            this._arrowLeft.Draw();
            this._arrowRight.Draw();
        }
        else {
        }
        this._rectangleBackground.Draw();
        this._rectangleSlider.Draw();
        this._rectangleDivider.Draw();
    };
    UIMenuSliderItem.prototype.SetRightBadge = function (badge) { };
    UIMenuSliderItem.prototype.SetRightLabel = function (text) { };
    return UIMenuSliderItem;
}(UIMenuItem_1.default));
exports.default = UIMenuSliderItem;
