"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var UUIDV4_1 = require("../utils/UUIDV4");
var ListItem = /** @class */ (function () {
    function ListItem(text, data) {
        if (text === void 0) { text = ""; }
        if (data === void 0) { data = null; }
        this.Id = (0, UUIDV4_1.default)();
        this.DisplayText = text;
        this.Data = data;
    }
    return ListItem;
}());
exports.default = ListItem;
