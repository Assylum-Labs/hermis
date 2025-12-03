# @solana/headless-core

## 2.0.0

### Major Changes

- 01dafed: BREAKING CHANGE: Integrate @solana/kit with unified dual-architecture API and
  comprehensive error handling

  This major release adds full support for @solana/kit alongside legacy
  @solana/web3.js, providing automatic architecture detection and a future-proof
  development experience.

  ## Breaking Changes

  ### Unified Transaction API

  - **ENHANCED**: Core transaction methods (`signTransaction`,
    `sendTransaction`, `signAllTransactions`, `signAndSendTransaction`) now
    automatically support BOTH `@solana/web3.js`
    (Transaction/VersionedTransaction) AND `@solana/kit` (TransactionMessage)
  - **NEW**: All transaction methods accept optional `DualArchitectureOptions`
    for architecture control
  - **AUTOMATIC**: Transaction type detection - methods intelligently route to
    correct implementation
  - **TYPE-SAFE**: Generic signatures preserve transaction types throughout
    signing pipeline

  ### Wallet Standard Compliance

  - **FIXED**: Solana chain identifiers now comply with CAIP-2 standard
    (`solana:mainnet`, `solana:devnet`, `solana:testnet`)
  - **IMPROVED**: Enhanced wallet detection and connection handling
  - **BREAKING**: Non-compliant chain identifier formats no longer supported

  ## New Features

  ### @hermis/errors Package (NEW)

  - **Comprehensive error system** with structured error codes and categories
  - **Rich error context** including transaction details, wallet state, and
    operation metadata
  - **Developer-friendly** error messages with actionable guidance
  - **Consistent error handling** across all packages
    (@hermis/solana-headless-core, @hermis/solana-headless-react,
    @hermis/wallet-standard-base, @hermis/solana-headless-adapter-base)

  ### @solana/kit Architecture Support

  - **Full TransactionMessage support** with automatic type detection
  - **Kit wallet compatibility** (CryptoKeyPair, Address, Signers)
  - **Seamless architecture switching** - use web3.js and Kit in same
    application
  - **Helper utilities**:
    - `createKitTransaction()` - Create Kit-compatible TransactionMessage
    - `generateKitKeypair()` - Generate Kit CryptoKeyPair
    - `generateKeyPairSigner()` - Create transaction signing keypair
    - `signTransactionWithSigner()` - Sign using Kit signers
    - `createRPCConnection()` - Create Kit Rpc connection
    - `sendTransactionWithRPC()` - Send transactions via Kit RPC
    - `supportsKitArchitecture()` - Runtime architecture detection
    - `isKitTransaction()` - Transaction type checking

  ### Enhanced Type System

  - **Dual type definitions** supporting both architectures
    - `DualTransaction` - Transaction | VersionedTransaction |
      TransactionMessage
    - `DualWallet` - Keypair | Adapter | CryptoKeyPair | Address
    - `DualConnection` - Connection | Rpc
  - **Type guards** for runtime wallet and transaction detection
  - **Generic type preservation** in signing operations
  - **Full TypeScript inference** for mixed architecture usage

  ### New Exports from @hermis/solana-headless-react

  ```typescript
  // Core transaction methods (now dual-architecture)
  export {
    signMessage,
    signTransaction,
    signAllTransactions,
    sendTransaction,
    signAndSendTransaction,

    // Kit utilities
    createKitTransaction,
    generateKitKeypair,
    generateKeyPairSigner,
    signTransactionWithSigner,
    createRPCConnection,
    sendTransactionWithRPC,
    supportsKitArchitecture,
    isKitTransaction
  }

  New Exports from @hermis/solana-headless-adapter-base

  // Kit integration
  export * from './kit-integration';
  export * from './chain-utils';

  // Dual architecture types
  export type {
    DualArchitectureOptions,
    DualConnection,
    DualTransaction,
    DualWallet,
    MessageModifyingSigner,
    TransactionSendingSigner,
    SignableMessage,
    SignatureDictionary
  }

  Migration Guide

  ✅ Backward Compatible

  All existing web3.js code continues to work without modification:

  // Existing code - still works perfectly!
  import { useWallet } from '@hermis/solana-headless-react';
  import { Transaction } from '@solana/web3.js';

  const { signTransaction } = useWallet();
  const tx = new Transaction();
  // ... add instructions
  await signTransaction(tx); // ✅ Works exactly as before

   Using Kit Architecture (NEW)

  import {
    useWallet,
    createKitTransaction,
    generateKitKeypair
  } from '@hermis/solana-headless-react';

  // Create Kit transaction
  const kitTx = await createKitTransaction(connection, address, instructions);

  // Sign with same method - auto-detected!
  const { signTransaction } = useWallet();
  await signTransaction(kitTx); // ✅ Automatically uses Kit signing

   Mixed Architecture Usage

  import { signTransaction } from '@hermis/solana-headless-react';

  // Works with web3.js Transaction
  const web3Tx = new Transaction();
  await signTransaction(web3Tx);

  // Also works with Kit TransactionMessage
  const kitTx = await createKitTransaction(...);
  await signTransaction(kitTx);

  // Same method, different architectures!

  Error Handling Improvements

  import { HermisError, WalletErrorCode } from '@hermis/errors';

  try {
    await signTransaction(tx);
  } catch (error) {
    if (error instanceof HermisError) {
      console.log(error.code);        // e.g.,
  WalletErrorCode.SignTransactionError
      console.log(error.context);     // Rich context: wallet, transaction,
  operation
      console.log(error.getSolution()); // Actionable guidance
    }
  }

  Package Updates

  - @hermis/solana-headless-core: Dual architecture transaction handling, Kit
  signer utilities, enhanced error handling
  - @hermis/solana-headless-adapter-base: Kit integration layer, CAIP-2 chain
  utilities, dual architecture types
  - @hermis/solana-headless-react: Unified hooks API, Kit utility exports, dual
  architecture support
  - @hermis/wallet-standard-base: CAIP-2 compliant chain identifiers, improved
  wallet detection, better error handling
  - @hermis/errors (NEW): Comprehensive error handling system with rich context
  and developer guidance
  ```

