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
var Sprite_1 = require("../modules/Sprite");
var Color_1 = require("../utils/Color");
var LiteEvent_1 = require("../utils/LiteEvent");
var Point_1 = require("../utils/Point");
var Size_1 = require("../utils/Size");
var UIMenuItem_1 = require("./UIMenuItem");
var UIMenuCheckboxItem = /** @class */ (function (_super) {
    __extends(UIMenuCheckboxItem, _super);
    function UIMenuCheckboxItem(text, check, description) {
        if (check === void 0) { check = false; }
        if (description === void 0) { description = ""; }
        var _this = _super.call(this, text, description) || this;
        _this.OnCheckedChanged = new LiteEvent_1.default();
        _this.Checked = false;
        var y = 0;
        _this._checkedSprite = new Sprite_1.default("commonmenu", "shop_box_blank", new Point_1.default(410, y + 95), new Size_1.default(50, 50));
        _this.Checked = check;
        return _this;
    }
    Object.defineProperty(UIMenuCheckboxItem.prototype, "CheckedChanged", {
        get: function () {
            return this.OnCheckedChanged.expose();
        },
        enumerable: false,
        configurable: true
    });
    UIMenuCheckboxItem.prototype.SetVerticalPosition = function (y) {
        _super.prototype.SetVerticalPosition.call(this, y);
        this._checkedSprite.pos = new Point_1.default(380 + this.Offset.X + this.Parent.WidthOffset, y + 138 + this.Offset.Y);
    };
    UIMenuCheckboxItem.prototype.Draw = function () {
        _super.prototype.Draw.call(this);
        this._checkedSprite.pos = this._checkedSprite.pos = new Point_1.default(380 + this.Offset.X + this.Parent.WidthOffset, this._checkedSprite.pos.Y);
        var isDefaultHightlitedForeColor = this.HighlightedForeColor == UIMenuItem_1.default.DefaultHighlightedForeColor;
        if (this.Selected && isDefaultHightlitedForeColor) {
            this._checkedSprite.TextureName = this.Checked
                ? "shop_box_tickb"
                : "shop_box_blankb";
        }
        else {
            this._checkedSprite.TextureName = this.Checked
                ? "shop_box_tick"
                : "shop_box_blank";
        }
        this._checkedSprite.color = this.Enabled
            ? this.Selected && !isDefaultHightlitedForeColor
                ? this.HighlightedForeColor
                : this.ForeColor
            : new Color_1.default(163, 159, 148);
        this._checkedSprite.Draw();
    };
    UIMenuCheckboxItem.prototype.SetRightBadge = function (badge) {
        return this;
    };
    UIMenuCheckboxItem.prototype.SetRightLabel = function (text) {
        return this;
    };
    return UIMenuCheckboxItem;
}(UIMenuItem_1.default));
exports.default = UIMenuCheckboxItem;
