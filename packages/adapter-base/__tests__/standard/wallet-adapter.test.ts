// packages/adapter-base/__tests__/standard/wallet-adapter.test.ts

import { PublicKey, WalletReadyState } from '@agateh/solana-headless-core';
import { StandardWalletAdapter } from '../../src/standard/wallet-adapter';
import {
  StandardConnectMethod,
  StandardDisconnectMethod,
  StandardEventsMethod,
  SolanaSignTransactionMethod,
  SolanaSignMessageMethod
} from '../../src/standard/utils';

// Mock the necessary imports
jest.mock('@agateh/solana-headless-core', () => {
  return {
    WalletReadyState: {
      Installed: 'Installed',
    },
    PublicKey: jest.fn().mockImplementation((value) => ({
      toBase58: () => value,
      toString: () => value,
      equals: (other) => value === other?.toString()
    })),
    WalletError: class WalletError extends Error {
      constructor(message, error) {
        super(message);
        this.name = 'WalletError';
        this.error = error;
      }
    },
    EventEmitter: class EventEmitter {
      constructor() {
        this.events = {};
      }
      on(event, listener) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(listener);
        return this;
      }
      emit(event, ...args) {
        if (!this.events[event]) return false;
        this.events[event].forEach(listener => listener(...args));
        return true;
      }
      off(event, listener) {
        if (!this.events[event]) return this;
        this.events[event] = this.events[event].filter(l => l !== listener);
        return this;
      }
      // Add other EventEmitter methods as needed for tests
    }
  };
});

// Create mock wallet features
const createMockStandardWalletFeatures = () => {
  const mockConnect = jest.fn().mockResolvedValue({
    accounts: [
      {
        address: 'mockAddress',
        publicKey: new Uint8Array([1, 2, 3, 4]),
        features: ['solana:publicKey']
      }
    ]
  });

  const mockDisconnect = jest.fn().mockResolvedValue(undefined);

  const mockEventHandlers = {};
  const mockOn = jest.fn().mockImplementation((event, listener) => {
    mockEventHandlers[event] = listener;
    return () => {
      delete mockEventHandlers[event];
    };
  });

  const mockSignTransaction = jest.fn().mockImplementation(({ transaction }) => {
    return Promise.resolve({
      signedTransaction: transaction
    });
  });

  const mockSignMessage = jest.fn().mockImplementation(({ message }) => {
    return Promise.resolve({
      signature: new Uint8Array([5, 6, 7, 8])
    });
  });

  return {
    [StandardConnectMethod]: {
      connect: mockConnect
    },
    [StandardDisconnectMethod]: {
      disconnect: mockDisconnect
    },
    [StandardEventsMethod]: {
      on: mockOn
    },
    [SolanaSignTransactionMethod]: {
      signTransaction: mockSignTransaction,
      supportedTransactionVersions: [0]
    },
    [SolanaSignMessageMethod]: {
      signMessage: mockSignMessage
    },
    // Mock methods for testing
    _mockEventHandlers: mockEventHandlers,
    _triggerEvent: (event, data) => {
      if (mockEventHandlers[event]) {
        mockEventHandlers[event](data);
      }
    }
  };
};

