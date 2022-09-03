"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryCircuitBreaker = void 0;
const BaseCircuitBreaker_1 = require("./BaseCircuitBreaker");
class InMemoryCircuitBreaker extends BaseCircuitBreaker_1.BaseCircuitBreaker {
    constructor(name, failureThreshold, recoveryTimeout, expectedException, fallbackFunction) {
        super(name, failureThreshold, recoveryTimeout, expectedException, fallbackFunction);
    }
    /** Count failure and open circuit, if threshold has been reached */
    async callFailed() {
        this.logger.info('The requested call failed');
        this.failureCount += 1;
        this.logger.info(`Incrementing failure count: ${this.failureCount}`);
        let isThOccurred = await this.isThresholdOccurred();
        if (isThOccurred) {
            this.logger.warn(`Failure count is above the threshold ${this.failureThreshold}. moving state to open`);
            this.state = BaseCircuitBreaker_1.State.Open;
            this.opened = Date.now();
        }
        console.log('finished call failed');
    }
    /** Close circuit after successful execution and reset failure count */
    async callSucceeded() {
        this.logger.info('The requested call succeeded, state is: closed');
        this.state = BaseCircuitBreaker_1.State.Closed;
        this.lastFailure = null;
        this.failureCount = 0;
    }
    async getFailureCount() {
        this.logger.info(`Failure count: ${this.failureCount}`);
        return this.failureCount;
    }
    async getFallbackFunction() {
        return this.fallbackFunction;
    }
    async getLaseFailure() {
        this.logger.info(`Last failure: ${this.lastFailure}`);
        return this.lastFailure;
    }
    async getName() {
        this.logger.info(`Name: ${this.name}`);
        return this.name;
    }
    async getState() {
        if (this.state == BaseCircuitBreaker_1.State.Open && await this.openRemaining() <= 0) {
            this.logger.info('The state has switched to half-open');
            return BaseCircuitBreaker_1.State.HalfOpen;
        }
        this.logger.info(`The state is: ${BaseCircuitBreaker_1.State[this.state.valueOf()]}`);
        return this.state;
    }
    async openRemaining() {
        const remaining = (this.opened + this.recoveryTimeoutMilli) - Date.now();
        this.logger.info(`Remaining milliseconds until switch to half-open ${remaining}`);
        return remaining;
    }
    async openUntil() {
        const open_approx = new Date(Date.now() + await this.openRemaining());
        this.logger.info(`Approximate time when the circuit breaker will return to half open: ${open_approx}`);
        return open_approx;
    }
    // eslint-disable-next-line @typescript-eslint/member-ordering
    async isClose() {
        this.logger.info(`Checking if state is close`);
        let state = await this.getState();
        return state == BaseCircuitBreaker_1.State.Closed;
    }
    async isOpen() {
        this.logger.info(`Checking if state is open`);
        let state = await this.getState();
        return state == BaseCircuitBreaker_1.State.Open;
    }
}
exports.InMemoryCircuitBreaker = InMemoryCircuitBreaker;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW5NZW1vcnlDaXJjdWl0QnJlYWtlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9Jbk1lbW9yeUNpcmN1aXRCcmVha2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZEQUErRDtBQUUvRCxNQUFNLHNCQUF1QixTQUFRLHVDQUFrQjtJQUVyRCxZQUNFLElBQVksRUFDWixnQkFBeUIsRUFDekIsZUFBd0IsRUFDeEIsaUJBQWdDLEVBQ2hDLGdCQUEwQztRQUMxQyxLQUFLLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFLGVBQWUsRUFBRSxpQkFBaUIsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ3RGLENBQUM7SUFFRCxvRUFBb0U7SUFDN0QsS0FBSyxDQUFDLFVBQVU7UUFDckIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsMkJBQTJCLENBQUMsQ0FBQztRQUM5QyxJQUFJLENBQUMsWUFBWSxJQUFJLENBQUMsQ0FBQztRQUN2QixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQywrQkFBK0IsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7UUFDckUsSUFBSSxZQUFZLEdBQUcsTUFBTSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztRQUNwRCxJQUFJLFlBQVksRUFBRTtZQUNoQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyx3Q0FBd0MsSUFBSSxDQUFDLGdCQUFnQix3QkFBd0IsQ0FBQyxDQUFDO1lBQ3hHLElBQUksQ0FBQyxLQUFLLEdBQUcsMEJBQUssQ0FBQyxJQUFJLENBQUM7WUFDeEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7U0FDMUI7UUFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUVELHVFQUF1RTtJQUNoRSxLQUFLLENBQUMsYUFBYTtRQUV4QixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUks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