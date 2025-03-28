import { Adapter, WalletName, WalletReadyState, PublicKey } from '@hermis/solana-headless-core';

/**
 * Creates a mock wallet adapter for testing
 */
export function createMockAdapter(
  name: string, 
  readyState: WalletReadyState = WalletReadyState.Installed,
  connected: boolean = false
): Adapter {
  return {
    name: name as WalletName,
    url: `https://${name.toLowerCase()}.com`,
    icon: `${name.toLowerCase()}-icon`,
    readyState,
    publicKey: connected ? new PublicKey(`${name}PublicKey`) : null,
    connecting: false,
    connected,
    connect: jest.fn().mockImplementation(async () => {
      (adapter as any).connected = true;
      (adapter as any).publicKey = new PublicKey(`${name}PublicKey`);
    }),
    disconnect: jest.fn().mockImplementation(async () => {
      (adapter as any).connected = false;
      (adapter as any).publicKey = null;
    }),
    autoConnect: jest.fn().mockImplementation(async () => {
      (adapter as any).connected = true;
      (adapter as any).publicKey = new PublicKey(`${name}PublicKey`);
    }),
    sendTransaction: jest.fn(),
    on: jest.fn().mockReturnThis(),
    off: jest.fn().mockReturnThis(),
    once: jest.fn().mockReturnThis(),
    emit: jest.fn().mockReturnValue(true),
    removeListener: jest.fn().mockReturnThis(),
    removeAllListeners: jest.fn().mockReturnThis(),
    addListener: jest.fn().mockReturnThis(),
    listenerCount: jest.fn().mockReturnValue(0),
    listeners: jest.fn().mockReturnValue([]),
    eventNames: jest.fn().mockReturnValue([])
  };
  
  // Return a reference so we can modify properties for tests
  let adapter = arguments[arguments.length - 1];
  return adapter;
}

/**
 * Creates a mock standard wallet for testing
 */
export function createMockStandardWallet(features = {}) {
  return {
    name: 'Mock Standard Wallet',
    icon: 'data:image/svg+xml;base64,mock',
    website: 'https://mockwallet.com',
    features
  };
}

/**
 * Creates mock standard wallet features
 */
export function createMockStandardWalletFeatures() {
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
    'standard:connect': {
      connect: mockConnect
    },
    'standard:disconnect': {
      disconnect: mockDisconnect
    },
    'standard:events': {
      on: mockOn
    },
    'solana:signTransaction': {
      signTransaction: mockSignTransaction,
      supportedTransactionVersions: [0]
    },
    'solana:signMessage': {
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
}