describe('StandardWalletAdapter', () => {
  let mockStandardWallet;
  let mockWalletFeatures;
  let adapter;

  beforeEach(() => {
    mockWalletFeatures = createMockStandardWalletFeatures();
    
    mockStandardWallet = {
      name: 'Mock Standard Wallet',
      icon: 'data:image/svg+xml;base64,mock',
      website: 'https://mockwallet.com',
      features: mockWalletFeatures
    };
    
    adapter = new StandardWalletAdapter(mockStandardWallet);
  });

  describe('initialization', () => {
    test('should properly initialize with wallet data', () => {
      expect(adapter.name).toBe('Mock Standard Wallet');
      expect(adapter.url).toBe('https://mockwallet.com');
      expect(adapter.icon).toBe('data:image/svg+xml;base64,mock');
      expect(adapter.readyState).toBe(WalletReadyState.Installed);
      expect(adapter.publicKey).toBeNull();
      expect(adapter.connecting).toBe(false);
      expect(adapter.connected).toBe(false);
      expect(adapter.supportedTransactionVersions).toEqual(new Set([0]));
    });

    test('should throw if wallet is not adapter compatible', () => {
      const incompatibleWallet = {
        name: 'Incompatible Wallet',
        features: {}
      };

      expect(() => new StandardWalletAdapter(incompatibleWallet)).toThrow();
    });
  });

  describe('connect', () => {
    test('should connect to the wallet', async () => {
      await adapter.connect();

      expect(mockWalletFeatures[StandardConnectMethod].connect).toHaveBeenCalled();
      expect(adapter.connected).toBe(true);
      expect(adapter.publicKey).toBeDefined();
    });

    test('should emit connect event with public key', async () => {
      const connectSpy = jest.fn();
      adapter.on('connect', connectSpy);

      await adapter.connect();

      expect(connectSpy).toHaveBeenCalledWith(expect.any(Object));
    });

    test('should not connect if already connected', async () => {
      // First connect
      await adapter.connect();
      
      // Reset mock to check if it's called again
      mockWalletFeatures[StandardConnectMethod].connect.mockClear();
      
      // Try connecting again
      await adapter.connect();
      
      expect(mockWalletFeatures[StandardConnectMethod].connect).not.toHaveBeenCalled();
    });

    test('should throw and emit error if connect fails', async () => {
      const connectError = new Error('Connect failed');
      mockWalletFeatures[StandardConnectMethod].connect.mockRejectedValueOnce(connectError);
      
      const errorSpy = jest.fn();
      adapter.on('error', errorSpy);
      
      await expect(adapter.connect()).rejects.toThrow();
      expect(errorSpy).toHaveBeenCalled();
    });

    test('should throw if no Solana accounts found', async () => {
      // Mock connect response with no Solana accounts
      mockWalletFeatures[StandardConnectMethod].connect.mockResolvedValueOnce({
        accounts: [
          {
            address: 'mockAddress',
            publicKey: new Uint8Array([1, 2, 3, 4]),
            features: ['ethereum:publicKey'] // Not Solana
          }
        ]
      });
      
      await expect(adapter.connect()).rejects.toThrow('No Solana accounts found');
    });
  });

  describe('disconnect', () => {
    test('should disconnect from the wallet', async () => {
      // First connect
      await adapter.connect();
      
      await adapter.disconnect();
      
      expect(mockWalletFeatures[StandardDisconnectMethod].disconnect).toHaveBeenCalled();
      expect(adapter.connected).toBe(false);
      expect(adapter.publicKey).toBeNull();
    });

    test('should emit disconnect event', async () => {
      // First connect
      await adapter.connect();
      
      const disconnectSpy = jest.fn();
      adapter.on('disconnect', disconnectSpy);
      
      await adapter.disconnect();
      
      expect(disconnectSpy).toHaveBeenCalled();
    });
  });

  describe('account change handling', () => {
    test('should update public key when account changes', async () => {
      // First connect
      await adapter.connect();
      
      const initialPublicKey = adapter.publicKey;
      
      // Simulate account change event
      mockWalletFeatures._triggerEvent('change', {
        accounts: [
          {
            address: 'newAddress',
            publicKey: new Uint8Array([5, 6, 7, 8]),
            features: ['solana:publicKey']
          }
        ]
      });
      
      // Public key should be updated
      expect(adapter.publicKey).not.toEqual(initialPublicKey);
    });

    test('should emit connect event when account changes', async () => {
      // First connect
      await adapter.connect();
      
      const connectSpy = jest.fn();
      adapter.on('connect', connectSpy);
      
      // Simulate account change event
      mockWalletFeatures._triggerEvent('change', {
        accounts: [
          {
            address: 'newAddress',
            publicKey: new Uint8Array([5, 6, 7, 8]),
            features: ['solana:publicKey']
          }
        ]
      });
      
      expect(connectSpy).toHaveBeenCalled();
    });

    test('should emit disconnect when no solana accounts remain', async () => {
      // First connect
      await adapter.connect();
      
      const disconnectSpy = jest.fn();
      adapter.on('disconnect', disconnectSpy);
      
      // Simulate account change event with no Solana accounts
      mockWalletFeatures._triggerEvent('change', {
        accounts: []
      });
      
      expect(disconnectSpy).toHaveBeenCalled();
      expect(adapter.connected).toBe(false);
      expect(adapter.publicKey).toBeNull();
    });
  });

  describe('transaction operations', () => {
    test('should sign transaction', async () => {
      // First connect
      await adapter.connect();
      
      const mockTransaction = new Uint8Array([1, 2, 3, 4]);
      
      await adapter.signTransaction(mockTransaction);
      
      expect(mockWalletFeatures[SolanaSignTransactionMethod].signTransaction)
        .toHaveBeenCalledWith({ transaction: mockTransaction });
    });

    test('should sign message', async () => {
      // First connect
      await adapter.connect();
      
      const mockMessage = new Uint8Array([1, 2, 3, 4]);
      
      const signature = await adapter.signMessage(mockMessage);
      
      expect(mockWalletFeatures[SolanaSignMessageMethod].signMessage)
        .toHaveBeenCalledWith({ message: mockMessage });
      expect(signature).toEqual(new Uint8Array([5, 6, 7, 8]));
    });

    test('should throw if wallet not connected during transaction signing', async () => {
      const mockTransaction = new Uint8Array([1, 2, 3, 4]);
      
      await expect(adapter.signTransaction(mockTransaction)).rejects.toThrow('Wallet not connected');
    });
  });
});