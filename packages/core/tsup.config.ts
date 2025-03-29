import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],  // Specify your entry file
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
});