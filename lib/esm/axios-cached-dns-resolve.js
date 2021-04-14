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
/* eslint-disable no-plusplus */
import dns from 'dns';
import URL from 'url';
import net from 'net';
import stringify from 'json-stringify-safe';
import LRUCache from 'lru-cache';
import { init as initLogger } from './logging';
var util = require('util');
var dnsResolve = util.promisify(dns.resolve);
export var config = {
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
export var cacheConfig = {
    max: config.dnsCacheSize,
    maxAge: (config.dnsTtlMs * config.cacheGraceExpireMultiplier)
};
export var stats = {
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
export function init() {
    log = initLogger(config.logging);
    if (config.cache)
        return;
    config.cache = new LRUCache(cacheConfig);
    startBackgroundRefresh();
    startPeriodicCachePrune();
    cachePruneId = setInterval(function () { return config.cache.prune(); }, config.dnsIdleTtlMs);
}
export function startBackgroundRefresh() {
    if (backgroundRefreshId)
        clearInterval(backgroundRefreshId);
    backgroundRefreshId = setInterval(backgroundRefresh, config.backgroundScanMs);
}
export function startPeriodicCachePrune() {
    if (cachePruneId)
        clearInterval(cachePruneId);
    cachePruneId = setInterval(function () { return config.cache.prune(); }, config.dnsIdleTtlMs);
}
export function getStats() {
    stats.dnsEntries = config.cache.length;
    return stats;
}
export function getDnsCacheEntries() {
    return config.cache.values();
}
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
export function registerInterceptor(axios) {
    var _this = this;
    if (config.disabled || !axios || !axios.interceptors)
        return; // supertest
    axios.interceptors.request.use(function (reqConfig) { return __awaiter(_this, void 0, void 0, function () {
        var url, _a, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    url = void 0;
                    if (reqConfig.baseURL) {
                        url = URL.parse(reqConfig.baseURL);
                    }
                    else {
                        url = URL.parse(reqConfig.url);
                    }
                    if (net.isIP(url.hostname))
                        return [2 /*return*/, reqConfig]; // skip
                    reqConfig.headers.Host = url.hostname; // set hostname in header
                    _a = url;
                    return [4 /*yield*/, getAddress(url.hostname)];
                case 1:
                    _a.hostname = _b.sent();
                    delete url.host; // clear hostname
                    if (reqConfig.baseURL) {
                        reqConfig.baseURL = URL.format(url);
                    }
                    else {
                        reqConfig.url = URL.format(url);
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
export function getAddress(host) {
    return __awaiter(this, void 0, void 0, function () {
        var dnsEntry, ip_1, ips, ip;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dnsEntry = config.cache.get(host);
                    if (dnsEntry) {
                        ++stats.hits;
                        dnsEntry.lastUsedTs = Date.now();
                        ip_1 = dnsEntry.ips[dnsEntry.nextIdx++ % dnsEntry.ips.length] // round-robin
                        ;
                        config.cache.set(host, dnsEntry);
                        return [2 /*return*/, ip_1];
                    }
                    ++stats.misses;
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
                    config.cache.set(host, dnsEntry);
                    return [2 /*return*/, ip];
            }
        });
    });
}
var backgroundRefreshing = false;
export function backgroundRefresh() {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            if (backgroundRefreshing)
                return [2 /*return*/]; // don't start again if currently iterating slowly
            backgroundRefreshing = true;
            try {
                config.cache.forEach(function (value, key) { return __awaiter(_this, void 0, void 0, function () {
                    var ips, err_2;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 2, , 3]);
                                if (value.updatedTs + config.dnsTtlMs > Date.now()) {
                                    return [2 /*return*/]; // continue/skip
                                }
                                if (value.lastUsedTs + config.dnsIdleTtlMs <= Date.now()) {
                                    ++stats.idleExpired;
                                    config.cache.del(key);
                                    return [2 /*return*/]; // continue
                                }
                                return [4 /*yield*/, dnsResolve(value.host)];
                            case 1:
                                ips = _a.sent();
                                value.ips = ips;
                                value.updatedTs = Date.now();
                                config.cache.set(key, value);
                                ++stats.refreshed;
                                return [3 /*break*/, 3];
                            case 2:
                                err_2 = _a.sent();
                                // best effort
                                recordError(err_2, "Error backgroundRefresh host: " + key + ", " + stringify(value) + ", " + err_2.message);
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
function recordError(err, errMesg) {
    ++stats.errors;
    stats.lastError = err;
    stats.lastErrorTs = new Date().toISOString();
    log.error(err, errMesg);
}
/* eslint-enable no-plusplus */
