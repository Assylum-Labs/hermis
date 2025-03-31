# @solana/headless-core

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
