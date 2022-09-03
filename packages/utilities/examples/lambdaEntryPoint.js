const DynamoDBCircuitBreaker_1 = require('./DynamoDBCircuitBreaker');

function failGenerator(a, b, c) {
  return a;
}

exports.handler = async (event) => {
  // TODO implement
  const cb = new DynamoDBCircuitBreaker_1.DynamoDBCircuitBreaker('test1', 3, 8);
  console.log('init dynamo circuit breaker');
  // call it if we are not sure the item is in the db
  await cb.initCBItemInDynamodb();
  console.log('successfully initialised dynamo-db-breaker');
  // const cb = new InMemoryCircuitBreaker('test1', 3, 8);
  // console.log('successfully initialised in-memory-circuit-breaker');
  const a = await cb.call(failGenerator, 1, 2, 3);
  console.log(`returned value from function ${a}`);

  const response = {
    statusCode: 200,
    body: JSON.stringify('LOLOLO'),
  };

  return response;
};
