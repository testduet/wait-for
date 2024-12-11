import { defineConfig } from 'tsup';

export default defineConfig([
  {
    dts: true,
    entry: {
      'wait-for': './src/index.ts'
    },
    format: ['cjs', 'esm'],
    sourcemap: true,
    target: 'esnext'
  }
]);
