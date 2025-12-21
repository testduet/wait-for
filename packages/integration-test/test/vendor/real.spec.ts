import { waitFor } from '@testduet/wait-for';
import { expect } from 'expect';
import { describe, test } from 'node:test';

describe('real timers', () => {
  test('should work with queueMicrotask', () => waitFor(() => new Promise<void>(resolve => queueMicrotask(resolve))));

  test('should work with setTimeout', () => waitFor(() => new Promise<void>(resolve => setTimeout(resolve, 0))));

  test('should work with Promise', () => waitFor(() => new Promise<void>(resolve => resolve())));

  test('should work with Promise.resolve', () => waitFor(() => Promise.resolve()));

  test('should work with sync', () => waitFor(async () => 0));

  test('should work with Date.now()', async () => {
    const now = Date.now();

    await waitFor(() => new Promise<void>(resolve => setTimeout(resolve, 100)));

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

  test('should reject when reject with an error', () =>
    expect(async () => {
      const promise = waitFor(() => Promise.reject(new Error('Artificial')), { timeout: 100 });

      promise.catch(() => {});

      await promise;
    }).rejects.toThrow('Artificial'));

  test('should reject when reject with a number', () =>
    expect(async () => {
      const promise = waitFor(() => Promise.reject(1), { timeout: 100 });

      promise.catch(() => {});

      await promise;
    }).rejects.toBe(1));
});
