import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const isProduction = command === 'build'

  return {
    // Custom domain (hermis.dev) serves at root, not a GH Pages subpath.
    base: '/',
    plugins: [
      react(),
    ],
    define: {
      global: 'globalThis',
      'process.env': {},
      // Enable development mode for better error messages from @hermis/errors
      __DEV__: !isProduction,
    },
    resolve: {
      alias: {
        buffer: 'buffer',
      },
    },
    optimizeDeps: {
      include: ['buffer'],
    },
    build: {
      outDir: 'dist',
      sourcemap: isProduction,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            solana: ['@solana/web3.js']
          }
        }
      }
    }
  }
})
