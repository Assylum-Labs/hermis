# @hermis/solana-headless-core

<p align="center">
  <img src="https://iq.wiki/_next/image?url=https%3A%2F%2Fipfs.everipedia.org%2Fipfs%2FQmTaB5ygg5qNMDKmnfPgottNRZTe7PXzMpe3Tg7Bdw57HN&w=1080&q=95" width="100" alt="Solana Logo">
  <h3 align="center">Core Wallet SDK for Solana</h3>
</p>

<p align="center">
  A flexible, lightweight, and headless wallet management library for Solana
</p>

## 🌟 Overview

`@hermis/solana-headless-core` provides the fundamental building blocks for wallet management, transaction signing, and Solana network interactions. As part of the Solana Headless SDK, this package focuses on the core functionality without imposing any UI constraints.

## ✨ Features

- **Wallet Creation & Management**: Create, import, and manage Solana wallets
- **Transaction Handling**: Sign and send transactions to the Solana network
- **Network Management**: Easy connection to different Solana networks (Mainnet, Devnet, Testnet)
- **Minimal Dependencies**: Built with focus on performance and minimal bundle size
- **Framework Agnostic**: Use with any UI framework or backend implementation

## 📦 Installation

```bash
# Using pnpm (recommended)
pnpm add @hermis/solana-headless-core

# Using npm
npm install @hermis/solana-headless-core

# Using yarn
yarn add @hermis/solana-headless-core
```

## 🚀 Quick Start

```typescript
import { 
  createConnection, 
  createWallet, 
  WalletAdapterNetwork 
} from "@hermis/solana-headless-core";

// Create a new wallet
const wallet = createWallet();
console.log("New wallet created with public key:", wallet.publicKey.toBase58());

// Connect to a Solana network
const connection = createConnection(WalletAdapterNetwork.Devnet);

// Create a wallet manager
import { WalletManager } from "@hermis/solana-headless-core";
const manager = new WalletManager(WalletAdapterNetwork.Devnet);

// Connect to a wallet adapter
const phantomAdapter = /* ... get an adapter from the @hermis/solana-headless-adapter-base */;
await manager.connect(phantomAdapter);

// Get the wallet's balance
const balance = await manager.getBalance();
console.log(`Wallet balance: ${balance} SOL`);
```

## 📋 API Reference

### Connection Management

```typescript
// Create a connection to a Solana network
import { createConnection, WalletAdapterNetwork } from "@hermis/solana-headless-core";

// Connect to mainnet
const mainnetConnection = createConnection(WalletAdapterNetwork.Mainnet);

// Connect to devnet
const devnetConnection = createConnection(WalletAdapterNetwork.Devnet);

// Connect to testnet
const testnetConnection = createConnection(WalletAdapterNetwork.Testnet);

// Connect to a custom RPC endpoint
const customConnection = createConnection("https://my-custom-solana-rpc.com");

// With custom commitment
const confirmedConnection = createConnection(
  WalletAdapterNetwork.Mainnet, 
  "confirmed"
);

// With full connection config
const customConfigConnection = createConnection(
  WalletAdapterNetwork.Mainnet, 
  {
    commitment: "finalized",
    confirmTransactionInitialTimeout: 30000
  }
);
```

### Wallet Management

```typescript
// Create, import, and export wallets
import { 
  createWallet, 
  importWallet, 
  exportWallet 
} from "@hermis/solana-headless-core";

// Create a new wallet
const newWallet = createWallet();

// Import an existing wallet
const secretKey = new Uint8Array([/* your secret key */]);
const importedWallet = importWallet(secretKey);

// Export a wallet's secret key
const exportedSecretKey = exportWallet(newWallet);
```

### Wallet Manager

```typescript
import { WalletManager, WalletAdapterNetwork } from "@hermis/solana-headless-core";

// Create a wallet manager for devnet
const manager = new WalletManager(WalletAdapterNetwork.Devnet);

// Connect to a wallet adapter
await manager.connect(adapter);

// Get wallet balance
const balance = await manager.getBalance();

// Get wallet public key
const publicKey = manager.getPublicKey();
```

### Transaction Operations

```typescript
import { 
  signTransaction, 
  sendTransaction, 
  signMessage 
} from "@hermis/solana-headless-core";
import { Transaction } from "@solana/web3.js";

// Sign a transaction with a wallet
const signedTransaction = await signTransaction(transaction, wallet);

// Send a signed transaction to the network
const signature = await sendTransaction(connection, signedTransaction, wallet);

// Sign a message
const message = "Hello, Solana!";
const signedMessage = await signMessage(message, adapter);
```

## 🔗 Related Packages

- [@hermis/solana-headless-adapter-base](../adapter-base/README.md): Base adapter implementations
- [@hermis/solana-headless-react](../react-core/README.md): React integration for Solana Headless SDK

## 📜 License

This project is licensed under Apache 2.0.