## 2.0.0-beta.0

### Major Changes

- BREAKING CHANGE: Integrate @solana/kit with unified dual-architecture API and
  comprehensive error handling

  This major release adds full support for @solana/kit alongside legacy
  @solana/web3.js, providing automatic architecture detection and a future-proof
  development experience.

  ## Breaking Changes

  ### Unified Transaction API

  - **ENHANCED**: Core transaction methods (`signTransaction`,
    `sendTransaction`, `signAllTransactions`, `signAndSendTransaction`) now
    automatically support BOTH `@solana/web3.js`
    (Transaction/VersionedTransaction) AND `@solana/kit` (TransactionMessage)
  - **NEW**: All transaction methods accept optional `DualArchitectureOptions`
    for architecture control
  - **AUTOMATIC**: Transaction type detection - methods intelligently route to
    correct implementation
  - **TYPE-SAFE**: Generic signatures preserve transaction types throughout
    signing pipeline

  ### Wallet Standard Compliance

  - **FIXED**: Solana chain identifiers now comply with CAIP-2 standard
    (`solana:mainnet`, `solana:devnet`, `solana:testnet`)
  - **IMPROVED**: Enhanced wallet detection and connection handling
  - **BREAKING**: Non-compliant chain identifier formats no longer supported

  ## New Features

  ### @hermis/errors Package (NEW)

  - **Comprehensive error system** with structured error codes and categories
  - **Rich error context** including transaction details, wallet state, and
    operation metadata
  - **Developer-friendly** error messages with actionable guidance
  - **Consistent error handling** across all packages
    (@hermis/solana-headless-core, @hermis/solana-headless-react,
    @hermis/wallet-standard-base, @hermis/solana-headless-adapter-base)

  ### @solana/kit Architecture Support

  - **Full TransactionMessage support** with automatic type detection
  - **Kit wallet compatibility** (CryptoKeyPair, Address, Signers)
  - **Seamless architecture switching** - use web3.js and Kit in same
    application
  - **Helper utilities**:
    - `createKitTransaction()` - Create Kit-compatible TransactionMessage
    - `generateKitKeypair()` - Generate Kit CryptoKeyPair
    - `generateKeyPairSigner()` - Create transaction signing keypair
    - `signTransactionWithSigner()` - Sign using Kit signers
    - `createRPCConnection()` - Create Kit Rpc connection
    - `sendTransactionWithRPC()` - Send transactions via Kit RPC
    - `supportsKitArchitecture()` - Runtime architecture detection
    - `isKitTransaction()` - Transaction type checking

  ### Enhanced Type System

  - **Dual type definitions** supporting both architectures
    - `DualTransaction` - Transaction | VersionedTransaction |
      TransactionMessage
    - `DualWallet` - Keypair | Adapter | CryptoKeyPair | Address
    - `DualConnection` - Connection | Rpc
  - **Type guards** for runtime wallet and transaction detection
  - **Generic type preservation** in signing operations
  - **Full TypeScript inference** for mixed architecture usage

  ### New Exports from @hermis/solana-headless-react

  ```typescript
  // Core transaction methods (now dual-architecture)
  export {
    signMessage,
    signTransaction,
    signAllTransactions,
    sendTransaction,
    signAndSendTransaction,

    // Kit utilities
    createKitTransaction,
    generateKitKeypair,
    generateKeyPairSigner,
    signTransactionWithSigner,
    createRPCConnection,
    sendTransactionWithRPC,
    supportsKitArchitecture,
    isKitTransaction
  }

  New Exports from @hermis/solana-headless-adapter-base

  // Kit integration
  export * from './kit-integration';
  export * from './chain-utils';

  // Dual architecture types
  export type {
    DualArchitectureOptions,
    DualConnection,
    DualTransaction,
    DualWallet,
    MessageModifyingSigner,
    TransactionSendingSigner,
    SignableMessage,
    SignatureDictionary
  }

  Migration Guide

  Backward Compatible

  All existing web3.js code continues to work without modification:

  // Existing code - still works perfectly!
  import { useWallet } from '@hermis/solana-headless-react';
  import { Transaction } from '@solana/web3.js';

  const { signTransaction } = useWallet();
  const tx = new Transaction();
  // ... add instructions
  await signTransaction(tx);

  Using Kit Architecture (NEW)

  import {
    useWallet,
    createKitTransaction,
    generateKitKeypair
  } from '@hermis/solana-headless-react';

  // Create Kit transaction
  const kitTx = await createKitTransaction(connection, address, instructions);

  // Sign with same method - auto-detected!
  const { signTransaction } = useWallet();
  await signTransaction(kitTx);

  Mixed Architecture Usage

  import { signTransaction } from '@hermis/solana-headless-react';

  // Works with web3.js Transaction
  const web3Tx = new Transaction();
  await signTransaction(web3Tx);

  // Also works with Kit TransactionMessage
  const kitTx = await createKitTransaction(...);
  await signTransaction(kitTx);

  // Same method, different architectures!

  Error Handling Improvements

  import { HermisError, WalletErrorCode } from '@hermis/errors';

  try {
    await signTransaction(tx);
  } catch (error) {
    if (error instanceof HermisError) {
      console.log(error.code);        // e.g.,
  WalletErrorCode.SignTransactionError
      console.log(error.context);     // Rich context: wallet, transaction,
  operation
      console.log(error.getSolution()); // Actionable guidance
    }
  }

  Package Updates

  - @hermis/solana-headless-core: Dual architecture transaction handling, Kit
  signer utilities, enhanced error handling
  - @hermis/solana-headless-adapter-base: Kit integration layer, CAIP-2 chain
  utilities, dual architecture types
  - @hermis/solana-headless-react: Unified hooks API, Kit utility exports, dual
  architecture support
  - @hermis/wallet-standard-base: CAIP-2 compliant chain identifiers, improved
  wallet detection, better error handling
  - @hermis/errors (NEW): Comprehensive error handling system with rich context
  and developer guidance
  ```

