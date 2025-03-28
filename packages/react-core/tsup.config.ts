// packages/react-core/tsup.config.ts
import type { Options } from 'tsup'

export default {
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['react', '@hermis/solana-headless-core'],
  tsconfig: './tsconfig.build.json'
} satisfies Options