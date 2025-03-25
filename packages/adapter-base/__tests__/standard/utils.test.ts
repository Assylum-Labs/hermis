import { 
  isWalletAdapterCompatibleStandardWallet,
  StandardConnectMethod,
  StandardDisconnectMethod,
  StandardEventsMethod,
  SolanaSignTransactionMethod,
  SolanaSignAndSendTransactionMethod,
  SolanaSignMessageMethod
} from '../../src/standard/utils';

// Import Wallet type from wallet-standard/base
import { Wallet } from '@wallet-standard/base';

// Mock TypedStandardWallet implementation with proper Wallet properties
const createMockStandardWallet = (features: Record<string, any> = {}): Wallet => {
  return {
    name: 'Mock Standard Wallet',
    icon: 'data:image/svg+xml;base64,mock',
    version: '1.0.0',
    chains: ['solana:mainnet'],
    accounts: [],
    features: {
      ...features
    }
  };
};

describe('Standard Wallet Utilities', () => {
  describe('isWalletAdapterCompatibleStandardWallet', () => {
    test('should return false for null or undefined wallet', () => {
      expect(isWalletAdapterCompatibleStandardWallet(null as any)).toBe(false);
      expect(isWalletAdapterCompatibleStandardWallet(undefined as any)).toBe(false);
    });

    test('should return false for wallet without features', () => {
      const mockWalletNoFeatures: Wallet = {
        name: 'Invalid Wallet',
        icon: 'data:image/svg+xml;base64,mock',
        version: '1.0.0',
        chains: ['solana:mainnet'],
        accounts: [],
        features: {}
      };

      expect(isWalletAdapterCompatibleStandardWallet(mockWalletNoFeatures)).toBe(false);
    });

    test('should return true for wallet with required features', () => {
      const mockWallet = createMockStandardWallet({
        [StandardConnectMethod]: { connect: jest.fn() },
        [StandardEventsMethod]: { on: jest.fn() },
        [SolanaSignTransactionMethod]: { signTransaction: jest.fn() }
      });

      expect(isWalletAdapterCompatibleStandardWallet(mockWallet)).toBe(true);
    });

    test('should return true for wallet with signAndSendTransaction instead of signTransaction', () => {
      const mockWallet = createMockStandardWallet({
        [StandardConnectMethod]: { connect: jest.fn() },
        [StandardEventsMethod]: { on: jest.fn() },
        [SolanaSignAndSendTransactionMethod]: { signAndSendTransaction: jest.fn() }
      });

      expect(isWalletAdapterCompatibleStandardWallet(mockWallet)).toBe(true);
    });

    test('should return false for wallet without connect feature', () => {
      const mockWallet = createMockStandardWallet({
        [StandardEventsMethod]: { on: jest.fn() },
        [SolanaSignTransactionMethod]: { signTransaction: jest.fn() }
      });

      expect(isWalletAdapterCompatibleStandardWallet(mockWallet)).toBe(false);
    });

    test('should return false for wallet without events feature', () => {
      const mockWallet = createMockStandardWallet({
        [StandardConnectMethod]: { connect: jest.fn() },
        [SolanaSignTransactionMethod]: { signTransaction: jest.fn() }
      });

      expect(isWalletAdapterCompatibleStandardWallet(mockWallet)).toBe(false);
    });

    test('should return false for wallet without transaction signing feature', () => {
      const mockWallet = createMockStandardWallet({
        [StandardConnectMethod]: { connect: jest.fn() },
        [StandardEventsMethod]: { on: jest.fn() }
      });

      expect(isWalletAdapterCompatibleStandardWallet(mockWallet)).toBe(false);
    });
  });
});