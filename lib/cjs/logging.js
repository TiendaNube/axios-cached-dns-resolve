"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.getLogger = exports.init = void 0;
var pino_1 = __importDefault(require("pino"));
var logger;
function init(options) {
    return (logger = pino_1["default"](options));
}
exports.init = init;
function getLogger() {
    return logger;
}
exports.getLogger = getLogger;
