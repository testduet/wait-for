import { defineConfig } from 'tsup';

export default defineConfig([
  {
    dts: true,
    entry: {
      ['wait-for'.split('/').at(-1) as string]: './src/index.ts'
    },
    format: ['cjs', 'esm'],
    sourcemap: true,
    target: 'esnext'
  }
]);