## 1.1.2

### Patch Changes

- Updated the Live Demo URL to https://assylum-labs.github.io/hermis/ in the README.md

## 1.1.1

### Patch Changes

- 27cf9d0: Fixed

  - Wallet Detection Race Condition: Fixed issue where Backpack wallet would work on first visit but fail on subsequent visits due to asynchronous wallet standard events
  - React State Synchronization: Fixed subscription system where manually provided adapters (like Solflare) would disappear when standard wallets register dynamically
  - Deployment Build Process: Added proper build sequence to ensure all workspace packages are built before Vercel deployment

  Improved

  - Wallet Detection Architecture: Moved core wallet detection logic from React to vanilla JS libraries for better separation of concerns
  - Subscription System: Enhanced wallet adapter change notifications to properly merge existing and newly detected adapters
  - Error Handling: Added duplicate prevention and better logging for wallet detection debugging

## 1.1.0

### Minor Changes

- This updates adds support for auto wallet detection using the wallet standard. It also fix minor bugs on some features on the detected wallet adapter methods, with full backward compactibility.

## 1.0.8

### Patch Changes

- Upgraded image-size package from 1.2.0 tto 1.2.2 to fix Dependabot vulnerability detection

## 1.0.7

### Patch Changes

- Update Vite from ^6.2.3 to ^6.2.4 to fix vulnerability and also added Keypair as an export of the Headless-core package

