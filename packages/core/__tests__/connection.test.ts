import { Connection, Commitment, ConnectionConfig } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { createConnection } from '../src/connection';

// Mock the Connection class
jest.mock('@solana/web3.js', () => {
  return {
    Connection: jest.fn().mockImplementation(() => ({
      /* Mocked Connection methods if needed */
    })),
    Commitment: {},
    ConnectionConfig: {},
  };
});

describe('Connection Module', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('createConnection', () => {
    test('should create a connection with a network enum', () => {
      // Arrange
      const network = WalletAdapterNetwork.Mainnet;
      
      // Act
      createConnection(network);
      
      // Assert
      expect(Connection).toHaveBeenCalledWith(
        'https://api.mainnet-beta.solana.com',
        expect.objectContaining({
          commitment: 'confirmed',
          confirmTransactionInitialTimeout: 60000,
        })
      );
    });

    test('should create a connection with a custom URL', () => {
      // Arrange
      const customUrl = 'https://my-custom-solana-rpc.com';
      
      // Act
      createConnection(customUrl);
      
      // Assert
      expect(Connection).toHaveBeenCalledWith(
        customUrl,
        expect.objectContaining({
          commitment: 'confirmed',
          confirmTransactionInitialTimeout: 60000,
        })
      );
    });

    test('should accept a custom commitment level', () => {
      // Arrange
      const network = WalletAdapterNetwork.Devnet;
      const commitment = 'processed' as Commitment;
      
      // Act
      createConnection(network, commitment);
      
      // Assert
      expect(Connection).toHaveBeenCalledWith(
        'https://api.devnet.solana.com',
        expect.objectContaining({
          commitment: 'processed',
          confirmTransactionInitialTimeout: 60000,
        })
      );
    });

    test('should accept a full connection config', () => {
      // Arrange
      const network = WalletAdapterNetwork.Testnet;
      const config: ConnectionConfig = {
        commitment: 'finalized',
        confirmTransactionInitialTimeout: 30000,
        disableRetryOnRateLimit: true,
      };
      
      // Act
      createConnection(network, config);
      
      // Assert
      expect(Connection).toHaveBeenCalledWith(
        'https://api.testnet.solana.com',
        expect.objectContaining({
          commitment: 'finalized',
          confirmTransactionInitialTimeout: 30000,
          disableRetryOnRateLimit: true,
        })
      );
    });
  });
});