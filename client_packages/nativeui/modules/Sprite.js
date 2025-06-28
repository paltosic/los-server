"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Color_1 = require("../utils/Color");
var Screen_1 = require("../utils/Screen");
var Sprite = /** @class */ (function () {
    function Sprite(textureDict, textureName, pos, size, heading, color) {
        if (heading === void 0) { heading = 0; }
        if (color === void 0) { color = new Color_1.default(255, 255, 255); }
        this.TextureDict = textureDict;
        this.TextureName = textureName;
        this.pos = pos;
        this.size = size;
        this.heading = heading;
        this.color = color;
        this.visible = true;
    }
    Sprite.prototype.LoadTextureDictionary = function () {
        mp.game.graphics.requestStreamedTextureDict(this._textureDict, true);
        while (!this.IsTextureDictionaryLoaded) {
            //@ts-ignore
            mp.game.wait(0);
        }
    };
    Object.defineProperty(Sprite.prototype, "TextureDict", {
        get: function () {
            return this._textureDict;
        },
        set: function (v) {
            this._textureDict = v;
            if (!this.IsTextureDictionaryLoaded)
                this.LoadTextureDictionary();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sprite.prototype, "IsTextureDictionaryLoaded", {
        get: function () {
            return mp.game.graphics.hasStreamedTextureDictLoaded(this._textureDict);
        },
        enumerable: false,
        configurable: true
    });
    Sprite.prototype.Draw = function (textureDictionary, textureName, pos, size, heading, color, loadTexture) {
        textureDictionary = textureDictionary || this.TextureDict;
        textureName = textureName || this.TextureName;
        pos = pos || this.pos;
        size = size || this.size;
        heading = heading || this.heading;
        color = color || this.color;
        loadTexture = loadTexture || true;
        if (loadTexture) {
            if (!mp.game.graphics.hasStreamedTextureDictLoaded(textureDictionary))
                mp.game.graphics.requestStreamedTextureDict(textureDictionary, true);
        }
        var screenw = Screen_1.Screen.width;
        var screenh = Screen_1.Screen.height;
        var height = 1080.0;
        var ratio = screenw / screenh;
        var width = height * ratio;
        var w = this.size.Width / width;
        var h = this.size.Height / height;
        var x = this.pos.X / width + w * 0.5;
        var y = this.pos.Y / height + h * 0.5;
        mp.game.graphics.drawSprite(textureDictionary, textureName, x, y, w, h, heading, color.R, color.G, color.B, color.A);
    };
    return Sprite;
}());
exports.default = Sprite;
