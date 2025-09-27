// Dual architecture types that can be shared between packages
// These types support both legacy and kit architectures

import { Keypair } from '@solana/web3.js';
import { Adapter } from '@solana/wallet-adapter-base';

// Forward declare TypedStandardWallet to avoid circular dependency
export interface TypedStandardWalletDual {
  name: string;
  features: any;
  accounts: ReadonlyArray<any>;
  [key: string]: any;
}

// Types for dual architecture support
export type LegacyWallet = Keypair | Adapter | TypedStandardWalletDual;
export type KitWallet = CryptoKeyPair | string | object; // CryptoKeyPair, Address (string), or MessagePartialSigner (object)
export type DualWallet = LegacyWallet | KitWallet;

