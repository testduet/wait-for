import FakeTimers from '@sinonjs/fake-timers';
import { waitFor } from '../src/index';

jest.setTimeout(1_000);

describe.each([
  ['Jest fake timers' as const],
  ['Jest fake timers with auto advance' as const],
  ['real timers' as const],
  ['Sinon.JS fake timers' as const],
  ['Sinon.JS fake timers with auto advance' as const]
])('waitFor with %s', mode => {
  it('should work with queueMicrotask', () =>
    waitFor(() => new Promise<void>(resolve => queueMicrotask(() => resolve()))));
  it('should work with setTimeout', () => waitFor(() => new Promise<void>(resolve => setTimeout(() => resolve(), 0))));
  it('should work with Promise', () => waitFor(() => new Promise<void>(resolve => resolve())));
  it('should work with Promise.resolve', () => waitFor(() => Promise.resolve()));
  it('should work with sync', () => waitFor(() => 0));

  it('should work with Date.now()', async () => {
    const now = Date.now();

    await waitFor(() => new Promise<void>(resolve => setTimeout(() => resolve(), 100)));

    if (mode === 'Jest fake timers' || mode === 'Sinon.JS fake timers') {
      expect(Date.now() - now).toEqual(100);
    } else {
      expect(Date.now() - now).toBeGreaterThanOrEqual(100);
    }
  });

  it('should reject when throwing an error', () =>
    expect(() =>
      waitFor(
        () => {
          throw new Error('Artificial.');
        },
        { timeout: 100 }
      )
    ).rejects.toThrow('Artificial.'));

  it('should reject when throwing a number', () =>
    expect(() =>
      waitFor(
        () => {
          throw 1;
        },
        { timeout: 100 }
      )
    ).rejects.toBe(1));

  it('should reject when reject with an error', () =>
    expect(() => waitFor(() => Promise.reject(new Error('Artificial.')), { timeout: 100 })).rejects.toThrow(
      'Artificial.'
    ));

  it('should reject when reject with a number', () =>
    expect(() => waitFor(() => Promise.reject(1), { timeout: 100 })).rejects.toBe(1));

  let fakeTimers: FakeTimers.InstalledClock | undefined;

  beforeEach(() => {
    if (mode === 'Jest fake timers') {
      jest.useFakeTimers({ advanceTimers: false });
    } else if (mode === 'Jest fake timers with auto advance') {
      jest.useFakeTimers({ advanceTimers: true });
    } else if (mode === 'Sinon.JS fake timers') {
      fakeTimers = FakeTimers.install({ shouldAdvanceTime: false });
    } else if (mode === 'Sinon.JS fake timers with auto advance') {
      fakeTimers = FakeTimers.install({ shouldAdvanceTime: true });
    }
  });

  afterEach(() => {
    if (mode === 'Jest fake timers' || mode === 'Jest fake timers with auto advance') {
      jest.useRealTimers();
    } else if (mode === 'Sinon.JS fake timers' || mode === 'Sinon.JS fake timers with auto advance') {
      fakeTimers.uninstall();
    }
  });
});
