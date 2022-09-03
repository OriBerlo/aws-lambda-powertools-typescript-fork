const DynamoDBCircuitBreaker_1 = require('./DynamoDBCircuitBreaker');

function failGenerator(a, b, c) {
  console.log(a, b, c);
  if (a < 4)
    throw new Error('lalal');
}

exports.handler = async (event) => {
  // TODO implement
  const cb = new DynamoDBCircuitBreaker_1.DynamoDBCircuitBreaker('test1', 3, 60);
  console.log('init dynamo circuit breaker');
  // call it if we are not sure the item is in the db
  await cb.initCBItemInDynamodb();
  console.log('successfully initialised dynamo-db-breaker');
  // const cb = new InMemoryCircuitBreaker('test1', 3, 8);
  // console.log('successfully initialised in-memory-circuit-breaker');
  for (let i = 1; i < 5; i++) {
    try {
      const a = await cb.call(failGenerator, i, 2, 3);
      console.log(`returned value from function ${a}`);
    }
    catch (error) {
      console.log(`an error occured! error:${String(error)}`);
      if (error.message === 'CircuitBreakerException') {
        return;
      }
    }
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify('LOLOLO'),
  };
  
  return response;
};
