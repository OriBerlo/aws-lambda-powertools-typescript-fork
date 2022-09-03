interface CircuitBreakerDynamoObject {
  name: string
  cbState: string
  opened: number
  failureCount: number
  lastFailure: string
  failureThreshold: number
  recoveryTimeout: number
  expectedException: string
}

interface CircuitBreakerDynamoDataObject {
  cbState: string
  opened: number
  failureCount: number
  lastFailure: string
}