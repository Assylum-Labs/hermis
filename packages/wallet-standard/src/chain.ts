import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

/**
 * Wallet Standard chain identifiers for Solana networks.
 *
 * Format: `solana:<base58-encoded-genesis-hash>`.
 * @see https://github.com/wallet-standard/wallet-standard
 */
export const SOLANA_MAINNET_CHAIN = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' as const;
export const SOLANA_DEVNET_CHAIN = 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1' as const;
export const SOLANA_TESTNET_CHAIN = 'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z' as const;

/**
 * Convert a {@link WalletAdapterNetwork} into the canonical Wallet Standard
 * chain identifier expected by wallet features like `signAndSendTransaction`.
 */
export function networkToChainId(network: WalletAdapterNetwork): `solana:${string}` {
  switch (network) {
    case WalletAdapterNetwork.Mainnet:
      return SOLANA_MAINNET_CHAIN;
    case WalletAdapterNetwork.Devnet:
      return SOLANA_DEVNET_CHAIN;
    case WalletAdapterNetwork.Testnet:
      return SOLANA_TESTNET_CHAIN;
  }
}
