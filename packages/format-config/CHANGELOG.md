# @solana/headless-format-config

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

## 2.0.0

### Major Changes

- 75704fa: This is the Initial commit, setting up the monorepo, adding turbo, typescript and other devDependecies
