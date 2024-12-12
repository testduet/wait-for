/// <reference types="mocha" />

import { waitFor } from '@testduet/wait-for';

describe('ES Modules', () => {
  it('should work', async () => {
    await waitFor(
      () =>
        /** @type {Promise<void>} */
        new Promise((resolve, reject) => setTimeout(() => (Math.random() > 0.5 ? resolve() : reject()), 100))
    );
  });
});
