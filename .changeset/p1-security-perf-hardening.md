---
"@hermis/solana-headless-core": minor
"@hermis/solana-headless-adapter-base": minor
"@hermis/wallet-standard-base": minor
"@hermis/solana-headless-react": minor
---

P1 security & performance hardening.

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
