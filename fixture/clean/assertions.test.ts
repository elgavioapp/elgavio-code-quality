import { afterEach, beforeAll, describe, expect, it } from 'vitest';

let ready = '';

const assertPositive = (value: number) => {
  expect(value, 'value must be positive').toBeGreaterThan(0);
};

beforeAll(() => {
  ready = 'yes';
  expect(ready, 'setup failed').toBe('yes');
});

afterEach(() => {
  expect(ready).not.toBe('');
});

describe('assertions', () => {
  it('counts an assert helper as an assertion', () => {
    assertPositive(1);
  });
});
