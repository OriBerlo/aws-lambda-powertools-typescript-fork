"use strict";
Object.defineProperty(exports, "__esModule", {value: true});
exports.DynamoDBCircuitBreaker = void 0;
const BaseCircuitBreaker_1 = require("./BaseCircuitBreaker");
const dynamodb_1 = require("aws-sdk/clients/dynamodb");
const REGION = 'us-east-1';

class DynamoDBCircuitBreaker extends BaseCircuitBreaker_1.BaseCircuitBreaker {
    constructor(name, failureThreshold, recoveryTimeout, expectedException, fallbackFunction, tableName = 'ori-test', region = REGION) {
        super(name, failureThreshold, recoveryTimeout, expectedException, fallbackFunction);
        this.tableName = tableName;
        this.ddbClient = new dynamodb_1.DocumentClient({region: region});
    }

    /** Count failure and open circuit, if threshold has been reached */
    async callFailed() {
        this.logger.info('The requested call failed');
        this.failureCount += 1;
        this.logger.info(`Incrementing failure count: ${this.failureCount}`);
        if (await this.isThresholdOccurred()) {
            this.logger.warn(`Failure count is above the threshold ${this.failureThreshold}. moving state to open`);
            this.state = BaseCircuitBreaker_1.State.Open;
            this.opened = Date.now();
        }
        await this.updateCBItemFromDynamoDB({
            cbState: BaseCircuitBreaker_1.State[this.state.valueOf()],
            opened: this.opened,
            failureCount: this.failureCount,
            lastFailure: String(this.lastFailure)
        });
    }

    /** Close circuit after successful execution and reset failure count */
    async callSucceeded() {
        this.logger.info('The requested call succeeded, state is: closed');
        this.state = BaseCircuitBreaker_1.State.Closed;
        this.lastFailure = null;
        this.failureCount = 0;
        await this.updateCBItemFromDynamoDB({
            cbState: BaseCircuitBreaker_1.State[this.state],
            lastFailure: String(this.lastFailure),
            failureCount: this.failureCount,
            opened: this.opened
        });
    }

    async getFailureCount() {
        let item = await this.getCBItemFromDynamoDB();
        if (item != undefined)
            this.failureThreshold = item.failureThreshold;
        this.logger.info(`Failure count: ${this.failureCount}`);
        return this.failureCount;
    }

    async getFallbackFunction() {
        let item = await this.getCBItemFromDynamoDB();
        if (item != undefined)
            this.fallbackFunction = item.fallbackFunction;
        return this.fallbackFunction;
    }

    async getLaseFailure() {
        let item = await this.getCBItemFromDynamoDB();
        if (item != undefined)
            this.lastFailure = item.lastFailure;
        this.logger.info(`Last failure: ${this.lastFailure}`);
        return this.lastFailure;
    }

    async getName() {
        this.logger.info(`Name: ${this.name}`);
        return this.name;
    }

    async getState() {
        this.logger.info("retrieving circuit breaker state");
        let item = await this.getCBItemFromDynamoDB();
        if (item == undefined) {
            throw new Error("undefined item returned from db");
        }
        this.state = BaseCircuitBreaker_1.State[item.cbState];
        if (item.cbState == BaseCircuitBreaker_1.State[BaseCircuitBreaker_1.State.Open.valueOf()] && await this.openRemaining() <= 0) {
            this.logger.info('The state has switched to half-open');
            await this.updateCBItemFromDynamoDB({
                cbState: BaseCircuitBreaker_1.State[BaseCircuitBreaker_1.State.HalfOpen.valueOf()],
                opened: this.opened,
                failureCount: this.failureCount,
                lastFailure: this.lastFailure != null ? String(this.lastFailure) : ""
            });
            this.logger.info('updated db successfully');
            return BaseCircuitBreaker_1.State.HalfOpen;
        }
        this.logger.info(`The state is: ${BaseCircuitBreaker_1.State[this.state.valueOf()]}`);
        return this.state;
    }

    async openRemaining() {
        let item = await this.getCBItemFromDynamoDB();
        if (item != undefined) {
            this.opened = item.opened;
            this.recoveryTimeoutMilli = item.recoveryTimeout;
        }
        let remaining = (this.opened + this.recoveryTimeoutMilli) - Date.now();
        this.logger.info(`Remaining milliseconds until switch to half-open ${remaining}`);
        return remaining;
    }

    async openUntil() {
        const open_approx = new Date(Date.now() + await this.openRemaining());
        this.logger.info(`Approximate time when the circuit breaker will return to half open: ${open_approx.toString()}`);
        return open_approx;
    }

