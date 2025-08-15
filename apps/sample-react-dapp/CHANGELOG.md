# sample-react-dapp

## 0.0.13

### Patch Changes

- Updated dependencies
  - @hermis/solana-headless-react@1.1.2
  - @hermis/solana-headless-adapter-base@1.1.2
  - @hermis/solana-headless-core@1.1.2

## 0.0.12

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
  - @hermis/solana-headless-adapter-base@1.1.1
  - @hermis/solana-headless-core@1.1.1
  - @hermis/solana-headless-react@1.1.1

## 0.0.11

### Patch Changes

- Updated dependencies
  - @hermis/solana-headless-adapter-base@1.1.0
  - @hermis/solana-headless-core@1.1.0
  - @hermis/solana-headless-react@1.0.0

## 0.0.10

### Patch Changes

- Updated dependencies
  - @hermis/solana-headless-adapter-base@1.0.8
  - @hermis/solana-headless-core@1.0.8
  - @hermis/solana-headless-react@1.0.8

## 0.0.9

### Patch Changes

- Update Vite from ^6.2.3 to ^6.2.4 to fix vulnerability and also added Keypair as an export of the Headless-core package
- Updated dependencies
  - @hermis/solana-headless-adapter-base@1.0.7
  - @hermis/solana-headless-core@1.0.7
  - @hermis/solana-headless-react@1.0.7

## 0.0.8

### Patch Changes

- Updated dependencies
  - @hermis/solana-headless-adapter-base@1.0.6
  - @hermis/solana-headless-core@1.0.6
  - @hermis/solana-headless-react@1.0.6

## 0.0.7

### Patch Changes

- Updated dependencies
  - @hermis/solana-headless-adapter-base@1.0.5
  - @hermis/solana-headless-react@1.0.5
  - @hermis/solana-headless-core@1.0.5

## 0.0.6

### Patch Changes

- Updated dependencies
  - @hermis/solana-headless-adapter-base@1.0.2
  - @hermis/solana-headless-react@1.0.2
  - @hermis/solana-headless-core@1.0.2

## 0.0.5

### Patch Changes

- Updated dependencies
  - @hermis/solana-headless-adapter-base@1.0.0
  - @hermis/solana-headless-core@1.0.0
  - @hermis/solana-headless-react@1.0.0

## 0.0.4

### Patch Changes

- Updated dependencies
  - @hermis/solana-headless-react@1.1.0
  - @hermis/solana-headless-adapter-base@1.1.3
  - @hermis/solana-headless-core@1.2.2

## 0.0.3

### Patch Changes

- @hermis/solana-headless-react@1.0.3

## 0.0.2

### Patch Changes

- Updated dependencies [964194b]
  - @hermis/solana-headless-react@1.0.2

## 0.0.2-next.0

### Patch Changes

- Updated dependencies
  - @hermis/solana-headless-react@1.0.2-next.0

## 0.0.1

### Patch Changes

- @hermis/solana-headless-react@1.0.1
