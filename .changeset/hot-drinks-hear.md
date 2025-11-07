---
"@hermis/solana-headless-react": minor
---

  - @hermis/react-core: Network configuration changes
    - Introduced new TWalletAdapterNetwork enum type
  with standardized network values (mainnet-beta,
  devnet, testnet, localnet)
    - HermisProvider: endpoint and network props are
  now required (previously optional with defaults)
    - ContextProvider: network prop is now required
  and uses TWalletAdapterNetwork type
    - ConnectionProvider: Updated to use
  TWalletAdapterNetwork type instead of
  WalletAdapterNetwork
    - useConnection hook: network in
  ConnectionContextState is now required and typed as
  TWalletAdapterNetwork

  Migration Guide

  Users upgrading to this version must now explicitly
  provide endpoint and network props to
  HermisProvider:
  // Before (optional)
  <HermisProvider>

  // After (required)
  <HermisProvider 
    endpoint="https://api.mainnet-beta.solana.com"
    network={TWalletAdapterNetwork.Mainnet}
  >
