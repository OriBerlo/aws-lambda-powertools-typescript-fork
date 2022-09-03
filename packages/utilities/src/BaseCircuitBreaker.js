"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.State = exports.BaseCircuitBreaker = void 0;
var State;
(function (State) {
    State[State["Closed"] = 0] = "Closed";
    State[State["HalfOpen"] = 1] = "HalfOpen";
    State[State["Open"] = 2] = "Open";
})(State || (State = {}));
exports.State = State;
var DEFAULT_RECOVERY_TIMEOUT = 30;
var DEFAULT_FAILURE_THRESHOLD = 5;
var MILLI_TO_SECONDS_FACTOR = 1000;
var BaseCircuitBreaker = /** @class */ (function () {
    function BaseCircuitBreaker(name, failureThreshold, recoveryTimeout, expectedException, fallbackFunction) {
        if (failureThreshold === void 0) { failureThreshold = DEFAULT_FAILURE_THRESHOLD; }
        if (recoveryTimeout === void 0) { recoveryTimeout = DEFAULT_RECOVERY_TIMEOUT; }
        if (expectedException === void 0) { expectedException = null; }
        if (fallbackFunction === void 0) { fallbackFunction = null; }
        this.lastFailure = null;
        this.failureCount = 0;
        this.failureThreshold = failureThreshold;
        this.recoveryTimeoutMilli = recoveryTimeout * MILLI_TO_SECONDS_FACTOR;
        this.expectedExceptions = expectedException !== null ? expectedException : new Array(Error.prototype);
        this.fallbackFunction = fallbackFunction;
        this.name = name;
        this.state = State.Closed;
        this.opened = Date.now();
    }
    BaseCircuitBreaker.prototype.isThresholdOccurred = function () {
        return this.failureCount >= this.failureThreshold;
    };
    return BaseCircuitBreaker;
}());
exports.BaseCircuitBreaker = BaseCircuitBreaker;
