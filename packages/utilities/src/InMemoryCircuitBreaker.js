"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.circuit = exports.InMemoryCircuitBreaker = void 0;
var BaseCircuitBreaker_1 = require("./BaseCircuitBreaker");
var logger_1 = require("@aws-lambda-powertools/logger");
var InMemoryCircuitBreaker = /** @class */ (function (_super) {
    __extends(InMemoryCircuitBreaker, _super);
    function InMemoryCircuitBreaker(name, failureThreshold, recoveryTimeout, expectedException, fallbackFunction) {
        if (failureThreshold === void 0) { failureThreshold = null; }
        if (recoveryTimeout === void 0) { recoveryTimeout = null; }
        if (expectedException === void 0) { expectedException = null; }
        if (fallbackFunction === void 0) { fallbackFunction = null; }
        var _this = _super.call(this, name, failureThreshold, recoveryTimeout, expectedException, fallbackFunction) || this;
        _this.logger = new logger_1.Logger({ serviceName: name });
        return _this;
    }
    /** Count failure and open circuit, if threshold has been reached */
    InMemoryCircuitBreaker.prototype.callFailed = function () {
        this.logger.info('The requested call failed');
        this.failureCount += 1;
        if (this.isThresholdOccurred()) {
            this.logger.warn('Failure count is above the threshold {this._failure_threshold}. moving state to open');
            this.state = BaseCircuitBreaker_1.State.Open;
            this.opened = Date.now();
        }
    };
    /** Close circuit after successful execution and reset failure count */
    InMemoryCircuitBreaker.prototype.callSucceeded = function () {
        this.logger.info('The requested call succeeded, state is: closed');
        this.state = BaseCircuitBreaker_1.State.Closed;
        this.lastFailure = null;
        this.failureCount = 0;
    };
    InMemoryCircuitBreaker.prototype.getFailureCount = function () {
        this.logger.info("Failure count: ".concat(this.failureCount));
        return this.failureCount;
    };
    InMemoryCircuitBreaker.prototype.getFallbackFunction = function () {
        return this.fallbackFunction;
    };
    InMemoryCircuitBreaker.prototype.getLaseFailure = function () {
        this.logger.info("Last failure: ".concat(this.lastFailure));
        return this.lastFailure;
    };
    InMemoryCircuitBreaker.prototype.getName = function () {
        this.logger.info("Name: ".concat(this.name));
        return this.name;
    };
    InMemoryCircuitBreaker.prototype.getState = function () {
        this.logger.info("Setting state to close");
        if (this.state == BaseCircuitBreaker_1.State.Open && this.openRemaining() <= 0) {
            this.logger.info('The state has switched to half-open');
            return BaseCircuitBreaker_1.State.HalfOpen;
        }
        this.logger.info("The state is: ".concat(this.state));
        return this.state;
    };
    InMemoryCircuitBreaker.prototype.openRemaining = function () {
        var remaining = (this.opened + this.recoveryTimeoutMilli) - Date.now();
        this.logger.info("Remaining milliseconds until switch to half-open ".concat(remaining));
        return remaining;
    };
    InMemoryCircuitBreaker.prototype.openUntil = function () {
        var open_approx = new Date(Date.now() + this.openRemaining());
        this.logger.info("Approximate time when the circuit breaker will return to half open: ".concat(open_approx));
        return open_approx;
    };
    InMemoryCircuitBreaker.prototype.setClose = function () {
        this.logger.info("Setting state to close");
        return this.state == BaseCircuitBreaker_1.State.Closed;
    };
    InMemoryCircuitBreaker.prototype.setOpen = function () {
        this.logger.info("Setting state to open");
        return this.state == BaseCircuitBreaker_1.State.Open;
    };
    return InMemoryCircuitBreaker;
}(BaseCircuitBreaker_1.BaseCircuitBreaker));
exports.InMemoryCircuitBreaker = InMemoryCircuitBreaker;
var circuit = function () {
    return;
};
exports.circuit = circuit;
