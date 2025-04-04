# @solana/headless-session

## 1.0.8

### Patch Changes

- Upgraded image-size package from 1.2.0 tto 1.2.2 to fix Dependabot vulnerability detection
- Updated dependencies
  - @hermis/solana-headless-adapter-base@1.0.8
  - @hermis/solana-headless-core@1.0.8

## 1.0.7

### Patch Changes

- Update Vite from ^6.2.3 to ^6.2.4 to fix vulnerability and also added Keypair as an export of the Headless-core package
- Updated dependencies
  - @hermis/solana-headless-adapter-base@1.0.7
  - @hermis/solana-headless-core@1.0.7

## 1.0.6

### Patch Changes

- Handled a silent error on the mobile adapter with a patch, A full fix will require a PR to the @solana-mobile/wallet-adapter-mobile library
- Updated dependencies
  - @hermis/solana-headless-adapter-base@1.0.6
  - @hermis/solana-headless-core@1.0.6

## 1.0.5

### Patch Changes

- Refactor the connect handler on the contextProvider to return the conected adapter instance, for reactitivy since react setState doesnt have the updated state immediatly in the handler
- Updated dependencies
  - @hermis/solana-headless-adapter-base@1.0.5
  - @hermis/solana-headless-core@1.0.5

## 1.0.4

### Patch Changes

- change the dynamic imports in the ContextProvider.tsx to static import
- Updated dependencies
  - @hermis/solana-headless-adapter-base@1.0.4
  - @hermis/solana-headless-core@1.0.4

## 1.0.3

### Patch Changes

- Refactor the Dynamic imports in the adapter-base package to use dependecy injection to avoid circular dependency
- Updated dependencies
  - @hermis/solana-headless-adapter-base@1.0.3
  - @hermis/solana-headless-core@1.0.3

## 1.0.2

### Patch Changes

- Updated the base tsconfig to allow cration of \*.d.ts files
- Updated dependencies
  - @hermis/solana-headless-adapter-base@1.0.2
  - @hermis/solana-headless-core@1.0.2

## 1.0.1

### Patch Changes

- Patch to update the packages version numbers from workspace:\* to the actual version numbers
- Updated dependencies
  - @hermis/solana-headless-adapter-base@1.0.1
  - @hermis/solana-headless-core@1.0.1

## 1.0.0

### Major Changes

- Rebranded the namespace of the SDK from Agateh to Hermis, this will cause breaking changes across all SDKs, every user is advised to update the name space accordingly, however there isn't any breaking change in the functionality and implementation.

### Patch Changes

- Updated dependencies
  - @hermis/solana-headless-adapter-base@1.0.0
  - @hermis/solana-headless-core@1.0.0

## 1.1.0

### Minor Changes

- Implement the functionalies of the React framework hooks and components, improved mehods from the core and base package, wrote unit tests for the base package, added a LICENSE file and finally updated the README of all package

### Patch Changes

- Updated dependencies
  - @hermis/solana-headless-adapter-base@1.1.3
  - @hermis/solana-headless-core@1.2.2

## 1.0.3

### Patch Changes

- Updated dependencies
  - @hermis/solana-headless-core@1.2.1

## 1.0.2

### Patch Changes

- 964194b: Updated the ReadMe and created where doesn't already exist
- Updated dependencies [964194b]
- Updated dependencies
  - @hermis/solana-headless-core@1.2.0

## 1.0.2-next.0

### Patch Changes

- Updated the ReadMe and created where doesn't already exist
- Updated dependencies
  - @hermis/solana-headless-core@1.1.1-next.0

## 1.0.1

### Patch Changes

- Updated dependencies [ac26b9b]
  - @hermis/solana-headless-core@1.1.0

## 2.0.0

### Major Changes

- 75704fa: This is the Initial commit, setting up the monorepo, adding turbo, typescript and other devDependecies