    // eslint-disable-next-line @typescript-eslint/member-ordering
    async isClose() {
        this.logger.info(`Checking if state is close`);
        return await this.getState() == BaseCircuitBreaker_1.State.Closed;
    }

    async isOpen() {
        this.logger.info(`Checking if state is open`);
        return await this.getState() == BaseCircuitBreaker_1.State.Open;
    }

    // you have to call this function if you need to init the object
    async initCBItemInDynamodb() {
        try {
            this.logger.info("retrieving circuit breaker object from dynamoDB");
            let item = await this.getCBItemFromDynamoDB();
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

    getEmptyCircuitBreakerDynamoEntry() {
        return {
            name: this.name,
            cbState: BaseCircuitBreaker_1.State[BaseCircuitBreaker_1.State.Closed.valueOf()],
            opened: this.opened,
            failureCount: this.failureCount,
            lastFailure: "",
            failureThreshold: this.failureThreshold,
            recoveryTimeout: this.recoveryTimeoutMilli,
            expectedException: this.expectedExceptions.toString()
        };
    }

    async putCBItemInDynamoDB(CBDynamoDBObject) {
        try {
            this.logger.info("Putting a new item to DB");
            const params = {
                TableName: this.tableName,
                Item: CBDynamoDBObject
            };
            await this.ddbClient.put(params).promise();
            this.logger.info(`Successfully updated item`);
        } catch (error) {
            this.logger.info("error");
        }
    }

    async getCBItemFromDynamoDB() {
        const params = {
            TableName: "ori-test",
            Key: {
                name: this.name,
            },
        };
        try {
            this.logger.info("Getting item from DB");
            let result = await this.ddbClient.get(params).promise();
            this.logger.info(`Successfully got result`);
            return result.Item;
        } catch (error) {
            this.logger.info(`Error occurred while getting item from db. params: ${params}`);
        }
    }

    async updateCBItemFromDynamoDB(CBDynamoDBObject) {
        const params = {
            TableName: "ori-test",
            Key: {
                name: this.name,
            },
            UpdateExpression: 'SET cbState=:cb_state, opened=:cb_opened, failureCount=:cb_failure_count, lastFailure=:cb_last_failure',
            ExpressionAttributeValues: {
                ":cb_state": CBDynamoDBObject.cbState,
                ":cb_opened": CBDynamoDBObject.opened,
                ":cb_failure_count": CBDynamoDBObject.failureCount,
                ":cb_last_failure": CBDynamoDBObject.lastFailure
            }
        };
        try {
            this.logger.info("Putting a new item to DB");
            await this.ddbClient.update(params).promise();
        } catch (error) {
            this.logger.info(`Error occurred while getting item from db. params: ${params}`);
        }
    }
}

exports.DynamoDBCircuitBreaker = DynamoDBCircuitBreaker;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRHluYW1vREJDaXJjdWl0QnJlYWtlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9EeW5hbW9EQkNpcmN1aXRCcmVha2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZEQUErRDtBQUMvRCx1REFBbUU7QUFFbkUsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFBO0FBRzFCLE1BQU0sc0JBQXVCLFNBQVEsdUNBQWtCO0lBS3JELFlBQ0UsSUFBWSxFQUNaLGdCQUF5QixFQUN6QixlQUF3QixFQUN4QixpQkFBZ0MsRUFDaEMsZ0JBQTBDLEVBQzFDLFlBQW9CLFVBQVUsRUFDOUIsU0FBaUIsTUFBTTtRQUN2QixLQUFLLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFLGVBQWUsRUFBRSxpQkFBaUIsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3BGLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1FBQzNCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSx5QkFBYyxDQUFDLEVBQUMsTUFBTSxFQUFFLE1BQU0sRUFBQyxDQUFDLENBQUE7SUFDdkQsQ0FBQztJQUVELG9FQUFvRTtJQUM3RCxLQUFLLENBQUMsVUFBVTtRQUNyQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO1FBQzlDLElBQUksQ0FBQyxZQUFZLElBQUksQ0FBQyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLCtCQUErQixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUNyRSxJQUFJLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixFQUFFLEVBQUU7WUFDcEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsd0NBQXdDLElBQUksQ0FBQyxnQkFBZ0Isd0JBQXdCLENBQUMsQ0FBQztZQUN4RyxJQUFJLENBQUMsS0FBSyxHQUFHLDBCQUFLLENBQUMsSUFBSSxDQUFDO1lBQ3hCLElBQUksQ0FB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