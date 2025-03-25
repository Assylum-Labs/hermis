import { 
    Adapter, 
    WalletName, 
    WalletReadyState, 
    PublicKey,
    WalletError
  } from '@agateh/solana-headless-core';
  import { 
    initAdapters, 
    selectAdapter, 
    getSelectedAdapter, 
    getWalletAdapters, 
    getAdaptersByReadyState, 
    sortWalletAdapters,
    addWalletAdapterEventListeners
  } from '../../src/core/adapters';
  
  // Mock the dependencies
  jest.mock('@agateh/solana-headless-core', () => {
    return {
      WalletReadyState: {
        Installed: 'Installed',
        Loadable: 'Loadable',
        NotDetected: 'NotDetected',
        Unsupported: 'Unsupported'
      },
      PublicKey: jest.fn().mockImplementation((value) => ({
        toBase58: () => value,
        toString: () => value,
        equals: (other) => value === other?.toString()
      }))
    };
  });
  
  describe('Adapter Functions', () => {
    // Create mock adapters for testing
    const createMockAdapter = (
      name: string, 
      readyState: WalletReadyState,
      connected: boolean = false
    ): Adapter => {
      return {
        name: name as WalletName,
        url: `https://${name.toLowerCase()}.com`,
        icon: `${name.toLowerCase()}-icon`,
        readyState: readyState,
        publicKey: connected ? new PublicKey(`${name}PublicKey`) : null,
        connecting: false,
        connected,
        autoConnect: async() => {},
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        sendTransaction: jest.fn(),
        on: jest.fn().mockReturnThis(),
        off: jest.fn().mockReturnThis(),
        once: jest.fn().mockReturnThis(),
        emit: jest.fn(),
        removeListener: jest.fn().mockReturnThis(),
        removeAllListeners: jest.fn().mockReturnThis(),
        addListener: jest.fn().mockReturnThis(),
        listenerCount: jest.fn().mockReturnValue(0),
        listeners: jest.fn().mockReturnValue([]),
        eventNames: jest.fn().mockReturnValue([])
      };
    };
  
    // Create a set of mock adapters with different ready states
    const phantomAdapter = createMockAdapter('Phantom', WalletReadyState.Installed);
    const solflareAdapter = createMockAdapter('Solflare', WalletReadyState.Installed);
    const backpackAdapter = createMockAdapter('Backpack', WalletReadyState.Loadable);
    const trustAdapter = createMockAdapter('Trust', WalletReadyState.NotDetected);
    const unsupportedAdapter = createMockAdapter('Unsupported', WalletReadyState.Unsupported);
  
    const mockAdapters = [
      phantomAdapter,
      solflareAdapter,
      backpackAdapter,
      trustAdapter,
      unsupportedAdapter
    ];
  
    beforeEach(() => {
      // Clear all mocks before each test
      jest.clearAllMocks();
      // Reset adapters state by initializing with an empty array
      initAdapters([]);
    });
  
    describe('initAdapters', () => {
      test('should initialize adapters and filter out unsupported ones', () => {
        initAdapters(mockAdapters);
  
        // Get all adapters and verify unsupported ones are filtered out
        const adapters = getWalletAdapters();
        expect(adapters).toHaveLength(4); // 5 - 1 (unsupported)
        expect(adapters.find(a => a.name === 'Unsupported')).toBeUndefined();
      });
    });
  
    describe('selectAdapter', () => {
      test('should select an adapter by name', () => {
        initAdapters(mockAdapters);
  
        const selected = selectAdapter('Phantom' as WalletName);
        expect(selected).toBe(phantomAdapter);
        expect(getSelectedAdapter()).toBe(phantomAdapter);
      });
  
      test('should return null if adapter name not found', () => {
        initAdapters(mockAdapters);
  
        const selected = selectAdapter('NonExistent' as WalletName);
        expect(selected).toBeNull();
      });
  
      test('should clear selected adapter when passing null', () => {
        initAdapters(mockAdapters);
        selectAdapter('Phantom' as WalletName);
        
        const result = selectAdapter(null);
        expect(result).toBeNull();
        expect(getSelectedAdapter()).toBeNull();
      });
    });
  
    describe('getWalletAdapters', () => {
      test('should return all adapters when no readyState provided', () => {
        initAdapters(mockAdapters);
  
        const adapters = getWalletAdapters();
        // Should have filtered out unsupported adapters already
        expect(adapters).toHaveLength(4);
      });
  
      test('should filter adapters by readyState', () => {
        initAdapters(mockAdapters);
  
        const installed = getWalletAdapters(WalletReadyState.Installed);
        expect(installed).toHaveLength(2);
        expect(installed.map(a => a.name)).toEqual(['Phantom', 'Solflare']);
  
        const loadable = getWalletAdapters(WalletReadyState.Loadable);
        expect(loadable).toHaveLength(1);
        expect(loadable[0].name).toBe('Backpack');
      });
  
      test('should map adapters to wallet providers format', () => {
        initAdapters(mockAdapters);
  
        const adapters = getWalletAdapters();
        expect(adapters[0]).toHaveProperty('adapter');
        expect(adapters[0]).toHaveProperty('name');
        expect(adapters[0]).toHaveProperty('icon');
        expect(adapters[0]).toHaveProperty('url');
        expect(adapters[0]).toHaveProperty('readyState');
      });
    });
  
    describe('getAdaptersByReadyState', () => {
      test('should filter adapters by ready state', () => {
        const installed = getAdaptersByReadyState(mockAdapters, WalletReadyState.Installed);
        expect(installed).toHaveLength(2);
        expect(installed).toContain(phantomAdapter);
        expect(installed).toContain(solflareAdapter);
  
        const loadable = getAdaptersByReadyState(mockAdapters, WalletReadyState.Loadable);
        expect(loadable).toHaveLength(1);
        expect(loadable).toContain(backpackAdapter);
      });
    });
  
    describe('sortWalletAdapters', () => {
      test('should sort adapters by priority', () => {
        // Create a mobile wallet adapter for testing
        const mobileAdapter = createMockAdapter('Mobile Wallet Adapter', WalletReadyState.Installed);
        const adaptersToSort = [
          trustAdapter,
          backpackAdapter,
          phantomAdapter,
          mobileAdapter
        ];
  
        const sorted = sortWalletAdapters(adaptersToSort);
        
        // Mobile wallet adapter should be first
        expect(sorted[0].name).toBe('Mobile Wallet Adapter');
        
        // Then installed adapters
        expect(sorted[1].name).toBe('Phantom');
        
        // Then loadable adapters
        expect(sorted[2].name).toBe('Backpack');
        
        // Lastly not detected
        expect(sorted[3].name).toBe('Trust');
      });
  
      test('should not modify the original array', () => {
        const original = [...mockAdapters];
        sortWalletAdapters(mockAdapters);
        expect(mockAdapters).toEqual(original);
      });
    });
  
    describe('addWalletAdapterEventListeners', () => {
      const mockPublicKey = new PublicKey('testPublicKey');
      const mockError = new WalletError('Test error');
      
      test('should add event listeners and return cleanup function', () => {
        const onConnect = jest.fn();
        const onDisconnect = jest.fn();
        const onError = jest.fn();
        const onReadyStateChange = jest.fn();
  
        const cleanup = addWalletAdapterEventListeners(phantomAdapter, {
          onConnect,
          onDisconnect,
          onError,
          onReadyStateChange
        });
  
        expect(phantomAdapter.on).toHaveBeenCalledWith('connect', onConnect);
        expect(phantomAdapter.on).toHaveBeenCalledWith('disconnect', onDisconnect);
        expect(phantomAdapter.on).toHaveBeenCalledWith('error', onError);
        expect(phantomAdapter.on).toHaveBeenCalledWith('readyStateChange', onReadyStateChange);
  
        // Call the cleanup function
        cleanup();
  
        expect(phantomAdapter.off).toHaveBeenCalledWith('connect', onConnect);
        expect(phantomAdapter.off).toHaveBeenCalledWith('disconnect', onDisconnect);
        expect(phantomAdapter.off).toHaveBeenCalledWith('error', onError);
        expect(phantomAdapter.off).toHaveBeenCalledWith('readyStateChange', onReadyStateChange);
      });
  
      test('should only add provided event handlers', () => {
        // Only provide onConnect
        const onConnect = jest.fn();
        
        addWalletAdapterEventListeners(phantomAdapter, {
          onConnect
        });
  
        expect(phantomAdapter.on).toHaveBeenCalledWith('connect', onConnect);
        expect(phantomAdapter.on).not.toHaveBeenCalledWith('disconnect', expect.any(Function));
        expect(phantomAdapter.on).not.toHaveBeenCalledWith('error', expect.any(Function));
        expect(phantomAdapter.on).not.toHaveBeenCalledWith('readyStateChange', expect.any(Function));
      });
    });
  });