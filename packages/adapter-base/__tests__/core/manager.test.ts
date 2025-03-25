import { 
    Adapter, 
    WalletName, 
    WalletReadyState, 
    PublicKey,
    WalletError
  } from '@agateh/solana-headless-core';
  
  import { WalletAdapterManager } from '../../src/core/manager';
  
  // Mock the local storage utility
  jest.mock('../../src/utils/storage', () => ({
    createLocalStorageUtility: jest.fn().mockImplementation((key, defaultValue) => ({
      get: jest.fn().mockResolvedValue(defaultValue),
      set: jest.fn().mockResolvedValue(undefined)
    }))
  }));
  
  // Define a type for our mock adapter that includes the Jest mock methods
  type MockAdapter = Adapter & {
    connect: jest.Mock;
    disconnect: jest.Mock;
    autoConnect: jest.Mock;
    sendTransaction: jest.Mock;
    on: jest.Mock;
    off: jest.Mock;
    once: jest.Mock;
    emit: jest.Mock;
    removeListener: jest.Mock;
    removeAllListeners: jest.Mock;
    addListener: jest.Mock;
    listenerCount: jest.Mock;
    listeners: jest.Mock;
    eventNames: jest.Mock;
  };
  
  // Create mock adapter factory with proper typing
  function createMockAdapter(
    name: string, 
    readyState: WalletReadyState = WalletReadyState.Installed,
    connected: boolean = false
  ): MockAdapter {
    // Create the adapter object
    const adapter = {
      name: name as WalletName,
      url: `https://${name.toLowerCase()}.com`,
      icon: `${name.toLowerCase()}-icon`,
      readyState,
      publicKey: connected ? new PublicKey(`${name}PublicKey`) : null,
      connecting: false,
      connected,
      connect: jest.fn().mockImplementation(async () => {
        adapter.connected = true;
        adapter.publicKey = new PublicKey(`${name}PublicKey`);
      }),
      disconnect: jest.fn().mockImplementation(async () => {
        adapter.connected = false;
        adapter.publicKey = null;
      }),
      autoConnect: jest.fn().mockImplementation(async () => {
        adapter.connected = true;
        adapter.publicKey = new PublicKey(`${name}PublicKey`);
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
    } as MockAdapter;
    
    return adapter;
  }
  
  describe('WalletAdapterManager', () => {
    // Create a set of mock adapters
    const phantomAdapter = createMockAdapter('Phantom', WalletReadyState.Installed);
    const solflareAdapter = createMockAdapter('Solflare', WalletReadyState.Installed);
    const backpackAdapter = createMockAdapter('Backpack', WalletReadyState.Loadable);
    const unsupportedAdapter = createMockAdapter('Unsupported', WalletReadyState.Unsupported);
    
    const mockAdapters = [
      phantomAdapter,
      solflareAdapter,
      backpackAdapter,
      unsupportedAdapter
    ];
  
    let walletManager: WalletAdapterManager;
  
    beforeEach(() => {
      // Reset mock functions
      jest.clearAllMocks();
      
      // Reset adapter connected states
      mockAdapters.forEach(adapter => {
        adapter.connected = false;
        adapter.publicKey = null;
      });
  
      // Create a fresh wallet manager for each test
      walletManager = new WalletAdapterManager([...mockAdapters], 'test-wallet-key');
    });
  
    afterEach(() => {
      // Clean up resources
      walletManager.dispose();
    });
  
    describe('initialization', () => {
      test('should initialize with adapters and filter out unsupported ones', () => {
        expect(walletManager.getAdapters()).toHaveLength(3); // 4 - 1 (unsupported)
        expect(walletManager.getAdapters().find(a => a.name === 'Unsupported')).toBeUndefined();
      });
  
      test('should initialize with no selected adapter', () => {
        expect(walletManager.getSelectedAdapter()).toBeNull();
      });
    });
  
    describe('selectAdapter', () => {
      test('should select an adapter by name', () => {
        const selected = walletManager.selectAdapter('Phantom' as WalletName);
        
        expect(selected).toBe(phantomAdapter);
        expect(walletManager.getSelectedAdapter()).toBe(phantomAdapter);
      });
  
      test('should return null if adapter name not found', () => {
        const selected = walletManager.selectAdapter('NonExistent' as WalletName);
        
        expect(selected).toBeNull();
        expect(walletManager.getSelectedAdapter()).toBeNull();
      });
  
      test('should clear selected adapter when passing null', () => {
        walletManager.selectAdapter('Phantom' as WalletName);
        
        const result = walletManager.selectAdapter(null);
        
        expect(result).toBeNull();
        expect(walletManager.getSelectedAdapter()).toBeNull();
      });
  
      test('should emit adapterChange event', () => {
        // Spy on emit method
        const emitSpy = jest.spyOn(walletManager, 'emit');
        
        walletManager.selectAdapter('Phantom' as WalletName);
        
        expect(emitSpy).toHaveBeenCalledWith('adapterChange', phantomAdapter);
      });
  
      test('should disconnect previous adapter if connected', async () => {
        // Set up a connected adapter
        phantomAdapter.connected = true;
        phantomAdapter.publicKey = new PublicKey('PhantomPublicKey');
        
        walletManager.selectAdapter('Phantom' as WalletName);
        
        // Now select another adapter
        walletManager.selectAdapter('Solflare' as WalletName);
        
        expect(phantomAdapter.disconnect).toHaveBeenCalled();
      });
    });
  
    describe('connect', () => {
      test('should connect to the selected adapter', async () => {
        walletManager.selectAdapter('Phantom' as WalletName);
        
        const result = await walletManager.connect();
        
        expect(phantomAdapter.connect).toHaveBeenCalled();
        expect(result).toBe(phantomAdapter);
        expect(phantomAdapter.connected).toBe(true);
      });
  
      test('should do nothing if already connected', async () => {
        walletManager.selectAdapter('Phantom' as WalletName);
        
        // Connect once
        await walletManager.connect();
        
        // Reset mock to check if it's called again
        phantomAdapter.connect.mockClear();
        
        // Connect again
        await walletManager.connect();
        
        expect(phantomAdapter.connect).not.toHaveBeenCalled();
      });
  
      test('should return null if no adapter selected', async () => {
        const result = await walletManager.connect();
        
        expect(result).toBeNull();
      });
  
      test('should emit error event if connection fails', async () => {
        // Make connect throw an error
        phantomAdapter.connect.mockRejectedValueOnce(new Error('Connection failed') as never);
        
        // Spy on emit method
        const emitSpy = jest.spyOn(walletManager, 'emit');
        
        walletManager.selectAdapter('Phantom' as WalletName);
        
        // Connect should resolve to null due to error handling
        const result = await walletManager.connect();
        
        expect(result).toBeNull();
        expect(emitSpy).toHaveBeenCalledWith('error', expect.any(Error));
      });
    });
  
    describe('disconnect', () => {
      test('should disconnect from the selected adapter', async () => {
        walletManager.selectAdapter('Phantom' as WalletName);
        await walletManager.connect();
        
        await walletManager.disconnect();
        
        expect(phantomAdapter.disconnect).toHaveBeenCalled();
        expect(phantomAdapter.connected).toBe(false);
      });
  
      test('should clear selected adapter when disconnecting', async () => {
        walletManager.selectAdapter('Phantom' as WalletName);
        await walletManager.connect();
        
        await walletManager.disconnect();
        
        expect(walletManager.getSelectedAdapter()).toBeNull();
      });
  
      test('should do nothing if no adapter is connected', async () => {
        await walletManager.disconnect();
        
        // No errors should be thrown
        expect(true).toBe(true);
      });
  
      test('should emit error event if disconnection fails', async () => {
        // Make disconnect throw an error
        phantomAdapter.disconnect.mockRejectedValueOnce(new Error('Disconnection failed') as never);
        
        // Spy on emit method
        const emitSpy = jest.spyOn(walletManager, 'emit');
        
        walletManager.selectAdapter('Phantom' as WalletName);
        await walletManager.connect();
        
        await walletManager.disconnect();
        
        expect(emitSpy).toHaveBeenCalledWith('error', expect.any(Error));
      });
    });
  
    describe('autoConnect', () => {
      test('should auto-connect to the selected adapter', async () => {
        walletManager.selectAdapter('Phantom' as WalletName);
        
        const result = await walletManager.autoConnect();
        
        expect(phantomAdapter.autoConnect).toHaveBeenCalled();
        expect(result).toBe(phantomAdapter);
      });
  
      test('should return null if no adapter selected', async () => {
        const result = await walletManager.autoConnect();
        
        expect(result).toBeNull();
      });
  
      test('should emit error event if auto-connect fails', async () => {
        // Make autoConnect throw an error
        phantomAdapter.autoConnect.mockRejectedValueOnce(new Error('Auto-connect failed') as never);
        
        // Spy on emit method
        const emitSpy = jest.spyOn(walletManager, 'emit');
        
        walletManager.selectAdapter('Phantom' as WalletName);
        
        const result = await walletManager.autoConnect();
        
        expect(result).toBeNull();
        expect(emitSpy).toHaveBeenCalledWith('error', expect.any(Error));
      });
    });
  
    describe('event handling', () => {
      test('should set up event listeners for selected adapter', () => {
        walletManager.selectAdapter('Phantom' as WalletName);
        
        expect(phantomAdapter.on).toHaveBeenCalledWith('connect', expect.any(Function));
        expect(phantomAdapter.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
        expect(phantomAdapter.on).toHaveBeenCalledWith('error', expect.any(Function));
        expect(phantomAdapter.on).toHaveBeenCalledWith('readyStateChange', expect.any(Function));
      });
  
      test('should clean up event listeners when selecting a new adapter', () => {
        walletManager.selectAdapter('Phantom' as WalletName);
        walletManager.selectAdapter('Solflare' as WalletName);
        
        expect(phantomAdapter.off).toHaveBeenCalled();
      });
  
      test('should forward adapter events to manager listeners', async () => {
        const connectHandler = jest.fn();
        const disconnectHandler = jest.fn();
        
        walletManager.on('connect', connectHandler);
        walletManager.on('disconnect', disconnectHandler);
        
        walletManager.selectAdapter('Phantom' as WalletName);
        
        // Get the connect handler that was registered
        const onCalls = phantomAdapter.on.mock.calls;
        const connectCallEntry = onCalls.find(
          call => call[0] === 'connect'
        );
        
        if (connectCallEntry && connectCallEntry.length > 1) {
          // Manually trigger the connect event handler
          const connectCallback = connectCallEntry[1];
          connectCallback(new PublicKey('PhantomPublicKey'));
          
          expect(connectHandler).toHaveBeenCalledWith(expect.any(PublicKey));
        }
        
        // Get the disconnect handler that was registered
        const disconnectCallEntry = onCalls.find(
          call => call[0] === 'disconnect'
        );
        
        if (disconnectCallEntry && disconnectCallEntry.length > 1) {
          // Manually trigger the disconnect event handler
          const disconnectCallback = disconnectCallEntry[1];
          disconnectCallback();
          
          expect(disconnectHandler).toHaveBeenCalled();
        }
      });
    });
  
    describe('dispose', () => {
      test('should clean up all resources', () => {
        walletManager.selectAdapter('Phantom' as WalletName);
        
        walletManager.dispose();
        
        expect(phantomAdapter.off).toHaveBeenCalled();
      });
  
      test('should remove all event listeners', () => {
        const removeAllListenersSpy = jest.spyOn(walletManager, 'removeAllListeners');
        
        walletManager.dispose();
        
        expect(removeAllListenersSpy).toHaveBeenCalled();
      });
    });
  
    describe('transaction methods', () => {
      test('should sign transaction via adapter', async () => {
        // Mock implementation for signTransaction
        const mockSignTransaction = jest.fn().mockImplementation(tx => Promise.resolve(tx));
        
        // Mock the core import
        jest.mock('@agateh/solana-headless-core', () => ({
          ...jest.requireActual('@agateh/solana-headless-core'),
          signTransaction: mockSignTransaction
        }));
  
        walletManager.selectAdapter('Phantom' as WalletName);
        await walletManager.connect();
        
        const mockTransaction = { serialize: jest.fn() } as any;
        await walletManager.signTransaction(mockTransaction);
        
        // Verify signTransaction was called
        expect(mockSignTransaction).toHaveBeenCalledWith(mockTransaction, phantomAdapter);
      });
  
      test('should sign message via adapter', async () => {
        // Mock implementation for signMessage
        const mockSignMessage = jest.fn().mockImplementation(msg => Promise.resolve(new Uint8Array([1, 2, 3])));
        
        // Mock the core import
        jest.mock('@agateh/solana-headless-core', () => ({
          ...jest.requireActual('@agateh/solana-headless-core'),
          signMessage: mockSignMessage
        }));
  
        walletManager.selectAdapter('Phantom' as WalletName);
        await walletManager.connect();
        
        const message = "Test message";
        await walletManager.signMessage(message);
        
        // Verify signMessage was called
        expect(mockSignMessage).toHaveBeenCalledWith(message, phantomAdapter);
      });
    });
  });