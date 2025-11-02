# @hermis/wallet-standard-base

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

### Patch Changes

- Updated dependencies
  - @hermis/solana-headless-core@2.0.0-beta.0
