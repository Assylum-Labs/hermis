import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const isProduction = command === 'build'
  const isGithubPages = process.env.GITHUB_PAGES === 'true'
  
  return {
    base: isGithubPages ? '/hermis/' : '/',
    plugins: [
      react(),
    ],
    define: {
      global: 'globalThis',
      'process.env': {},
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
