import { BaseCircuitBreaker, State } from './BaseCircuitBreaker';

class InMemoryCircuitBreaker extends BaseCircuitBreaker {

  public constructor(
    name: string,
    failureThreshold?: number,
    recoveryTimeout?: number,
    expectedException?: Array<Error>,
    fallbackFunction?: CallableFunction | null) {
    super(name, failureThreshold, recoveryTimeout, expectedException, fallbackFunction);
  }

  /** Count failure and open circuit, if threshold has been reached */
  public async callFailed(): Promise<void> {
    this.logger.info('The requested call failed');
    this.failureCount += 1;
    this.logger.info(`Incrementing failure count: ${this.failureCount}`);
    const isThOccurred = await this.isThresholdOccurred();
    if (isThOccurred) {
      this.logger.warn(`Failure count is above the threshold ${this.failureThreshold}. moving state to open`);
      this.state = State.Open;
      this.opened = Date.now();
    }
    console.log('finished call failed');
  }

  /** Close circuit after successful execution and reset failure count */
  public async callSucceeded(): Promise<void> {

    this.logger.info('The requested call succeeded, state is: closed');
    this.state = State.Closed;
    this.lastFailure = null;
    this.failureCount = 0;
  }

  public async getFailureCount(): Promise<number> {
    this.logger.info(`Failure count: ${this.failureCount}`);

    return this.failureCount;
  }

  public async getFallbackFunction(): Promise<CallableFunction | null> {
    return this.fallbackFunction;
  }

  public async getLaseFailure(): Promise<Error | null> {
    this.logger.info(`Last failure: ${this.lastFailure}`);

    return this.lastFailure;
  }

  public async getName(): Promise<string> {
    this.logger.info(`Name: ${this.name}`);

    return this.name;
  }

  public async getState(): Promise<State> {
    if (this.state == State.Open && await this.openRemaining() <= 0) {
      this.logger.info('The state has switched to half-open');

      return State.HalfOpen;
    }
    this.logger.info(`The state is: ${State[this.state.valueOf()]}`);

    return this.state;
  }

  public async openRemaining(): Promise<number> {
    const remaining = (this.opened + this.recoveryTimeoutMilli) - Date.now();
    this.logger.info(`Remaining milliseconds until switch to half-open ${remaining}`);

    return remaining;
  }

  public async openUntil(): Promise<Date> {
    const open_approx = new Date(Date.now() + await this.openRemaining());
    this.logger.info(`Approximate time when the circuit breaker will return to half open: ${open_approx}`);

    return open_approx;
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public async isClose(): Promise<boolean> {
    this.logger.info(`Checking if state is close`);
    const state = await this.getState();

    return state == State.Closed;
  }

  public async isOpen(): Promise<boolean> {
    this.logger.info(`Checking if state is open`);
    const state = await this.getState();

    return state == State.Open;

  }
}

export {
  InMemoryCircuitBreaker
};

