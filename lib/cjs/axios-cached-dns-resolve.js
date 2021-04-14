"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.backgroundRefresh = exports.getAddress = exports.registerInterceptor = exports.getDnsCacheEntries = exports.getStats = exports.startPeriodicCachePrune = exports.startBackgroundRefresh = exports.init = exports.stats = exports.cacheConfig = exports.config = void 0;
/* eslint-disable no-plusplus */
var dns_1 = __importDefault(require("dns"));
var url_1 = __importDefault(require("url"));
var net_1 = __importDefault(require("net"));
var json_stringify_safe_1 = __importDefault(require("json-stringify-safe"));
var lru_cache_1 = __importDefault(require("lru-cache"));
var logging_1 = require("./logging");
var util = require('util');
var dnsResolve = util.promisify(dns_1["default"].resolve);
exports.config = {
    disabled: process.env.AXIOS_DNS_DISABLE === 'true',
    dnsTtlMs: process.env.AXIOS_DNS_CACHE_TTL_MS || 5000,
    cacheGraceExpireMultiplier: process.env.AXIOS_DNS_CACHE_EXPIRE_MULTIPLIER || 2,
    dnsIdleTtlMs: process.env.AXIOS_DNS_CACHE_IDLE_TTL_MS || 1000 * 60 * 60,
    backgroundScanMs: process.env.AXIOS_DNS_BACKGROUND_SCAN_MS || 2400,
    dnsCacheSize: process.env.AXIOS_DNS_CACHE_SIZE || 100,
    // pino logging options
    logging: {
        name: 'axios-cache-dns-resolve',
        // enabled: true,
        level: process.env.AXIOS_DNS_LOG_LEVEL || 'info',
        // timestamp: true,
        prettyPrint: process.env.NODE_ENV === 'DEBUG' || false,
        useLevelLabels: true
    },
    cache: undefined
};
exports.cacheConfig = {
    max: exports.config.dnsCacheSize,
    maxAge: (exports.config.dnsTtlMs * exports.config.cacheGraceExpireMultiplier)
};
exports.stats = {
    dnsEntries: 0,
    refreshed: 0,
    hits: 0,
    misses: 0,
    idleExpired: 0,
    errors: 0,
    lastError: 0,
    lastErrorTs: 0
};
var log;
var backgroundRefreshId;
var cachePruneId;
init();
function init() {
    log = logging_1.init(exports.config.logging);
    if (exports.config.cache)
        return;
    exports.config.cache = new lru_cache_1["default"](exports.cacheConfig);
    startBackgroundRefresh();
    startPeriodicCachePrune();
    cachePruneId = setInterval(function () { return exports.config.cache.prune(); }, exports.config.dnsIdleTtlMs);
}
exports.init = init;
function startBackgroundRefresh() {
    if (backgroundRefreshId)
        clearInterval(backgroundRefreshId);
    backgroundRefreshId = setInterval(backgroundRefresh, exports.config.backgroundScanMs);
}
exports.startBackgroundRefresh = startBackgroundRefresh;
function startPeriodicCachePrune() {
    if (cachePruneId)
        clearInterval(cachePruneId);
    cachePruneId = setInterval(function () { return exports.config.cache.prune(); }, exports.config.dnsIdleTtlMs);
}
exports.startPeriodicCachePrune = startPeriodicCachePrune;
function getStats() {
    exports.stats.dnsEntries = exports.config.cache.length;
    return exports.stats;
}
exports.getStats = getStats;
function getDnsCacheEntries() {
    return exports.config.cache.values();
}
exports.getDnsCacheEntries = getDnsCacheEntries;
// const dnsEntry = {
//   host: 'www.amazon.com',
//   ips: [
//     '52.54.40.141',
//     '34.205.98.207',
//     '3.82.118.51',
//   ],
//   nextIdx: 0,
//   lastUsedTs: 1555771516581, Date.now()
//   updatedTs: 1555771516581,
// }
function registerInterceptor(axios) {
    var _this = this;
    if (exports.config.disabled || !axios || !axios.interceptors)
        return; // supertest
    axios.interceptors.request.use(function (reqConfig) { return __awaiter(_this, void 0, void 0, function () {
        var url, _a, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    url = void 0;
                    if (reqConfig.baseURL) {
                        url = url_1["default"].parse(reqConfig.baseURL);
                    }
                    else {
                        url = url_1["default"].parse(reqConfig.url);
                    }
                    if (net_1["default"].isIP(url.hostname))
                        return [2 /*return*/, reqConfig]; // skip
                    reqConfig.headers.Host = url.hostname; // set hostname in header
                    _a = url;
                    return [4 /*yield*/, getAddress(url.hostname)];
                case 1:
                    _a.hostname = _b.sent();
                    delete url.host; // clear hostname
                    if (reqConfig.baseURL) {
                        reqConfig.baseURL = url_1["default"].format(url);
                    }
                    else {
                        reqConfig.url = url_1["default"].format(url);
                    }
                    return [3 /*break*/, 3];
                case 2:
                    err_1 = _b.sent();
                    recordError(err_1, "Error getAddress, " + err_1.message);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/, reqConfig];
            }
        });
    }); });
}
exports.registerInterceptor = registerInterceptor;
function getAddress(host) {
    return __awaiter(this, void 0, void 0, function () {
        var dnsEntry, ip_1, ips, ip;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dnsEntry = exports.config.cache.get(host);
                    if (dnsEntry) {
                        ++exports.stats.hits;
                        dnsEntry.lastUsedTs = Date.now();
                        ip_1 = dnsEntry.ips[dnsEntry.nextIdx++ % dnsEntry.ips.length] // round-robin
                        ;
                        exports.config.cache.set(host, dnsEntry);
                        return [2 /*return*/, ip_1];
                    }
                    ++exports.stats.misses;
                    if (log.isLevelEnabled('debug'))
                        log.debug("cache miss " + host);
                    return [4 /*yield*/, dnsResolve(host)];
                case 1:
                    ips = _a.sent();
                    dnsEntry = {
                        host: host,
                        ips: ips,
                        nextIdx: 0,
                        lastUsedTs: Date.now(),
                        updatedTs: Date.now()
                    };
                    ip = dnsEntry.ips[dnsEntry.nextIdx++ % dnsEntry.ips.length] // round-robin
                    ;
                    exports.config.cache.set(host, dnsEntry);
                    return [2 /*return*/, ip];
            }
        });
    });
}
exports.getAddress = getAddress;
var backgroundRefreshing = false;
function backgroundRefresh() {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            if (backgroundRefreshing)
                return [2 /*return*/]; // don't start again if currently iterating slowly
            backgroundRefreshing = true;
            try {
                exports.config.cache.forEach(function (value, key) { return __awaiter(_this, void 0, void 0, function () {
                    var ips, err_2;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 2, , 3]);
                                if (value.updatedTs + exports.config.dnsTtlMs > Date.now()) {
                                    return [2 /*return*/]; // continue/skip
                                }
                                if (value.lastUsedTs + exports.config.dnsIdleTtlMs <= Date.now()) {
                                    ++exports.stats.idleExpired;
                                    exports.config.cache.del(key);
                                    return [2 /*return*/]; // continue
                                }
                                return [4 /*yield*/, dnsResolve(value.host)];
                            case 1:
                                ips = _a.sent();
                                value.ips = ips;
                                value.updatedTs = Date.now();
                                exports.config.cache.set(key, value);
                                ++exports.stats.refreshed;
                                return [3 /*break*/, 3];
                            case 2:
                                err_2 = _a.sent();
                                // best effort
                                recordError(err_2, "Error backgroundRefresh host: " + key + ", " + json_stringify_safe_1["default"](value) + ", " + err_2.message);
                                return [3 /*break*/, 3];
                            case 3: return [2 /*return*/];
                        }
                    });
                }); });
            }
            catch (err) {
                // best effort
                recordError(err, "Error backgroundRefresh, " + err.message);
            }
            finally {
                backgroundRefreshing = false;
            }
            return [2 /*return*/];
        });
    });
}
exports.backgroundRefresh = backgroundRefresh;
function recordError(err, errMesg) {
    ++exports.stats.errors;
    exports.stats.lastError = err;
    exports.stats.lastErrorTs = new Date().toISOString();
    log.error(err, errMesg);
}
/* eslint-enable no-plusplus */
