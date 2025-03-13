import { 
  Connection, 
  Keypair, 
  Transaction, 
  PublicKey,
} from '@solana/web3.js';
import { signTransaction, sendTransaction, signMessage } from '../../src/transaction';

jest.mock('@solana/web3.js', () => {
  const mockKeypairObj = {
    publicKey: {
      toString: () => 'mockPublicKey',
      toBase58: () => 'mockPublicKey',
      equals: (other: any) => 'mockPublicKey' === other?.toString()
    },
    secretKey: new Uint8Array([1, 2, 3, 4])
  };
  
  const MockKeypair = Object.assign(
    jest.fn().mockImplementation(() => mockKeypairObj),
    {
      generate: jest.fn().mockReturnValue(mockKeypairObj),
      fromSecretKey: jest.fn().mockImplementation((secretKey) => ({
        publicKey: {
          toString: () => 'mockPublicKey',
          toBase58: () => 'mockPublicKey',
          equals: (other: any) => 'mockPublicKey' === other?.toString()
        },
        secretKey
      }))
    }
  );

  return {
    Connection: jest.fn().mockImplementation(() => ({
      getLatestBlockhash: jest.fn().mockResolvedValue({ blockhash: 'mockedBlockhash' }),
      sendRawTransaction: jest.fn().mockResolvedValue('mockedSignature'),
    })),
    PublicKey: jest.fn().mockImplementation((key) => ({
      toString: () => key,
      toBase58: () => key,
      equals: (other: any) => key === other?.toString(),
    })),
    Transaction: jest.fn().mockImplementation(() => ({
      sign: jest.fn(),
      feePayer: undefined,
      recentBlockhash: undefined,
      serialize: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3, 4])),
    })),
    VersionedTransaction: {
      deserialize: jest.fn().mockReturnValue({}),
    },
    sendAndConfirmTransaction: jest.fn().mockResolvedValue('mockedSignature'),
    Keypair: MockKeypair
  };
});

