"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Point = /** @class */ (function () {
    function Point(x, y) {
        this.X = 0;
        this.Y = 0;
        this.X = x;
        this.Y = y;
    }
    Point.Parse = function (arg) {
        if (typeof arg === "object") {
            if (arg.length) {
                // Array
                return new Point(arg[0], arg[1]);
            }
            else if (arg.X && arg.Y) {
                // Object
                return new Point(arg.X, arg.Y);
            }
        }
        else if (typeof arg === "string") {
            if (arg.indexOf(",") !== -1) {
                var arr = arg.split(",");
                return new Point(parseFloat(arr[0]), parseFloat(arr[1]));
            }
        }
        return new Point(0, 0);
    };
    return Point;
}());
exports.default = Point;
