# @agateh/solana-headless-adapter-base

<p align="center">
  <img src="https://iq.wiki/_next/image?url=https%3A%2F%2Fipfs.everipedia.org%2Fipfs%2FQmTaB5ygg5qNMDKmnfPgottNRZTe7PXzMpe3Tg7Bdw57HN&w=1080&q=95" width="100" alt="Solana Logo">
  <h3 align="center">Base Adapter for Solana Headless SDK</h3>
</p>

<p align="center">
  A framework-agnostic wallet adapter implementation for Solana
</p>

## 🌟 Overview

`@agateh/solana-headless-adapter-base` provides the foundation for wallet adapter implementations in the Solana Headless SDK ecosystem. This package is completely framework-agnostic, allowing you to integrate Solana wallets with any UI framework or vanilla JavaScript.

## ✨ Features

- **Framework Agnostic**: Use with any UI framework or vanilla JavaScript
- **Standard Wallet Support**: Compatible with Wallet Standard interface
- **Extensible**: Easily build custom adapters on top of the base implementation
- **Event-based Architecture**: Subscribe to wallet events for reactive UIs
- **Full TypeScript Support**: Strong typing for developer experience

## 📦 Installation

```bash
# Using pnpm (recommended)
pnpm add @agateh/solana-headless-adapter-base

# Using npm
npm install @agateh/solana-headless-adapter-base

# Using yarn
yarn add @agateh/solana-headless-adapter-base
```

## 🧪 Live Demo

Experience our framework-agnostic implementation in action:

[**Try the Base Adapter Demo →**](https://agateh.github.io/solana-headless-sdk/)

This demo showcases how to use the base adapter with vanilla JavaScript, allowing you to connect to Solana wallets, manage wallet state, and interact with the Solana blockchain without any framework dependencies.

## 🚀 Quick Start

```javascript
import { 
  WalletAdapterManager, 
  getStandardWalletAdapters,
  sortWalletAdapters
} from '@agateh/solana-headless-adapter-base';

import {
  WalletAdapterNetwork,
  createConnection
} from '@agateh/solana-headless-core';

// Initialize adapters and connection
const adapters = getStandardWalletAdapters();
const connection = createConnection(WalletAdapterNetwork.Devnet);

// Create wallet manager
const walletManager = new WalletAdapterManager(adapters);

// Setup event listeners
walletManager.on('connect', (publicKey) => {
  console.log('Connected to wallet:', publicKey.toBase58());
});

// Select a wallet adapter
const phantomAdapter = adapters.find(adapter => adapter.name === 'Phantom');
if (phantomAdapter) {
  walletManager.selectAdapter(phantomAdapter.name);
}

// Connect to the selected wallet
async function connectWallet() {
  try {
    const adapter = await walletManager.connect();
    if (adapter) {
      console.log('Successfully connected to', adapter.name);
    }
  } catch (error) {
    console.error('Connection error:', error);
  }
}

// Call connectWallet when the user clicks a button
document.getElementById('connect-button').addEventListener('click', connectWallet);
```

## 📋 API Reference

### Core Functions

- `getStandardWalletAdapters()`: Get all available standard wallet adapters
- `initAdapters(adapters)`: Initialize adapters for use
- `selectAdapter(walletName)`: Select a wallet adapter by name
- `getWalletAdapters(readyState)`: Get adapters filtered by ready state
- `sortWalletAdapters(adapters)`: Sort adapters by priority

### WalletAdapterManager

The `WalletAdapterManager` class provides a complete wallet management solution:

```javascript
const manager = new WalletAdapterManager(adapters);

// Event subscription
manager.on('connect', handleConnect);
manager.on('disconnect', handleDisconnect);
manager.on('error', handleError);

// Wallet selection and connection
manager.selectAdapter('Phantom');
await manager.connect();
await manager.disconnect();
```

## 🛠️ Development

This package is part of the Solana Headless SDK monorepo.

```bash
# Clone the repository
git clone https://github.com/yourusername/solana-headless-sdk.git

# Install dependencies
pnpm install

# Build the adapter-base package
pnpm --filter "@agateh/solana-headless-adapter-base" build
```

## 📚 Related Packages

- [@agateh/solana-headless-core](../core/README.md): Core wallet functionality
- [@agateh/solana-headless-react](../react-core/README.md): React adapter implementation

## 📜 License

This project is licensed under Apache 2.0.