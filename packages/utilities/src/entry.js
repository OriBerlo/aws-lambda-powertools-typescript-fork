"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length,
        r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", {value: true});
var ts_entry_point_1 = require("ts-entry-point");
/**
 * Classical entry point main class.
 */
var Main = /** @class */ (function () {
    function Main() {
    }

    Main.main = function (args) {
        console.log("Hello wordl! arg count = ".concat(args.length));
    };
    Main = __decorate([
        ts_entry_point_1.default
    ], Main);
    return Main;
}());
