/// <reference types="mocha" />

const { waitFor } = require('@testduet/wait-for');
const { describe, it } = require('node:test');

describe('CommonJS', () => {
  it('should work', async () => {
    await waitFor(
      () =>
        /** @type {Promise<void>} */
        new Promise((resolve, reject) => setTimeout(() => (Math.random() > 0.5 ? resolve() : reject()), 100))
    );
  });
});
