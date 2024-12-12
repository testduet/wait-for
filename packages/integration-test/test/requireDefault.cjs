/// <reference types="mocha" />

const { waitFor } = require('@testduet/wait-for');

describe('CommonJS', () => {
  it('should work', async () => {
    /** @type {Promise<void>} */
    const promise = new Promise((resolve, reject) =>
      setTimeout(() => (Math.random() > 0.5 ? resolve() : reject()), 100)
    );

    await waitFor(() => promise);
  });
});
