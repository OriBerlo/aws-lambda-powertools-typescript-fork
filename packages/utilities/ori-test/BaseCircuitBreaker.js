"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_RECOVERY_TIMEOUT = exports.DEFAULT_FAILURE_THRESHOLD = exports.State = exports.BaseCircuitBreaker = void 0;
const logger_1 = require("@aws-lambda-powertools/logger");
var State;
(function (State) {
    State[State["Closed"] = 0] = "Closed";
    State[State["HalfOpen"] = 1] = "HalfOpen";
    State[State["Open"] = 2] = "Open";
})(State || (State = {}));
exports.State = State;
const DEFAULT_RECOVERY_TIMEOUT = 60;
exports.DEFAULT_RECOVERY_TIMEOUT = DEFAULT_RECOVERY_TIMEOUT;
const DEFAULT_FAILURE_THRESHOLD = 5;
exports.DEFAULT_FAILURE_THRESHOLD = DEFAULT_FAILURE_THRESHOLD;
const MILLI_TO_SECONDS_FACTOR = 1000;
class BaseCircuitBreaker {
    constructor(name, failureThreshold = DEFAULT_FAILURE_THRESHOLD, recoveryTimeout = DEFAULT_RECOVERY_TIMEOUT, expectedException = new Array(new Error('shah'), new Error('mama')), fallbackFunction = null) {
        this.lastFailure = null;
        this.failureCount = 0;
        this.failureThreshold = failureThreshold;
        this.recoveryTimeoutMilli = recoveryTimeout * MILLI_TO_SECONDS_FACTOR;
        this.expectedExceptions = expectedException;
        this.fallbackFunction = fallbackFunction;
        this.name = name;
        this.state = State.Closed;
        this.opened = Date.now();
        this.logger = new logger_1.Logger({ serviceName: name });
    }
    async isExpectedFailure(currErrName) {
        this.logger.info(currErrName);
        for (const element of this.expectedExceptions) {
            if (currErrName === element.name) {
                this.logger.info(`The error is in expected exceptions`);
                return true;
            }
        }
        return false;
    }
    // eslint-disable-next-line @typescript-eslint/member-ordering
    async call(func, ...args) {
        let isOpen = await this.isOpen();
        if (isOpen) {
            if (this.fallbackFunction !== null) {
                return this.fallbackFunction(args);
            }
            else {
                throw new Error('CircuitBreakerException');
            }
        }
        // in case the circuit breaker isn't open, we want to call the function.
        try {
            let fRes = func(...args);
            await this.callSucceeded();
            return fRes;
        }
        catch (error) {
            // in case the error is of type Error, and in expected failure -> handle with callFailed func
            if (error instanceof Error) {
                if (await this.isExpectedFailure(error.name)) {
                    this.lastFailure = new Error(error.name);
                    await this.callFailed();
                }
                else {
                    this.logger.warn(`The exception is not in the expected exceptions. reraising`);
                }
            }
            else {
                this.logger.warn(`Caught error is not of type Error, error: ${String(error)}`);
                // throw error in case the error didn't fit any expected error.
            }
            throw error;
        }
    }
    async isThresholdOccurred() {
        return this.failureCount >= this.failureThreshold;
    }
}
exports.BaseCircuitBreaker = BaseCircuitBreaker;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQmFzZUNpcmN1aXRCcmVha2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL0Jhc2VDaXJjdWl0QnJlYWtlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwwREFBcUQ7QUFFckQsSUFBSyxLQUlKO0FBSkQsV0FBSyxLQUFLO0lBQ1IscUNBQU0sQ0FBQTtJQUNOLHlDQUFRLENBQUE7SUFDUixpQ0FBSSxDQUFBO0FBQ04sQ0FBQyxFQUpJLEtBQUssS0FBTCxLQUFLLFFBSVQ7QUFpSHFCLHNCQUFLO0FBL0czQixNQUFNLHdCQUF3QixHQUFXLEVBQUUsQ0FBQztBQStHWSw0REFBd0I7QUE5R2hGLE1BQU0seUJBQXlCLEdBQVcsQ0FBQyxDQUFDO0FBOEdmLDhEQUF5QjtBQTdHdEQsTUFBTSx1QkFBdUIsR0FBVyxJQUFJLENBQUM7QUFFN0MsTUFBZSxrQkFBa0I7SUFhL0IsWUFDRSxJQUFZLEVBQ1osZ0JBQWdCLEdBQUcseUJBQXlCLEVBQzVDLGVBQWUsR0FBRyx3QkFBd0IsRUFDMUMsb0JBQW9CLElBQUksS0FBSyxDQUFRLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQzFFLG1CQUE0QyxJQUFJO1FBQ2hELElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDO1FBQ3RCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQztRQUN6QyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsZUFBZSxHQUFHLHVCQUF1QixDQUFDO1FBRXRFLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxpQkFBaUIsQ0FBQztRQUM1QyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsZ0JBQWdCLENBQUM7UUFDekMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDakIsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO1FBQzFCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsRUFBQyxXQUFXLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztJQUVoRCxDQUFDO0lBRVMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLFdBQW1CO1FBQ25ELElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzlCLEtBQUssTUFBTSxPQUFPLElBQUksSUFBSSxDQUFDLGtCQUFrQixFQUFFO1lBQzdDLElBQUksV0FBVyxLQUFLLE9BQU8sQ0FBQyxJQUFJLEVBQUU7Z0JBQ2hDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLHFDQUFxQyxDQUFDLENBQUM7Z0JBRXhELE9BQU8sSUFBSSxDQUFDO2FBQ2I7U0FDRjtRQUVELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVELDhEQUE4RDtJQUN2RCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQXNCLEVBQUUsR0FBRyxJQUFXO1FBQ3RELElBQUksTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2pDLElBQUksTUFBTSxFQUFFO1lBQ1YsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEtBQUssSUFBSSxFQUFFO2dCQUNsQyxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNwQztpQkFBTTtnQkFDTCxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7YUFDNUM7U0FDRjtRQUNELHdFQUF3RTtRQUN4RSxJQUFJO1lBQ0YsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7WUFDekIsTUFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDM0IsT0FBTyxJQUFJLENBQUE7U0FDWjtRQUFDLE9BQU8sS0FBSyxFQUFFO1lBQ2QsNkZBQTZGO1lBQzdGLElBQUksS0FBSyxZQUFZLEtBQUssRUFBRTtnQkFDMUIsSUFBSSxNQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQzVDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUN6QyxNQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztpQkFDekI7cUJBQU07b0JBQ0wsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsNERBQTRELENBQUMsQ0FBQztpQkFDaEY7YUFDRjtpQkFBTTtnQkFDTCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyw2Q0FBNkMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDL0UsK0RBQStEO2FBQ2hFO1lBQ0QsTUFBTSxLQUFLLENBQUM7U0FDYjtJQUNILENBQUM7SUFnQlMsS0FBSyxDQUFDLG1CQUFtQjtRQUNqQyxPQUFPLElBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDO0lBQ3BELENBQUM7Q0FVRjtBQUdDLGdEQUFrQiJ9