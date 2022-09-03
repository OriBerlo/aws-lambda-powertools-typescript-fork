import { BaseCircuitBreaker, State } from './BaseCircuitBreaker';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

const REGION = 'us-east-1';

class DynamoDBCircuitBreaker extends BaseCircuitBreaker {

  private readonly tableName: string;
  private ddbClient: DocumentClient;

  public constructor(
    name: string,
    failureThreshold?: number,
    recoveryTimeout?: number,
    expectedException?: Array<Error>,
    fallbackFunction?: CallableFunction | null,
    tableName: string = 'ori-test',
    region: string = REGION) {
    super(name, failureThreshold, recoveryTimeout, expectedException, fallbackFunction);
    this.tableName = tableName;
    this.ddbClient = new DocumentClient({ region: region });
  }

  /** Count failure and open circuit, if threshold has been reached */
  public async callFailed(): Promise<void> {
    this.logger.info('The requested call failed');
    this.failureCount += 1;
    this.logger.info(`Incrementing failure count: ${this.failureCount}`);
    if (await this.isThresholdOccurred()) {
      this.logger.warn(`Failure count is above the threshold ${this.failureThreshold}. moving state to open`);
      this.state = State.Open;
      this.opened = Date.now();
    }
    await this.updateCBItemFromDynamoDB({
      cbState: State[this.state.valueOf()],
      opened: this.opened,
      failureCount: this.failureCount,
      lastFailure: String(this.lastFailure)
    });

  }

  /** Close circuit after successful execution and reset failure count */
  public async callSucceeded(): Promise<void> {

    this.logger.info('The requested call succeeded, state is: closed');
    this.state = State.Closed;
    this.lastFailure = null;
    this.failureCount = 0;
    await this.updateCBItemFromDynamoDB({
      cbState: State[this.state],
      lastFailure: String(this.lastFailure),
      failureCount: this.failureCount,
      opened: this.opened
    });
  }

  public async getFailureCount(): Promise<number> {
    const item = await this.getCBItemFromDynamoDB();
    if (item != undefined) this.failureThreshold = item.failureThreshold;
    this.logger.info(`Failure count: ${this.failureCount}`);

    return this.failureCount;
  }

  public async getFallbackFunction(): Promise<CallableFunction | null> {
    const item = await this.getCBItemFromDynamoDB();
    if (item != undefined) this.fallbackFunction = item.fallbackFunction;
    
    return this.fallbackFunction;
  }

  public async getLaseFailure(): Promise<Error | null> {
    const item = await this.getCBItemFromDynamoDB();
    if (item != undefined) this.lastFailure = item.lastFailure;
    this.logger.info(`Last failure: ${this.lastFailure}`);
    
    return this.lastFailure;
  }

  public async getName(): Promise<string> {
    this.logger.info(`Name: ${this.name}`);

    return this.name;
  }

  public async getState(): Promise<State> {
    this.logger.info('retrieving circuit breaker state');
    const item = await this.getCBItemFromDynamoDB();
    if (item == undefined) {
      throw new Error('undefined item returned from db');
    }
    this.state = State[item.cbState] as unknown as State;

    if (item.cbState == State[State.Open.valueOf()] && await this.openRemaining() <= 0) {
      this.logger.info('The state has switched to half-open');
      await this.updateCBItemFromDynamoDB({
        cbState: State[State.HalfOpen.valueOf()],
        opened: this.opened,
        failureCount: this.failureCount,
        lastFailure: this.lastFailure != null ? String(this.lastFailure) : ''
      });
      this.logger.info('updated db successfully');
      
      return State.HalfOpen;
    }
    this.logger.info(`The state is: ${State[this.state.valueOf()]}`);
    
    return this.state;
  }

  public async openRemaining(): Promise<number> {
    const item = await this.getCBItemFromDynamoDB();
    if (item != undefined) {
      this.opened = item.opened;
      this.recoveryTimeoutMilli = item.recoveryTimeout;
    }

    const remaining = (this.opened + this.recoveryTimeoutMilli) - Date.now();
    this.logger.info(`Remaining milliseconds until switch to half-open ${remaining}`);

    return remaining;
  }

  public async openUntil(): Promise<Date> {
    const open_approx = new Date(Date.now() + await this.openRemaining());
    this.logger.info(`Approximate time when the circuit breaker will return to half open: ${open_approx.toString()}`);

    return open_approx;
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public async isClose(): Promise<boolean> {
    this.logger.info(`Checking if state is close`);

    return await this.getState() == State.Closed;
  }

  public async isOpen(): Promise<boolean> {
    this.logger.info(`Checking if state is open`);

    return await this.getState() == State.Open;
  }

  // you have to call this function if you need to init the object
  public async initCBItemInDynamodb() {
    try {
      this.logger.info('retrieving circuit breaker object from dynamoDB');
      const item = await this.getCBItemFromDynamoDB();
      if (item == null) {
        this.logger.info('circuit breaker does not exist in dynamodb table, putting an empty item in dynamodb');
        await this.putCBItemInDynamoDB(this.getEmptyCircuitBreakerDynamoEntry());
      } else {
        return item;
      }
    } catch (error) {
      this.logger.error('circuit breaker does not exist in dynamodb table');
      await this.putCBItemInDynamoDB(this.getEmptyCircuitBreakerDynamoEntry());
    }
  }

  private getEmptyCircuitBreakerDynamoEntry(): CircuitBreakerDynamoObject {
    return {
      name: this.name,
      cbState: State[State.Closed.valueOf()],
      opened: this.opened,
      failureCount: this.failureCount,
      lastFailure: '',
      failureThreshold: this.failureThreshold,
      recoveryTimeout: this.recoveryTimeoutMilli,
      expectedException: this.expectedExceptions.toString()
    };
  }

  private async putCBItemInDynamoDB(CBDynamoDBObject: CircuitBreakerDynamoObject) {
    try {
      this.logger.info('Putting a new item to DB');
      const params = {
        TableName: this.tableName,
        Item: CBDynamoDBObject
      };
      await this.ddbClient.put(params).promise();
      this.logger.info(`Successfully updated item`);
    } catch (error) {
      this.logger.info('error');
    }
  }

  private async getCBItemFromDynamoDB() {
    const params = {
      TableName: 'ori-test',
      Key: {
        name: this.name,
      },
    };
    try {
      this.logger.info('Getting item from DB');
      const result = await this.ddbClient.get(params).promise();
      this.logger.info(`Successfully got result`);
      
      return result.Item!;
    } catch (error) {
      this.logger.info(`Error occurred while getting item from db. params: ${params}`);
    }
  }

  private async updateCBItemFromDynamoDB(CBDynamoDBObject: CircuitBreakerDynamoDataObject) {
    const params = {
      TableName: 'ori-test',
      Key: {
        name: this.name,
      },
      UpdateExpression: 'SET cbState=:cb_state, opened=:cb_opened, failureCount=:cb_failure_count, lastFailure=:cb_last_failure',
      ExpressionAttributeValues: {
        ':cb_state': CBDynamoDBObject.cbState,
        ':cb_opened': CBDynamoDBObject.opened,
        ':cb_failure_count': CBDynamoDBObject.failureCount,
        ':cb_last_failure': CBDynamoDBObject.lastFailure
      }
    };
    try {
      this.logger.info('Putting a new item to DB');
      await this.ddbClient.update(params).promise();
    } catch (error) {
      this.logger.info(`Error occurred while getting item from db. params: ${params}`);
    }
  }

}

export {
  DynamoDBCircuitBreaker
};
