# @hermis/wallet-standard-base

## 1.1.0

### Minor Changes

- b0d2b24: P1 security & performance hardening.

  ⚠️ **Behaviour changes worth checking before upgrading from 2.0.x:**

  - `getStandardWalletAdapters(adapters, endpoint, network)` and
    `createWalletConnectionManager(adapters, network, ...)` now require an
    explicit `network` argument — RPC-URL substring inference was removed.
  - Local-key `signMessage` now wraps the message with the Solana off-chain
    domain separator (`0xff` + `"solana offchain"` + header). Existing
    verifiers must apply the same wrapper. External wallet adapters
    (Phantom/Backpack/Solflare/any Standard Wallet) are unaffected.
  - The alternative 3-arg `sendTransaction(tx, wallet, options)` form is
    removed; use the 4-arg form with an explicit connection.

  See `docs/migration/v1-to-v2.mdx` for migration steps and verifier-side
  sample code.

  **Security / correctness**

  - Fix Kit transaction-sending signer to `bs58.decode` signature bytes
    (previously returned UTF-8 of the base58 string).
  - Apply the Solana off-chain message domain separator on local-key
    `signMessage` paths.
  - Require explicit `network` for cluster identification; remove URL
    substring inference.
  - Remove `sendTransaction` / `signAndSendTransaction` alt overload that
    silently routed to a hard-coded devnet connection.
  - Fix `useStandardWalletAdapters` / `HermisProvider` memoisation that
    missed adapter swaps with the same array length.
  - Strip debug `console.log` calls leaking unsigned transaction bytes
    from `StandardWalletAdapter`.

  **Performance**

  - Memoise `WalletContext.Provider` value to eliminate full-tree
    re-renders on `WalletProvider` re-renders.
  - Bound the `wallet-standard:app-ready` dispatch loop: 10×1s → 4-shot
    backoff (100ms, 300ms, 1s, 3s).
  - `useSolanaTransaction` polling: stop on `finalized`/`failed`,
    exponential backoff (1s → 30s).

### Patch Changes

- Updated dependencies [b0d2b24]
  - @hermis/solana-headless-core@2.1.0

## 1.0.0

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

### Patch Changes

- Updated dependencies [01dafed]
  - @hermis/solana-headless-core@2.0.0

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
