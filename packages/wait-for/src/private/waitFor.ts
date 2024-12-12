/*!
 * The MIT License (MIT)
 * Copyright (c) 2017 Kent C. Dodds
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// Adopted from https://github.com/testing-library/dom-testing-library/blob/a86c54ccda5242ad8dfc1c70d31980bdbf96af7f/src/wait-for.js

/// <reference types="jest" />

import { getConfig } from './config.ts';
import {
  // We import these from the helpers rather than using the global version
  // because these will be *real* timers, regardless of whether we're in
  // an environment that's faked the timers out.
  jestFakeTimersAreEnabled
} from './helpers.ts';

// This is so the stack trace the developer sees is one that's
// closer to their code (because async stack traces are hard to follow).
function copyStackTrace(target: unknown, source: unknown): void {
  if (
    target &&
    typeof target === 'object' &&
    'stack' in target &&
    'message' in target &&
    typeof target.message === 'string' &&
    source &&
    typeof source === 'object' &&
    'message' in source &&
    typeof source.message === 'string' &&
    'stack' in source &&
    typeof source.stack === 'string'
  ) {
    target.stack = source.stack.replace(source.message, target.message);
  }
}

type WaitForInit = {
  timeout?: number | undefined;
  showOriginalStackTrace?: boolean | undefined;
  stackTraceError?: unknown | undefined;
  interval?: number | undefined;
  onTimeout?: ((error: unknown) => unknown) | undefined;
};

function waitFor<T>(
  callback: () => T,
  {
    timeout = getConfig().asyncUtilTimeout,
    showOriginalStackTrace = getConfig().showOriginalStackTrace,
    stackTraceError,
    interval = 50,
    onTimeout = error => error
  }: WaitForInit
): Promise<T> {
  if (typeof callback !== 'function') {
    throw new TypeError('Received `callback` arg must be a function');
  }

  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    let lastError: unknown;
    let intervalId: number;
    let finished = false;
    let promiseStatus = 'idle';

    const overallTimeoutTimer = setTimeout(handleTimeout, timeout);

    const usingJestFakeTimers = jestFakeTimersAreEnabled();
    if (usingJestFakeTimers) {
      const { unstable_advanceTimersWrapper: advanceTimersWrapper } = getConfig();
      checkCallback();
      // this is a dangerous rule to disable because it could lead to an
      // infinite loop. However, eslint isn't smart enough to know that we're
      // setting finished inside `onDone` which will be called when we're done
      // waiting or when we've timed out.
      // eslint-disable-next-line no-unmodified-loop-condition
      while (!finished) {
        if (!jestFakeTimersAreEnabled()) {
          const error = new Error(
            `Changed from using fake timers to real timers while using waitFor. This is not allowed and will result in very strange behavior. Please ensure you're awaiting all async things your test is doing before changing to real timers. For more info, please go to https://github.com/testing-library/dom-testing-library/issues/830`
          );
          if (!showOriginalStackTrace) copyStackTrace(error, stackTraceError);
          reject(error);
          return;
        }

        // In this rare case, we *need* to wait for in-flight promises
        // to resolve before continuing. We don't need to take advantage
        // of parallelization so we're fine.
        // https://stackoverflow.com/a/59243586/971592
        // eslint-disable-next-line no-await-in-loop
        await advanceTimersWrapper(async () => {
          // we *could* (maybe should?) use `advanceTimersToNextTimer` but it's
          // possible that could make this loop go on forever if someone is using
          // third party code that's setting up recursive timers so rapidly that
          // the user's timer's don't get a chance to resolve. So we'll advance
          // by an interval instead. (We have a test for this case).

          if (
            'clock' in setTimeout &&
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            typeof (setTimeout as any).clock === 'object' &&
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            'tick' in (setTimeout as any).clock &&
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            typeof (setTimeout as any).clock.tick === 'function'
          ) {
            // Added support for fake timers which added a setTimeout.clock.tick function, such as Sinon.JS and Jest.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (setTimeout as any).clock.tick(interval);
          } else {
            // Jest use Sinon.JS, but if we call jest.advanceTimersByTime with Sinon.JS fake timers, it will console.error().
            // So we prefer setTimeout.clock.tick before jest.advanceTimersByTime.
            jest.advanceTimersByTime(interval);
          }
        });

        // Could have timed-out
        if (finished) {
          break;
        }
        // It's really important that checkCallback is run *before* we flush
        // in-flight promises. To be honest, I'm not sure why, and I can't quite
        // think of a way to reproduce the problem in a test, but I spent
        // an entire day banging my head against a wall on this.
        checkCallback();
      }
    } else {
      intervalId = setInterval(checkRealTimersCallback, interval);
      checkCallback();
    }

    function onDone(error: unknown, result: null): void;
    function onDone(error: null, result: T): void;
    function onDone(error: unknown | null, result: T | null): void {
      finished = true;
      clearTimeout(overallTimeoutTimer);

      if (!usingJestFakeTimers) {
        clearInterval(intervalId);
      }

      if (error) {
        reject(error);
      } else {
        resolve(result as T);
      }
    }

    function checkRealTimersCallback() {
      if (jestFakeTimersAreEnabled()) {
        const error = new Error(
          `Changed from using real timers to fake timers while using waitFor. This is not allowed and will result in very strange behavior. Please ensure you're awaiting all async things your test is doing before changing to fake timers. For more info, please go to https://github.com/testing-library/dom-testing-library/issues/830`
        );
        if (!showOriginalStackTrace) copyStackTrace(error, stackTraceError);
        return reject(error);
      } else {
        return checkCallback();
      }
    }

    function checkCallback() {
      if (promiseStatus === 'pending') return;
      try {
        const result = callback();
        if (result && typeof result === 'object' && 'then' in result && typeof result?.then === 'function') {
          promiseStatus = 'pending';
          (result as PromiseLike<T>).then(
            resolvedValue => {
              promiseStatus = 'resolved';
              onDone(null, resolvedValue);
            },
            rejectedValue => {
              promiseStatus = 'rejected';
              lastError = rejectedValue;
            }
          );
        } else {
          onDone(null, result);
        }
        // If `callback` throws, wait for the next mutation, interval, or timeout.
      } catch (error) {
        // Save the most recent callback error to reject the promise with it in the event of a timeout
        lastError = error;
      }
    }

    function handleTimeout() {
      let error: unknown;
      if (lastError) {
        error = lastError;
      } else {
        error = new Error('Timed out in waitFor.');
        if (!showOriginalStackTrace) {
          copyStackTrace(error, stackTraceError);
        }
      }
      onDone(onTimeout(error), null);
    }
  });
}

function waitForWrapper<T>(callback: () => T, options?: undefined | WaitForInit) {
  // create the error here so its stack trace is as close to the
  // calling code as possible
  const stackTraceError = new Error('STACK_TRACE_MESSAGE');
  return getConfig().asyncWrapper(() => waitFor(callback, { stackTraceError, ...options }));
}

export { waitForWrapper as waitFor, type WaitForInit };

/*
eslint
  max-lines-per-function: ["error", {"max": 200}],
*/
