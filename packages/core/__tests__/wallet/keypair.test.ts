import { Keypair } from '@solana/web3.js';
import { createWallet, importWallet, exportWallet } from '../../src/wallet/keypair';
jest.mock('@solana/web3.js', () => {
  const mockKeypair = {
    publicKey: { toBase58: () => 'mockPublicKey' },
    secretKey: new Uint8Array([1, 2, 3, 4]),
  };
  
  return {
    Keypair: {
      generate: jest.fn().mockReturnValue(mockKeypair),
      fromSecretKey: jest.fn().mockImplementation((secretKey) => ({
        publicKey: { toBase58: () => 'importedPublicKey' },
        secretKey,
      })),
    },
  };
});

describe('Wallet Keypair Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createWallet', () => {
    test('should create a new wallet using Keypair.generate', () => {
      const wallet = createWallet();
      
      expect(Keypair.generate).toHaveBeenCalled();
      expect(wallet).toBeDefined();
      expect(wallet.publicKey.toBase58()).toBe('mockPublicKey');
    });
  });

  describe('importWallet', () => {
    test('should import a wallet from a secret key', () => {
      const secretKey = new Uint8Array([1, 2, 3, 4]);
      
      const wallet = importWallet(secretKey);
      
      expect(Keypair.fromSecretKey).toHaveBeenCalledWith(secretKey);
      expect(wallet).toBeDefined();
      expect(wallet.publicKey.toBase58()).toBe('importedPublicKey');
    });
  });

  describe('exportWallet', () => {
    test('should export a wallet to its secret key', () => {
      const mockKeypair = {
        secretKey: new Uint8Array([1, 2, 3, 4]),
      };
      
      const secretKey = exportWallet(mockKeypair as Keypair);
      
      expect(secretKey).toEqual(new Uint8Array([1, 2, 3, 4]));
    });
  });
});