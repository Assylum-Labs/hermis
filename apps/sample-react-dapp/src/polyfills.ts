// Browser polyfills for Solana libraries
import { Buffer } from 'buffer'

// Extend window interface for polyfills
declare global {
  interface Window {
    Buffer: typeof Buffer
    global: typeof globalThis
    process: any
  }
}

// Polyfill Buffer globally
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer
  window.global = window.global || window
  window.process = window.process || {
    env: {},
    version: '',
    platform: 'browser'
  }
}

// Polyfill for Node.js globals
if (typeof global === 'undefined') {
  (globalThis as any).global = globalThis
}

// Export Buffer for explicit imports
export { Buffer } 