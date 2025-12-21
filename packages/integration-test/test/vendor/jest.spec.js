/* eslint-env jest */

/// <reference types="jest" />

const { waitFor } = require('@testduet/wait-for');

// @ts-ignore
describe.each([
  ['Jest fake timers without auto advance', false],
  ['Jest fake timers with auto advance', true]
])(
  'waitFor with %s',
  (
    // @ts-ignore
    _,
    /** @type {boolean} */
    advanceTimers
  ) => {
    /** @type {(durationInMS: number) => void} */

    beforeEach(() => jest.useFakeTimers({ advanceTimers, now: 0 }));

    afterEach(() => jest.useRealTimers());

    test('should work with queueMicrotask', () =>
      waitFor(() => /** @type {Promise<void>} */ (new Promise(resolve => queueMicrotask(resolve)))));

    test('should work with setTimeout', () => waitFor(() => new Promise(resolve => setTimeout(resolve, 0))));

    test('should work with Promise', () =>
      waitFor(() => /** @type {Promise<void>} */ (new Promise(resolve => resolve()))));

    test('should work with Promise.resolve', () => waitFor(() => Promise.resolve()));

    test('should work with sync', () => waitFor(async () => 0));

    test('should work with Date.now()', async () => {
      const now = Date.now();

      await waitFor(() => new Promise(resolve => setTimeout(resolve, 100)));

      // Jest quirks: despite we tick 100ms without auto advance, Jest ticked 150 or 250ms.
      expect(Date.now() - now).toBeGreaterThanOrEqual(100);
    });

    test('should reject when throwing an error', () =>
      expect(async () => {
        const promise = waitFor(
          () => {
            throw new Error('Artificial');
          },
          { timeout: 100 }
        );

        promise.catch(() => {});

        await promise;
      }).rejects.toThrow('Artificial'));

    test('should reject when throwing a number', () =>
      expect(async () => {
        const promise = waitFor(
          () => {
            throw 1;
          },
          { timeout: 100 }
        );

        promise.catch(() => {});

        await promise;
      }).rejects.toBe(1));

    test('should reject when reject with an error', async () => {
      await expect(async () => {
        const promise = waitFor(() => Promise.reject(new Error('Artificial')), { timeout: 100 });

        promise.catch(() => {});

        await promise;
      }).rejects.toThrow('Artificial');
    });

    test('should reject when reject with a number', () =>
      expect(async () => {
        const promise = waitFor(() => Promise.reject(1), { timeout: 100 });

        promise.catch(() => {});

        await promise;
      }).rejects.toBe(1));
  }
);
