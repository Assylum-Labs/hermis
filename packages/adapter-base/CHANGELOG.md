# @hermis/solana-headless-adapter-base

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

- Updated dependencies [27cf9d0]
  - @hermis/solana-headless-core@1.1.1

## 1.1.0

### Minor Changes

- This updates adds support for auto wallet detection using the wallet standard. It also fix minor bugs on some features on the detected wallet adapter methods, with full backward compactibility.

### Patch Changes

- Updated dependencies
  - @hermis/solana-headless-core@1.1.0

## 1.0.8

### Patch Changes

- Upgraded image-size package from 1.2.0 tto 1.2.2 to fix Dependabot vulnerability detection
- Updated dependencies
  - @hermis/solana-headless-core@1.0.8

## 1.0.7

### Patch Changes

- Update Vite from ^6.2.3 to ^6.2.4 to fix vulnerability and also added Keypair as an export of the Headless-core package
- Updated dependencies
  - @hermis/solana-headless-core@1.0.7

## 1.0.6

### Patch Changes

- Handled a silent error on the mobile adapter with a patch, A full fix will require a PR to the @solana-mobile/wallet-adapter-mobile library
- Updated dependencies
  - @hermis/solana-headless-core@1.0.6

## 1.0.5

### Patch Changes

- Refactor the connect handler on the contextProvider to return the conected adapter instance, for reactitivy since react setState doesnt have the updated state immediatly in the handler
- Updated dependencies
  - @hermis/solana-headless-core@1.0.5

## 1.0.4

### Patch Changes

- change the dynamic imports in the ContextProvider.tsx to static import
- Updated dependencies
  - @hermis/solana-headless-core@1.0.4

## 1.0.3

### Patch Changes

- Refactor the Dynamic imports in the adapter-base package to use dependecy injection to avoid circular dependency
- Updated dependencies
  - @hermis/solana-headless-core@1.0.3

## 1.0.2

### Patch Changes

- Updated the base tsconfig to allow cration of \*.d.ts files
- Updated dependencies
  - @hermis/solana-headless-core@1.0.2

## 1.0.1

### Patch Changes

- Patch to update the packages version numbers from workspace:\* to the actual version numbers
- Updated dependencies
  - @hermis/solana-headless-core@1.0.1

## 1.0.0

### Major Changes

- Rebranded the namespace of the SDK from Agateh to Hermis, this will cause breaking changes across all SDKs, every user is advised to update the name space accordingly, however there isn't any breaking change in the functionality and implementation.

### Patch Changes

- Updated dependencies
  - @hermis/solana-headless-core@1.0.0

## 1.1.3

### Patch Changes

- Implement the functionalies of the React framework hooks and components, improved mehods from the core and base package, wrote unit tests for the base package, added a LICENSE file and finally updated the README of all package
- Updated dependencies
  - @hermis/solana-headless-core@1.2.2

## 1.1.2

### Patch Changes

- Updated dependencies
  - @hermis/solana-headless-core@1.2.1

## 1.1.1

### Patch Changes

- Updated README for docs and then improved methods for environmental detection

## 1.1.0

### Minor Changes

- For This Minor fix I added a demo forthe adapter base package hsowcasing how it would be used, I also wrote unit test for the dunctions of the core package

### Patch Changes

- Updated dependencies [964194b]
- Updated dependencies
  - @hermis/solana-headless-core@1.2.0
