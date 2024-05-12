/**
 * Type definition for test data arguments and the expected result.
 */
export type TestDataArgs<TArgs extends unknown[], TExpected> = [[...TArgs], TExpected];
