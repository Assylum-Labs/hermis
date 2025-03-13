import { Connection, Commitment, ConnectionConfig } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { createConnection } from '../src/connection';
jest.mock('@solana/web3.js', () => {
  return {
    Connection: jest.fn().mockImplementation(() => ({
    })),
    Commitment: {},
    ConnectionConfig: {},
  };
});

describe('Connection Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createConnection', () => {
    test('should create a connection with a network enum', () => {
      const network = WalletAdapterNetwork.Mainnet;
      
      createConnection(network);
      
      expect(Connection).toHaveBeenCalledWith(
        'https://api.mainnet-beta.solana.com',
        expect.objectContaining({
          commitment: 'confirmed',
          confirmTransactionInitialTimeout: 60000,
        })
      );
    });

    test('should create a connection with a custom URL', () => {
      const customUrl = 'https://my-custom-solana-rpc.com';
      
      createConnection(customUrl);
      
      expect(Connection).toHaveBeenCalledWith(
        customUrl,
        expect.objectContaining({
          commitment: 'confirmed',
          confirmTransactionInitialTimeout: 60000,
        })
      );
    });

    test('should accept a custom commitment level', () => {
      const network = WalletAdapterNetwork.Devnet;
      const commitment = 'processed' as Commitment;
      
      createConnection(network, commitment);
      
      expect(Connection).toHaveBeenCalledWith(
        'https://api.devnet.solana.com',
        expect.objectContaining({
          commitment: 'processed',
          confirmTransactionInitialTimeout: 60000,
        })
      );
    });

    test('should accept a full connection config', () => {
      const network = WalletAdapterNetwork.Testnet;
      const config: ConnectionConfig = {
        commitment: 'finalized',
        confirmTransactionInitialTimeout: 30000,
        disableRetryOnRateLimit: true,
      };
      
      createConnection(network, config);
      
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