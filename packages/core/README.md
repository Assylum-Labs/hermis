# @agateh/solana-headless-core

<p align="center">
  <img src="https://iq.wiki/_next/image?url=https%3A%2F%2Fipfs.everipedia.org%2Fipfs%2FQmTaB5ygg5qNMDKmnfPgottNRZTe7PXzMpe3Tg7Bdw57HN&w=1080&q=95" width="100" alt="Solana Logo">
  <h3 align="center">Core Wallet SDK for Solana</h3>
</p>

<p align="center">
  A flexible, lightweight, and headless wallet management library for Solana
</p>

## 🌟 Overview

`@agateh/solana-headless-core` provides the fundamental building blocks for wallet management, transaction signing, and Solana network interactions. As part of the Solana Headless SDK, this package focuses on the core functionality without imposing any UI constraints.

## ✨ Features

- **Wallet Creation & Management**: Create, import, and manage Solana wallets
- **Transaction Handling**: Sign and send transactions to the Solana network
- **Network Management**: Easy connection to different Solana networks (Mainnet, Devnet, Testnet)
- **Minimal Dependencies**: Built with focus on performance and minimal bundlesize
- **Framework Agnostic**: Use with any UI framework or backend implementation

## 📦 Installation

```bash
# Using pnpm (recommended)
pnpm add @agateh/solana-headless-core

# Using npm
npm install @agateh/solana-headless-core

# Using yarn
yarn add @agateh/solana-headless-core
```

## 🚀 Quick Start

```typescript
import { HeadlessWalletSDK } from "@agateh/solana-headless-core";

// Initialize the SDK with your API key
const sdk = new HeadlessWalletSDK("your-api-key");

// Create a new wallet
const createWallet = async () => {
  const wallet = await sdk.createWallet();
  console.log("New wallet created:", wallet);
};

// Sign a transaction
const signTransaction = async (transaction) => {
  const signedTx = await sdk.signTransaction(transaction);
  return signedTx;
};
```

## 📋 API Reference

### `HeadlessWalletSDK`

The main class that provides wallet functionality:

```typescript
const sdk = new HeadlessWalletSDK(apiKey, baseUrl);
```

#### Methods:

- `createWallet()`: Creates a new wallet
- `signTransaction(transaction)`: Signs a transaction with the wallet

### Low-level Utilities

In addition to the main SDK class, several utility functions are available:

- `createConnection(network)`: Creates a new Solana connection to specified network
- `createWallet()`: Creates a new wallet (keypair)
- `importWallet(secretKey)`: Imports a wallet from a secret key
- `exportWallet(wallet)`: Exports a wallet's secret key
- `signTransaction(transaction, wallet)`: Signs a transaction
- `sendTransaction(connection, transaction, wallet)`: Sends a signed transaction
- `signMessage(message, wallet)`: Signs a message

## 🛠️ Development

This package is part of the Solana Headless SDK monorepo.

```bash
# Clone the repository
git clone https://github.com/yourusername/solana-headless-sdk.git

# Install dependencies
pnpm install

# Build the core package
pnpm --filter "@agateh/solana-headless-core" build
```

## 📚 Examples

### Creating a Wallet

```typescript
import { HeadlessWalletSDK } from "@agateh/solana-headless-core";

const sdk = new HeadlessWalletSDK("your-api-key");

async function setupWallet() {
  try {
    const wallet = await sdk.createWallet();
    console.log("Wallet created:", wallet);
    return wallet;
  } catch (error) {
    console.error("Error creating wallet:", error);
  }
}
```

### Signing and Sending a Transaction

```typescript
import { HeadlessWalletSDK } from "@agateh/solana-headless-core";
import { Transaction, SystemProgram, PublicKey } from "@solana/web3.js";

const sdk = new HeadlessWalletSDK("your-api-key");

async function sendTokens(recipientAddress, amount) {
  try {
    // Create a transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(recipientAddress),
        lamports: amount,
      })
    );
    
    // Sign and send the transaction
    const signature = await sdk.signTransaction(transaction);
    console.log("Transaction sent with signature:", signature);
    return signature;
  } catch (error) {
    console.error("Error sending transaction:", error);
  }
}
```

## 🔗 Related Packages

- [@agateh/solana-headless-react](../react-core/README.md): React hooks and components for Solana wallet integration

## 📜 License

This project is licensed under Apache 2.0.