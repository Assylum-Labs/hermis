import { StandardConnectMethod, StandardDisconnectMethod, StandardEventsMethod, SolanaSignAndSendTransactionMethod, SolanaSignTransactionMethod, SolanaSignMessageMethod, SolanaSignInMethod } from './types.js';
/**
 * Check if a wallet implements the Wallet Standard interface and has required features
 * @param wallet The wallet to check
 * @returns True if the wallet is wallet standard compatible
 */
export function isWalletAdapterCompatibleStandardWallet(wallet) {
    if (!wallet || !wallet.features)
        return false;
    return (
    // Must have standard:connect feature
    StandardConnectMethod in wallet.features &&
        // Must have standard:events feature
        StandardEventsMethod in wallet.features &&
        // Must have either solana:signAndSendTransaction OR solana:signTransaction feature
        (SolanaSignAndSendTransactionMethod in wallet.features ||
            SolanaSignTransactionMethod in wallet.features));
}
/**
 * Get wallet adapters for all available standard wallets
 * @param existingAdapters Existing (non-standard) adapters to include in result
 * @returns Array of all adapters including standard wallet adapters
 */
export function getStandardWalletAdapters(existingAdapters = []) {
    // Skip if not in browser environment
    if (typeof window === 'undefined' || !window.navigator) {
        return existingAdapters;
    }
    try {
        // Check if wallet standard is available in window.navigator
        // The wallets property is injected by wallet standard
        const walletStandard = window.navigator.wallets;
        if (!walletStandard) {
            return existingAdapters;
        }
        // Get all registered wallets
        const standardWallets = walletStandard.get();
        // Import here to avoid circular dependency
        const { StandardWalletAdapter } = require('./wallet-adapter');
        // Filter for compatible wallets and create adapters
        const standardAdapters = standardWallets
            .filter(isWalletAdapterCompatibleStandardWallet)
            .map((wallet) => {
            try {
                return new StandardWalletAdapter(wallet);
            }
            catch (error) {
                console.error('Error creating adapter for wallet:', wallet.name, error);
                return null;
            }
        })
            .filter(Boolean);
        // Return combined adapters, filtering out any duplicates
        // (where standard adapter has same name as an existing adapter)
        const existingNames = new Set(existingAdapters.map(a => a.name));
        const uniqueStandardAdapters = standardAdapters.filter(a => !existingNames.has(a.name));
        return [...existingAdapters, ...uniqueStandardAdapters];
    }
    catch (error) {
        console.error('Error getting standard wallets:', error);
        return existingAdapters;
    }
}
// Re-export constants
export { StandardConnectMethod, StandardDisconnectMethod, StandardEventsMethod, SolanaSignAndSendTransactionMethod, SolanaSignTransactionMethod, SolanaSignMessageMethod, SolanaSignInMethod };
