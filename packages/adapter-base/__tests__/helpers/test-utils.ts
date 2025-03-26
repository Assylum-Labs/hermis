
/**
 * Create a mock standard wallet for testing
 */
export function createMockStandardWallet(features = {}) {
    return {
        name: 'Mock Standard Wallet',
        icon: 'data:image/svg+xml;base64,mock',
        version: '1.0.0',
        chains: ['solana:mainnet'],
        accounts: [],
        features
    };
}

/**
 * Simple implementation of the isWalletAdapterCompatibleStandardWallet function
 * for tests when the real one can't be imported
 */
export function mockIsWalletAdapterCompatible(wallet: any): boolean {
    if (!wallet || !wallet.features) return false;

    return (
        'standard:connect' in wallet.features &&
        'standard:events' in wallet.features &&
        ('solana:signAndSendTransaction' in wallet.features ||
            'solana:signTransaction' in wallet.features)
    );
}

/**
 * Mocks for standard method names
 */
export const MockStandardMethods = {
    StandardConnectMethod: 'standard:connect',
    StandardDisconnectMethod: 'standard:disconnect',
    StandardEventsMethod: 'standard:events',
    SolanaSignTransactionMethod: 'solana:signTransaction',
    SolanaSignAndSendTransactionMethod: 'solana:signAndSendTransaction',
    SolanaSignMessageMethod: 'solana:signMessage',
    SolanaSignInMethod: 'solana:signIn'
};