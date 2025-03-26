const StandardConnectMethod = 'standard:connect';
const StandardEventsMethod = 'standard:events';
const SolanaSignTransactionMethod = 'solana:signTransaction';
const SolanaSignAndSendTransactionMethod = 'solana:signAndSendTransaction';

function isWalletAdapterCompatibleStandardWallet(wallet: any): boolean {
    if (!wallet || !wallet.features) return false;

    return (
        StandardConnectMethod in wallet.features &&
        StandardEventsMethod in wallet.features &&
        (SolanaSignAndSendTransactionMethod in wallet.features ||
            SolanaSignTransactionMethod in wallet.features)
    );
}

function createMockWallet(features: Record<string, any> = {}) {
    return {
        name: 'Mock Wallet',
        icon: 'mock-icon',
        version: '1.0.0',
        chains: ['mock-chain'],
        accounts: [],
        features
    };
}

describe('Standard Wallet Utilities', () => {
    describe('isWalletAdapterCompatibleStandardWallet', () => {
        test('should return false for null or undefined wallet', () => {
            expect(isWalletAdapterCompatibleStandardWallet(null)).toBe(false);
            expect(isWalletAdapterCompatibleStandardWallet(undefined)).toBe(false);
        });

        test('should return true for wallet with required features', () => {
            const mockWallet = createMockWallet({
                [StandardConnectMethod]: { connect: jest.fn() },
                [StandardEventsMethod]: { on: jest.fn() },
                [SolanaSignTransactionMethod]: { signTransaction: jest.fn() }
            });

            expect(isWalletAdapterCompatibleStandardWallet(mockWallet)).toBe(true);
        });

        test('should return true for wallet with signAndSendTransaction instead of signTransaction', () => {
            const mockWallet = createMockWallet({
                [StandardConnectMethod]: { connect: jest.fn() },
                [StandardEventsMethod]: { on: jest.fn() },
                [SolanaSignAndSendTransactionMethod]: { signAndSendTransaction: jest.fn() }
            });

            expect(isWalletAdapterCompatibleStandardWallet(mockWallet)).toBe(true);
        });

        test('should return false for wallet without connect feature', () => {
            const mockWallet = createMockWallet({
                [StandardEventsMethod]: { on: jest.fn() },
                [SolanaSignTransactionMethod]: { signTransaction: jest.fn() }
            });

            expect(isWalletAdapterCompatibleStandardWallet(mockWallet)).toBe(false);
        });

        test('should return false for wallet without events feature', () => {
            const mockWallet = createMockWallet({
                [StandardConnectMethod]: { connect: jest.fn() },
                [SolanaSignTransactionMethod]: { signTransaction: jest.fn() }
            });

            expect(isWalletAdapterCompatibleStandardWallet(mockWallet)).toBe(false);
        });

        test('should return false for wallet without transaction signing feature', () => {
            const mockWallet = createMockWallet({
                [StandardConnectMethod]: { connect: jest.fn() },
                [StandardEventsMethod]: { on: jest.fn() }
            });

            expect(isWalletAdapterCompatibleStandardWallet(mockWallet)).toBe(false);
        });
    });
});