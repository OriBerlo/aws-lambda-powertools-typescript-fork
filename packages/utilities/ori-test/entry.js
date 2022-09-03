"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DynamoDBCircuitBreaker_1 = require("./DynamoDBCircuitBreaker");
function failGenerator(a, b, c) {
    console.log(a, b, c);
    if (a < 4)
        throw new Error('lalal');
    else
        return a;
}
async function main() {
    console.log(`Hello world!`);
    const cb = new DynamoDBCircuitBreaker_1.DynamoDBCircuitBreaker('test1', 3, 8);
    // call it if we are not sure the item is in the db
    await cb.initCBItemInDynamodb();
    console.log('successfully initialised dynamo-db-breaker');
    // const cb = new InMemoryCircuitBreaker('test1', 3, 8);
    // console.log('successfully initialised in-memory-circuit-breaker');
    for (let i = 1; i < 10; i++) {
        try {
            const a = await cb.call(failGenerator, i, 2, 3);
            console.log(`returned value from function ${a}`);
        }
        catch (error) {
            console.log(`an error occured! error:${String(error)}`);
            if (error.message === 'CircuitBreakerException') {
                await new Promise(resolve => setTimeout(resolve, 10000));
                console.log('slept 10 seconds!');
            }
        }
    }
}
main().then(() => {
    console.log('!!!! finished !!!!');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW50cnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZW50cnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxxRUFBZ0U7QUFHaEUsU0FBUyxhQUFhLENBQUMsQ0FBUyxFQUFFLENBQVMsRUFBRSxDQUFTO0lBQ3BELE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNyQixJQUFJLENBQUMsR0FBRyxDQUFDO1FBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQzs7UUFDL0IsT0FBTyxDQUFDLENBQUM7QUFFaEIsQ0FBQztBQUdELEtBQUssVUFBVSxJQUFJO0lBQ2pCLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDNUIsTUFBTSxFQUFFLEdBQUcsSUFBSSwrQ0FBc0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3JELG1EQUFtRDtJQUNuRCxNQUFNLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO0lBQ2hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsNENBQTRDLENBQUMsQ0FBQztJQUcxRCx3REFBd0Q7SUFDeEQscUVBQXFFO0lBR3JFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDM0IsSUFBSTtZQUNGLE1BQU0sQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoRCxPQUFPLENBQUMsR0FBRyxDQUFDLGdDQUFnQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQ2xEO1FBQUMsT0FBTyxLQUFLLEVBQUU7WUFDZCxPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUEyQixNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3hELElBQUksS0FBSyxDQUFDLE9BQU8sS0FBSyx5QkFBeUIsRUFBRTtnQkFDL0MsTUFBTSxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDekQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2FBQ2xDO1NBRUY7S0FDRjtBQUNILENBQUM7QUFFRCxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO0lBQ2YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0FBQ3BDLENBQUMsQ0FBQyxDQUFBIn0=