describe('Transaction Module', () => {
  let mockTransaction: Transaction;
  let mockConnection: Connection;
  let mockKeypair: Keypair;
  let mockAdapter: any; 

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockTransaction = new Transaction();
    mockConnection = new Connection('https://api.testnet.solana.com');
    mockKeypair = require('@solana/web3.js').Keypair.generate();
    
    mockAdapter = {
      name: 'Mock Wallet' as any,
      url: 'https://mockwallet.io',
      icon: 'mock-icon-data',
      readyState: 4, // WalletReadyState.Installed
      publicKey: new PublicKey('mockAdapterPublicKey'),
      connecting: false,
      connected: true,
      supportedTransactionVersions: null,
      
      autoConnect: jest.fn().mockResolvedValue(undefined),
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      sendTransaction: jest.fn().mockResolvedValue('mockSignature'),
      
      on: jest.fn().mockReturnThis(),
      off: jest.fn().mockReturnThis(),
      once: jest.fn().mockReturnThis(),
      emit: jest.fn().mockReturnValue(true),
      removeListener: jest.fn().mockReturnThis(),
      removeAllListeners: jest.fn().mockReturnThis(),
      addListener: jest.fn().mockReturnThis(),
      listenerCount: jest.fn().mockReturnValue(0),
      listeners: jest.fn().mockReturnValue([]),
      eventNames: jest.fn().mockReturnValue([]),
      
    };
  });

  describe('signTransaction', () => {
    test('should sign a transaction with a Keypair', async () => {
      const signedTx = await signTransaction(mockTransaction, mockKeypair);
      
      expect(mockTransaction.sign).toHaveBeenCalledWith(mockKeypair);
      expect(signedTx).toBe(mockTransaction);
    });

    test('should sign a transaction with an Adapter', async () => {
      mockAdapter.signTransaction = jest.fn().mockResolvedValue(mockTransaction);
      
      const signedTx = await signTransaction(mockTransaction, mockAdapter);
      
      expect(mockAdapter.signTransaction).toHaveBeenCalledWith(mockTransaction);
      expect(signedTx).toBe(mockTransaction);
    });

    test('should throw if Adapter is not connected', async () => {
      const disconnectedAdapter = {
        ...mockAdapter,
        publicKey: null,
        connected: false,
        signTransaction: jest.fn(),
      };
      

      await expect(signTransaction(mockTransaction, disconnectedAdapter)).rejects.toThrow('Wallet not connected');
    });

    test('should throw if Adapter does not support signTransaction', async () => {
      const limitedAdapter = {
        ...mockAdapter,
        signTransaction: undefined,
      };
      
      await expect(signTransaction(mockTransaction, limitedAdapter)).rejects.toThrow('Wallet adapter does not support direct transaction signing');
    });
  });

  describe('sendTransaction', () => {
    test('should send a transaction with a Keypair', async () => {
      const sendAndConfirmTransactionMock = require('@solana/web3.js').sendAndConfirmTransaction;
      const signature = await sendTransaction(mockConnection, mockTransaction, mockKeypair);
      
      expect(mockConnection.getLatestBlockhash).toHaveBeenCalled();
      expect(sendAndConfirmTransactionMock).toHaveBeenCalled();
      expect(signature).toBe('mockedSignature');
    });

    test('should send a transaction with an Adapter', async () => {
      mockAdapter.sendTransaction = jest.fn().mockResolvedValue('adapterSignature');
      
      const signature = await sendTransaction(mockConnection, mockTransaction, mockAdapter);
      
      expect(mockAdapter.sendTransaction).toHaveBeenCalledWith(mockTransaction, mockConnection);
      expect(signature).toBe('adapterSignature');
    });

    test('should set recentBlockhash if not already set', async () => {
      mockAdapter.sendTransaction = jest.fn().mockResolvedValue('adapterSignature');
      mockTransaction.recentBlockhash = undefined;
      
      await sendTransaction(mockConnection, mockTransaction, mockAdapter);
      
      expect(mockConnection.getLatestBlockhash).toHaveBeenCalled();
      expect(mockTransaction.recentBlockhash).toBe('mockedBlockhash');
    });

    test('should set fee payer for adapter if not already set', async () => {
      mockAdapter.sendTransaction = jest.fn().mockResolvedValue('adapterSignature');
      mockTransaction.feePayer = undefined;
      
      await sendTransaction(mockConnection, mockTransaction, mockAdapter);
      
      expect(mockTransaction.feePayer).toBe(mockAdapter.publicKey);
    });

    test('should throw if adapter not connected', async () => {
      const disconnectedAdapter = {
        ...mockAdapter,
        publicKey: null,
        connected: false,
        sendTransaction: jest.fn(),
      };
      
      await expect(sendTransaction(mockConnection, mockTransaction, disconnectedAdapter)).rejects.toThrow('Wallet not connected');
    });

    test('should throw if adapter does not support sendTransaction', async () => {
      const limitedAdapter = {
        ...mockAdapter,
        sendTransaction: undefined,
      };
      
      await expect(sendTransaction(mockConnection, mockTransaction, limitedAdapter)).rejects.toThrow('Wallet does not support sending transactions');
    });
  });

  describe('signMessage', () => {
    test('should sign a message with an Adapter', async () => {
      mockAdapter.signMessage = jest.fn().mockImplementation(async (message) => {
        return new Uint8Array([5, 6, 7, 8]);
      });
      
      const message = 'Hello, Solana!';
      const signature = await signMessage(message, mockAdapter);
      
      expect(mockAdapter.signMessage).toHaveBeenCalled();
      expect(signature).toBeInstanceOf(Uint8Array);
      expect(signature).toEqual(new Uint8Array([5, 6, 7, 8]));
    });

    test('should accept a Uint8Array message', async () => {
      mockAdapter.signMessage = jest.fn().mockResolvedValue(new Uint8Array([5, 6, 7, 8]));
      
      const messageBytes = new Uint8Array([1, 2, 3, 4]);
      const signature = await signMessage(messageBytes, mockAdapter);
      
      expect(mockAdapter.signMessage).toHaveBeenCalledWith(messageBytes);
      expect(signature).toBeInstanceOf(Uint8Array);
    });

    test('should convert string messages to Uint8Array', async () => {
      mockAdapter.signMessage = jest.fn().mockImplementation(message => {
        if (!(message instanceof Uint8Array)) {
          throw new Error('Message is not a Uint8Array');
        }
        return Promise.resolve(new Uint8Array([5, 6, 7, 8]));
      });
      
      await signMessage('Test Message', mockAdapter);
      
      expect(mockAdapter.signMessage).toHaveBeenCalled();
    });

    test('should throw if wallet not connected', async () => {
      const disconnectedAdapter = {
        ...mockAdapter,
        publicKey: null,
        connected: false,
        signMessage: jest.fn(),
      };
      
      await expect(signMessage('test', disconnectedAdapter)).rejects.toThrow('Wallet not connected');
    });

    test('should throw if Keypair is used', async () => {
      await expect(signMessage('test', mockKeypair)).rejects.toThrow('Direct message signing with Keypair is not supported');
    });

    test('should throw if Adapter does not support message signing', async () => {
      const limitedAdapter = {
        ...mockAdapter,
        signMessage: undefined,
      };
      
      await expect(signMessage('test', limitedAdapter)).rejects.toThrow('Wallet adapter does not support message signing');
    });
  });
});