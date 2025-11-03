# @hermis/solana-headless-adapter-base

[![npm version](https://img.shields.io/npm/v/@hermis/solana-headless-adapter-base.svg)](https://www.npmjs.com/package/@hermis/solana-headless-adapter-base)

Framework-agnostic wallet adapter implementation for Solana. Use with vanilla JavaScript or any UI framework.

## Installation

```bash
npm install @hermis/solana-headless-adapter-base
```

## Quick Start

```javascript
import {
  WalletAdapterManager,
  getStandardWalletAdapters,
  sortWalletAdapters
} from '@hermis/solana-headless-adapter-base';

// Get all standard wallet adapters (auto-detects Wallet Standard compatible wallets)
const adapters = getStandardWalletAdapters([]);
const sorted = sortWalletAdapters(adapters);

// Create wallet manager
const walletManager = new WalletAdapterManager(adapters);

// Subscribe to wallet events
walletManager.on('connect', (publicKey) => {
  console.log('Connected to wallet:', publicKey.toBase58());
});

walletManager.on('disconnect', () => {
  console.log('Wallet disconnected');
});

// Select and connect to a wallet
const phantomAdapter = adapters.find(adapter => adapter.name === 'Phantom');
if (phantomAdapter) {
  walletManager.selectAdapter(phantomAdapter.name);

  try {
    const adapter = await walletManager.connect();
    console.log('Successfully connected to', adapter.name);
  } catch (error) {
    console.error('Connection error:', error);
  }
}
```

## Documentation

For complete documentation, visit [docs.hermis.io/quickstart/adapter-base](https://docs.hermis.io/quickstart/adapter-base)

## API Reference

- [WalletAdapterManager](https://docs.hermis.io/api-reference/adapter-base/wallet-manager)
- [Utility Functions](https://docs.hermis.io/api-reference/adapter-base/utilities)

## License

Apache 2.0
