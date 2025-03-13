import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletManager } from '../../src/wallet/manager';

// Mock dependencies
jest.mock('@solana/web3.js', () => {
  return {
    Connection: jest.fn().mockImplementation(() => ({
      getBalance: jest.fn().mockResolvedValue(2.5 * 1000000000), // 2.5 SOL in lamports
    })),
    PublicKey: jest.fn().mockImplementation((key) => ({
      toString: () => key,
      equals: (other: any) => key === other.toString(),
    })),
    LAMPORTS_PER_SOL: 1000000000,
  };
});

jest.mock('../../src/connection/index.js', () => ({
  createConnection: jest.fn().mockImplementation(() => new (jest.requireMock('@solana/web3.js').Connection)()),
}));

describe('WalletManager', () => {
  let manager: WalletManager;
  let mockAdapter: any;

  beforeEach(() => {
    // Mock adapter with required functions
    mockAdapter = {
      publicKey: new PublicKey('mockPublicKey'),  
      connected: false,
      connect: jest.fn().mockResolvedValue(true),
      disconnect: jest.fn().mockResolvedValue(undefined),
    };

    // Initialize manager with default network
    manager = new WalletManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connect', () => {
    test('should connect to a wallet adapter', async () => {
      // Act
      const result = await manager.connect(mockAdapter);
      
      // Assert
      expect(mockAdapter.connect).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should not reconnect if already connected', async () => {
      // Arrange
      mockAdapter.connected = true;
      
      // Act
      const result = await manager.connect(mockAdapter);
      
      // Assert
      expect(mockAdapter.connect).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should handle connection errors', async () => {
      // Arrange
      mockAdapter.connect.mockRejectedValue(new Error('Connection failed'));
      
      // Act & Assert
      await expect(manager.connect(mockAdapter)).resolves.toBe(false);
    });
  });

  describe('getBalance', () => {
    test('should get the wallet balance in SOL', async () => {
      // Arrange
      await manager.connect(mockAdapter);
      
      // Act
      const balance = await manager.getBalance();
      
      // Assert
      expect(balance).toBe(2.5); // 2.5 SOL
    });

    test('should throw error if wallet not connected', async () => {
      // Act & Assert
      await expect(manager.getBalance()).rejects.toThrow('Wallet not connected');
    });
  });

  describe('getPublicKey', () => {
    test('should return the wallet public key', async () => {
      // Arrange
      await manager.connect(mockAdapter);
      
      // Act
      const publicKey = manager.getPublicKey();
      
      // Assert
      expect(publicKey.toString()).toBe('mockPublicKey');
    });

    test('should throw error if wallet not connected', () => {
      // Act & Assert
      expect(() => manager.getPublicKey()).toThrow('Wallet not connected');
    });
  });
});