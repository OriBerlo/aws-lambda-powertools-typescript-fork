import { InMemoryCircuitBreaker } from './InMemoryCircuitBreaker';
import { DynamoDBCircuitBreaker } from './DynamoDBCircuitBreaker';

function failGenerator(a: number, b: number, c: number): number {
  console.log(a, b, c);
  if (a < 4) throw new Error('lalal');
  else return a;

}

async function main() {
  console.log(`Hello world!`);
  const cb = new DynamoDBCircuitBreaker('test1', 3, 8);
  // call it if we are not sure the item is in the db
  await cb.initCBItemInDynamodb();
  console.log('successfully initialised dynamo-db-breaker');

  // const cb = new InMemoryCircuitBreaker('test1', 3, 8);
  // console.log('successfully initialised in-memory-circuit-breaker');

  for (let i = 1; i < 10; i++) {
    try {
      const a = await cb.call(failGenerator, i, 2, 3);
      console.log(`returned value from function ${a}`);
    } catch (error) {
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