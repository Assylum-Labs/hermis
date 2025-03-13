// packages/core/__tests__/transaction/index.test.ts

import { 
  Connection, 
  Keypair, 
  Transaction, 
  PublicKey,
  VersionedTransaction
} from '@solana/web3.js';
import { signTransaction, sendTransaction, signMessage } from '../../src/transaction';

// Mock web3.js
jest.mock('@solana/web3.js', () => {
  // Create a mockKeypair object with the methods we need
  const mockKeypairObj = {
    publicKey: {
      toString: () => 'mockPublicKey',
      toBase58: () => 'mockPublicKey',
      equals: (other: any) => 'mockPublicKey' === other?.toString()
    },
    secretKey: new Uint8Array([1, 2, 3, 4])
  };
  
  // Create Keypair with static methods using Object.assign
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
      deserialize: jest.fn().mockReturnValue({ /* mocked versioned transaction */ }),
    },
    sendAndConfirmTransaction: jest.fn().mockResolvedValue('mockedSignature'),
    Keypair: MockKeypair
  };
});

describe('Transaction Module', () => {
  let mockTransaction: Transaction;
  let mockConnection: Connection;
  let mockKeypair: Keypair;
  let mockAdapter: any; // Using any for the adapter as it needs to be flexible for different tests

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock objects
    mockTransaction = new Transaction();
    mockConnection = new Connection('https://api.testnet.solana.com');
    // Generate a mock keypair using the mocked Keypair class
    mockKeypair = require('@solana/web3.js').Keypair.generate();
    
    // Create a fully compliant mock adapter that will pass type checks
    mockAdapter = {
      // Required WalletAdapterProps properties
      name: 'Mock Wallet' as any, // WalletName is a branded type, using 'as any' to bypass
      url: 'https://mockwallet.io',
      icon: 'mock-icon-data',
      readyState: 4, // WalletReadyState.Installed
      publicKey: new PublicKey('mockAdapterPublicKey'),
      connecting: false,
      connected: true,
      supportedTransactionVersions: null,
      
      // Required methods
      autoConnect: jest.fn().mockResolvedValue(undefined),
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      sendTransaction: jest.fn().mockResolvedValue('mockSignature'),
      
      // EventEmitter methods
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
      
      // Will add other methods like signTransaction in specific tests
    };
  });

  describe('signTransaction', () => {
    test('should sign a transaction with a Keypair', async () => {
      // Act
      const signedTx = await signTransaction(mockTransaction, mockKeypair);
      
      // Assert
      expect(mockTransaction.sign).toHaveBeenCalledWith(mockKeypair);
      expect(signedTx).toBe(mockTransaction);
    });

    test('should sign a transaction with an Adapter', async () => {
      // Add required method to our mock adapter
      mockAdapter.signTransaction = jest.fn().mockResolvedValue(mockTransaction);
      
      // Act
      const signedTx = await signTransaction(mockTransaction, mockAdapter);
      
      // Assert
      expect(mockAdapter.signTransaction).toHaveBeenCalledWith(mockTransaction);
      expect(signedTx).toBe(mockTransaction);
    });

    test('should throw if Adapter is not connected', async () => {
      // Setup adapter in disconnected state
      const disconnectedAdapter = {
        // Base properties from mockAdapter
        ...mockAdapter,
        // Override these specific properties
        publicKey: null,
        connected: false,
        signTransaction: jest.fn(),
      };
      
      // Act & Assert
      await expect(signTransaction(mockTransaction, disconnectedAdapter)).rejects.toThrow('Wallet not connected');
    });

    test('should throw if Adapter does not support signTransaction', async () => {
      // Create adapter without signTransaction method
      const limitedAdapter = {
        // Clone the base mockAdapter
        ...mockAdapter,
        // Ensure no signTransaction method exists
        signTransaction: undefined,
      };
      
      // Act & Assert
      await expect(signTransaction(mockTransaction, limitedAdapter)).rejects.toThrow('Wallet adapter does not support direct transaction signing');
    });
  });

  describe('sendTransaction', () => {
    test('should send a transaction with a Keypair', async () => {
      const sendAndConfirmTransactionMock = require('@solana/web3.js').sendAndConfirmTransaction;
      // Act
      const signature = await sendTransaction(mockConnection, mockTransaction, mockKeypair);
      
      // Assert
      expect(mockConnection.getLatestBlockhash).toHaveBeenCalled();
      expect(sendAndConfirmTransactionMock).toHaveBeenCalled();
      // expect(mockTransaction.sign).toHaveBeenCalled();
      expect(signature).toBe('mockedSignature');
    });

    test('should send a transaction with an Adapter', async () => {
      // Add required method
      mockAdapter.sendTransaction = jest.fn().mockResolvedValue('adapterSignature');
      
      // Act
      const signature = await sendTransaction(mockConnection, mockTransaction, mockAdapter);
      
      // Assert
      expect(mockAdapter.sendTransaction).toHaveBeenCalledWith(mockTransaction, mockConnection);
      expect(signature).toBe('adapterSignature');
    });

    test('should set recentBlockhash if not already set', async () => {
      // Add required method
      mockAdapter.sendTransaction = jest.fn().mockResolvedValue('adapterSignature');
      // Ensure recentBlockhash is null
      mockTransaction.recentBlockhash = undefined;
      
      // Act
      await sendTransaction(mockConnection, mockTransaction, mockAdapter);
      
      // Assert
      expect(mockConnection.getLatestBlockhash).toHaveBeenCalled();
      expect(mockTransaction.recentBlockhash).toBe('mockedBlockhash');
    });

    test('should set fee payer for adapter if not already set', async () => {
      // Add required method
      mockAdapter.sendTransaction = jest.fn().mockResolvedValue('adapterSignature');
      // Ensure feePayer is null
      mockTransaction.feePayer = undefined;
      
      // Act
      await sendTransaction(mockConnection, mockTransaction, mockAdapter);
      
      // Assert
      expect(mockTransaction.feePayer).toBe(mockAdapter.publicKey);
    });

    test('should throw if adapter not connected', async () => {
      // Setup adapter in disconnected state
      const disconnectedAdapter = {
        // Base properties from mockAdapter
        ...mockAdapter,
        // Override these specific properties
        publicKey: null,
        connected: false,
        sendTransaction: jest.fn(),
      };
      
      // Act & Assert
      await expect(sendTransaction(mockConnection, mockTransaction, disconnectedAdapter)).rejects.toThrow('Wallet not connected');
    });

    test('should throw if adapter does not support sendTransaction', async () => {
      // Create adapter without sendTransaction method
      const limitedAdapter = {
        // Clone the base mockAdapter
        ...mockAdapter,
        // Override sendTransaction to be undefined
        sendTransaction: undefined,
      };
      
      // Act & Assert
      await expect(sendTransaction(mockConnection, mockTransaction, limitedAdapter)).rejects.toThrow('Wallet does not support sending transactions');
    });
  });

  describe('signMessage', () => {
    test('should sign a message with an Adapter', async () => {
      // Add required signMessage method
      mockAdapter.signMessage = jest.fn().mockImplementation(async (message) => {
        // Simple mock implementation that returns a fixed signature
        return new Uint8Array([5, 6, 7, 8]);
      });
      
      // Act
      const message = 'Hello, Solana!';
      const signature = await signMessage(message, mockAdapter);
      
      // Assert
      expect(mockAdapter.signMessage).toHaveBeenCalled();
      expect(signature).toBeInstanceOf(Uint8Array);
      expect(signature).toEqual(new Uint8Array([5, 6, 7, 8]));
    });

    test('should accept a Uint8Array message', async () => {
      // Add required signMessage method
      mockAdapter.signMessage = jest.fn().mockResolvedValue(new Uint8Array([5, 6, 7, 8]));
      
      // Act
      const messageBytes = new Uint8Array([1, 2, 3, 4]);
      const signature = await signMessage(messageBytes, mockAdapter);
      
      // Assert
      expect(mockAdapter.signMessage).toHaveBeenCalledWith(messageBytes);
      expect(signature).toBeInstanceOf(Uint8Array);
    });

    test('should convert string messages to Uint8Array', async () => {
      // Add required signMessage method with implementation that verifies argument
      mockAdapter.signMessage = jest.fn().mockImplementation(message => {
        // Verify message is a Uint8Array
        if (!(message instanceof Uint8Array)) {
          throw new Error('Message is not a Uint8Array');
        }
        return Promise.resolve(new Uint8Array([5, 6, 7, 8]));
      });
      
      // Act
      await signMessage('Test Message', mockAdapter);
      
      // Assert
      expect(mockAdapter.signMessage).toHaveBeenCalled();
      // If no error is thrown, then conversion to Uint8Array worked
    });

    test('should throw if wallet not connected', async () => {
      // Setup adapter in disconnected state
      const disconnectedAdapter = {
        // Base properties from mockAdapter
        ...mockAdapter,
        // Override these specific properties
        publicKey: null,
        connected: false,
        signMessage: jest.fn(),
      };
      
      // Act & Assert
      await expect(signMessage('test', disconnectedAdapter)).rejects.toThrow('Wallet not connected');
    });

    test('should throw if Keypair is used', async () => {
      // Act & Assert
      await expect(signMessage('test', mockKeypair)).rejects.toThrow('Direct message signing with Keypair is not supported');
    });

    test('should throw if Adapter does not support message signing', async () => {
      // Create adapter without signMessage method
      const limitedAdapter = {
        // Clone the base mockAdapter
        ...mockAdapter,
        // Override signMessage to be undefined
        signMessage: undefined,
      };
      
      // Act & Assert
      await expect(signMessage('test', limitedAdapter)).rejects.toThrow('Wallet adapter does not support message signing');
    });
  });
});