## 1.0.6

### Patch Changes

- Handled a silent error on the mobile adapter with a patch, A full fix will require a PR to the @solana-mobile/wallet-adapter-mobile library

## 1.0.5

### Patch Changes

- Refactor the connect handler on the contextProvider to return the conected adapter instance, for reactitivy since react setState doesnt have the updated state immediatly in the handler

## 1.0.4

### Patch Changes

- change the dynamic imports in the ContextProvider.tsx to static import

## 1.0.3

### Patch Changes

- Refactor the Dynamic imports in the adapter-base package to use dependecy injection to avoid circular dependency

## 1.0.2

### Patch Changes

- Updated the base tsconfig to allow cration of \*.d.ts files

## 1.0.1

### Patch Changes

- Patch to update the packages version numbers from workspace:\* to the actual version numbers

## 1.0.0

### Major Changes

- Rebranded the namespace of the SDK from Agateh to Hermis, this will cause breaking changes across all SDKs, every user is advised to update the name space accordingly, however there isn't any breaking change in the functionality and implementation.

## 1.2.2

### Patch Changes

- Implement the functionalies of the React framework hooks and components, improved mehods from the core and base package, wrote unit tests for the base package, added a LICENSE file and finally updated the README of all package

## 1.2.1

### Patch Changes

- Updated README to flect what the package actually does

## 1.2.0

### Minor Changes

- For This Minor fix I added a demo forthe adapter base package hsowcasing how it would be used, I also wrote unit test for the dunctions of the core package

### Patch Changes

- 964194b: Updated the ReadMe and created where doesn't already exist

## 1.1.1-next.0

### Patch Changes

- Updated the ReadMe and created where doesn't already exist

## 1.1.0

### Minor Changes

- ac26b9b: In this Change, I added the basic funcntionalities of a wallet, I categorized it into wallets, transctions, connection, types and utils folder. I will add more robust function in the next minor release.

## 2.0.0

### Major Changes

- 75704fa: This is the Initial commit, setting up the monorepo, adding turbo, typescript and other devDependecies

### Patch Changes

- This patch has the first publishing to npm of the @solana/headless-core
