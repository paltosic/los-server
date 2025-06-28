"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ListItem_1 = require("../modules/ListItem");
var ItemsCollection = /** @class */ (function () {
    function ItemsCollection(items) {
        if (items.length === 0)
            throw new Error("ItemsCollection cannot be empty");
        this.items = items;
    }
    ItemsCollection.prototype.length = function () {
        return this.items.length;
    };
    ItemsCollection.prototype.getListItems = function () {
        var items = [];
        for (var _i = 0, _a = this.items; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item instanceof ListItem_1.default) {
                items.push(item);
            }
            else if (typeof item == "string") {
                items.push(new ListItem_1.default(item.toString()));
            }
        }
        return items;
    };
    return ItemsCollection;
}());
exports.default = ItemsCollection;
