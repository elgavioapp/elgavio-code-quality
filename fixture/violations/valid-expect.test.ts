import { expect, it } from 'vitest';

it('passes too many arguments', () => {
  // @ts-expect-error expect takes at most a value and a message.
  expect(1, 'message', 'extra').toBe(1);
});
