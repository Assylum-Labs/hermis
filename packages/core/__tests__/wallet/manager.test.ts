import { PublicKey } from '@solana/web3.js';
import { WalletManager } from '../../src/wallet/manager';


jest.mock('@solana/web3.js', () => {
  return {
    Connection: jest.fn().mockImplementation(() => ({
      getBalance: jest.fn().mockResolvedValue(2.5 * 1000000000),
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
    mockAdapter = {
      publicKey: new PublicKey('mockPublicKey'),  
      connected: false,
      connect: jest.fn().mockImplementation(() => {
        mockAdapter.connected = true;
        return Promise.resolve(true);
      }),
      disconnect: jest.fn().mockResolvedValue(undefined),
    };
    
    manager = new WalletManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connect', () => {
    test('should connect to a wallet adapter', async () => {
      
      const result = await manager.connect(mockAdapter);
      
      
      expect(mockAdapter.connect).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should not reconnect if already connected', async () => {
      
      mockAdapter.connected = true;
      
      const result = await manager.connect(mockAdapter);
      
      expect(mockAdapter.connect).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should handle connection errors', async () => {
      
      mockAdapter.connect.mockRejectedValue(new Error('Connection failed'));
      
      
      await expect(manager.connect(mockAdapter)).resolves.toBe(false);
    });
  });

  describe('getBalance', () => {
    test('should get the wallet balance in SOL', async () => {
      
      await manager.connect(mockAdapter);
      
      const balance = await manager.getBalance();
      
      expect(balance).toBe(2.5); 
    });

    test('should throw error if wallet not connected', async () => {
      
      await expect(manager.getBalance()).rejects.toThrow('Wallet not connected');
    });
  });

  describe('getPublicKey', () => {
    test('should return the wallet public key', async () => {
      
      await manager.connect(mockAdapter);
      
      const publicKey = manager.getPublicKey();
      
      expect(publicKey.toString()).toBe('mockPublicKey');
    });

    test('should throw error if wallet not connected', () => {
      
      expect(() => manager.getPublicKey()).toThrow('Wallet not connected');
    });
  });
});