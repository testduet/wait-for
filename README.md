# `@testduet/wait-for`

> Adopted from `@testing-library/dom` and work without DOM implementation.

Loop a function and spin-wait until it return or resolve.

## Background

`@testing-library/dom` has an excellent [`waitFor()` function](https://testing-library.com/docs/dom-testing-library/api-async/#waitfor). It helps simplifying tests. However, the function requires DOM implementation.

This package adopted the `waitFor()` function with some modificiations:

- Ported to TypeScript
- Removed DOM-related code
- Added support of [Sinon.JS fake timers](https://npmjs.com/package/@sinonjs/fake-timers), in additional to Jest fake timers

## How to use

The following code resolve and reject based on probability. If the promise is being rejected, `waitFor()` will rerun it until timeout. The default timeout is 1 second and rerun interval is 50 milliseconds.

```ts
import { waitFor } from '@testduet/waitfor`;

it('should work', async () => {
  await waitFor(
    () =>
      /** @type {Promise<void>} */
      new Promise((resolve, reject) => setTimeout(() => (Math.random() > 0.5 ? resolve() : reject()), 100))
  );
});
```

If the function does not resolve before timeout, the last error will be thrown.

`waitFor()` works with Jest fake timers. Supports of Sinon.JS fake timers is added to this package. The spin-wait will automatically advance fake timers.

## Behaviors

### What are the differences between `@testing-library/dom` and this package?

- This package adopted the code from `@testing-library/dom@10.4.0`
- This package works without DOM implementation
   - `@testing-library/dom` version is recommended when working with DOM
      - Better diagnostic information related to DOM
      - `MutationObserver` on the whole document to speed up spin-wait
- This package added support of [Sinon.JS fake timers](https://www.npmjs.com/package/@sinonjs/fake-timers)

### Why are my tests generating many test snapshots?

Consider using `expect().toMatchInlineSnapshot()` instead of `expect().toMatchSnapshot()`.

`waitFor()` expects the callback function to be [idempotent](https://en.wikipedia.org/wiki/Idempotence). The callback function will be called multiple times until it succeed.

If `expect().toMatchSnapshot()` is placed inside the callback function, it will be called multiple times until the snapshot passed. This could generates many test snapshots.

## Contributions

Like us? [Star](https://github.com/testduet/wait-for/stargazers) us.

Want to make it better? [File](https://github.com/testduet/wait-for/issues) us an issue.

Don't like something you see? [Submit](https://github.com/testduet/wait-for/pulls) a pull request.
