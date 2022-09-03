import { Logger } from '@aws-lambda-powertools/logger';

enum State {
  Closed,
  HalfOpen,
  Open
}

const DEFAULT_RECOVERY_TIMEOUT: number = 60;
const DEFAULT_FAILURE_THRESHOLD: number = 5;
const MILLI_TO_SECONDS_FACTOR: number = 1000;

abstract class BaseCircuitBreaker {
  protected expectedExceptions: Array<Error>;
  protected failureCount: number;
  protected failureThreshold: number;
  protected fallbackFunction: CallableFunction | null;
  protected lastFailure: Error | null;
  protected name: string;
  protected opened: number;
  protected recoveryTimeoutMilli: number;
  protected state: State;
  // eslint-disable-next-line @typescript-eslint/member-ordering
  protected logger: Logger;

  protected constructor(
    name: string,
    failureThreshold = DEFAULT_FAILURE_THRESHOLD,
    recoveryTimeout = DEFAULT_RECOVERY_TIMEOUT,
    expectedException = new Array<Error>(new Error('shah'), new Error('mama')),
    fallbackFunction: CallableFunction | null = null) {
    this.lastFailure = null;
    this.failureCount = 0;
    this.failureThreshold = failureThreshold;
    this.recoveryTimeoutMilli = recoveryTimeout * MILLI_TO_SECONDS_FACTOR;

    this.expectedExceptions = expectedException;
    this.fallbackFunction = fallbackFunction;
    this.name = name;
    this.state = State.Closed;
    this.opened = Date.now();
    this.logger = new Logger({ serviceName: name });

  }

  protected async isExpectedFailure(currErrName: string): Promise<boolean> {
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
  public async call(func: CallableFunction, ...args: unknown[]): Promise<unknown> {
    const isOpen = await this.isOpen();
    if (isOpen) {
      if (this.fallbackFunction !== null) {
        return this.fallbackFunction(args);
      } else {
        throw new Error('CircuitBreakerException');
      }
    }
    // in case the circuit breaker isn't open, we want to call the function.
    try {
      const fRes = func(...args);
      await this.callSucceeded();
      
      return fRes;
    } catch (error) {
      // in case the error is of type Error, and in expected failure -> handle with callFailed func
      if (error instanceof Error) {
        if (await this.isExpectedFailure(error.name)) {
          this.lastFailure = new Error(error.name);
          await this.callFailed();
        } else {
          this.logger.warn(`The exception is not in the expected exceptions. reraising`);
        }
      } else {
        this.logger.warn(`Caught error is not of type Error, error: ${String(error)}`);
        // throw error in case the error didn't fit any expected error.
      }
      throw error;
    }
  }

  protected abstract callFailed(): Promise<void>;

  protected abstract callSucceeded(): Promise<void>;

  protected abstract getFailureCount(): Promise<number>;

  protected abstract getFallbackFunction(): Promise<CallableFunction | null> ;

  protected abstract getLaseFailure(): Promise<Error | null>;

  protected abstract getName(): Promise<string>;

  protected abstract getState(): Promise<State>;

  protected async isThresholdOccurred(): Promise<boolean> {
    return this.failureCount >= this.failureThreshold;
  }

  protected abstract openRemaining(): Promise<number>;

  protected abstract openUntil(): Promise<Date>;

  protected abstract isClose(): Promise<boolean>;

  protected abstract isOpen(): Promise<boolean>;

}

export {
  BaseCircuitBreaker, State, DEFAULT_FAILURE_THRESHOLD, DEFAULT_RECOVERY_TIMEOUT
};