import FakeTimers from '@sinonjs/fake-timers';
import { waitFor } from '@testduet/wait-for';
import { expect } from 'expect';
import { afterEach, beforeEach, describe, test } from 'node:test';
import { format } from 'node:util';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function describeEach<T extends any[]>(cases: readonly T[]) {
  return (name: string, fn: (...args: T) => void) => {
    for (const args of cases) {
      describe(format(name, ...args), () => fn(...args));
    }
  };
}

describeEach([
  ['Sinon.JS fake timers', undefined] as const,
  ['Sinon.JS fake timers with', 'shouldAdvanceTime'] as const
])('waitFor with %s', (_, mode) => {
  let fakeTimers: FakeTimers.InstalledClock | undefined;

  beforeEach(() => {
    fakeTimers = FakeTimers.install({ shouldAdvanceTime: mode === 'shouldAdvanceTime' });
  });

  afterEach(() => {
    fakeTimers?.uninstall();
  });

  test('should work with queueMicrotask', () => waitFor(() => new Promise<void>(resolve => queueMicrotask(resolve))));

  test('should work with setTimeout', () => waitFor(() => new Promise<void>(resolve => setTimeout(resolve, 0))));

  test('should work with Promise', () => waitFor(() => new Promise<void>(resolve => resolve())));

  test('should work with Promise.resolve', () => waitFor(() => Promise.resolve()));

  test('should work with sync', () => waitFor(async () => 0));

  test('should work with Date.now()', async () => {
    const now = Date.now();

    await waitFor(() => new Promise<void>(resolve => setTimeout(resolve, 100)));

    if (mode === 'shouldAdvanceTime') {
      expect(Date.now() - now).toBeGreaterThanOrEqual(100);
    } else {
      expect(Date.now() - now).toEqual(100);
    }
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
