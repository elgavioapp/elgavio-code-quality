import { it } from 'vitest';

it('asserts nothing', () => {
  void Promise.resolve();
});
