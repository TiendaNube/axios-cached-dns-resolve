import pino from 'pino';
var logger;
export function init(options) {
    return (logger = pino(options));
}
export function getLogger() {
    return logger;
}
