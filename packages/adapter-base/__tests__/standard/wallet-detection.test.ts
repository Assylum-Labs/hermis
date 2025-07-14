import { 
  initializeWalletDetection, 
  getWalletRegistry, 
  addWalletRegistryChangeListener,
  waitForWalletRegistration,
  getDetectedWalletAdapters
} from '../../src/standard/wallet-detection';
import { createMockStandardWallet } from '../helpers/test-utils';

// Mock the wallet adapter
jest.mock('../../src/standard/wallet-adapter', () => ({
  StandardWalletAdapter: jest.fn().mockImplementation((wallet) => ({
    name: wallet.name,
    url: wallet.url || '',
    icon: wallet.icon || '',
    readyState: 'Installed',
    publicKey: null,
    connecting: false,
    connected: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn()
  }))
}));

// Mock window for testing
const mockWindow = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  navigator: {
    wallets: []
  }
};

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
  configurable: true
});

describe('Wallet Detection Race Condition Fix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    
    // Reset window mock
    mockWindow.addEventListener.mockClear();
    mockWindow.removeEventListener.mockClear();
    mockWindow.dispatchEvent.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Dynamic Wallet Registration', () => {
    test('should register wallet and notify listeners', () => {
      const registry = getWalletRegistry();
      const changeListener = jest.fn();
      
      // Add change listener
      const removeListener = addWalletRegistryChangeListener(changeListener);

      // Create and register a mock wallet
      const mockWallet = createMockStandardWallet({
        'standard:connect': { connect: jest.fn() },
        'standard:events': { on: jest.fn() },
        'solana:signTransaction': { signTransaction: jest.fn() }
      });
      mockWallet.name = 'Backpack';

      // Register the wallet
      const adapter = registry.register(mockWallet as any);

      // Verify wallet was registered
      expect(adapter).toBeTruthy();
      expect(adapter?.name).toBe('Backpack');

      // Verify change listener was called
      expect(changeListener).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Backpack' })
        ])
      );

      // Clean up
      removeListener();
    });

    test('should handle wallet registry changes properly', () => {
      const registry = getWalletRegistry();
      const changeListener = jest.fn();
      
      // Add change listener
      const removeListener = addWalletRegistryChangeListener(changeListener);

      // Get initial call count (registry might have existing wallets)
      const initialCallCount = changeListener.mock.calls.length;

      // Register first wallet
      const wallet1 = createMockStandardWallet({
        'standard:connect': { connect: jest.fn() },
        'standard:events': { on: jest.fn() },
        'solana:signTransaction': { signTransaction: jest.fn() }
      });
      wallet1.name = 'UniqueWallet1_' + Date.now();

      registry.register(wallet1 as any);
      expect(changeListener).toHaveBeenCalledTimes(initialCallCount + 1);

      // Register second wallet
      const wallet2 = createMockStandardWallet({
        'standard:connect': { connect: jest.fn() },
        'standard:events': { on: jest.fn() },
        'solana:signTransaction': { signTransaction: jest.fn() }
      });
      wallet2.name = 'UniqueWallet2_' + Date.now();

      registry.register(wallet2 as any);
      expect(changeListener).toHaveBeenCalledTimes(initialCallCount + 2);

      // Verify both wallets are registered
      const adapters = registry.getAdapters();
      expect(adapters.some(a => a.name === wallet1.name)).toBeTruthy();
      expect(adapters.some(a => a.name === wallet2.name)).toBeTruthy();

      // Clean up
      removeListener();
    });
  });

  describe('waitForWalletRegistration', () => {
    test('should resolve immediately if wallet is already registered', async () => {
      const registry = getWalletRegistry();

      // Register wallet first
      const mockWallet = createMockStandardWallet({
        'standard:connect': { connect: jest.fn() },
        'standard:events': { on: jest.fn() },
        'solana:signTransaction': { signTransaction: jest.fn() }
      });
      mockWallet.name = 'TestWallet';

      registry.register(mockWallet as any);

      // Should resolve immediately
      const result = await waitForWalletRegistration('TestWallet');
      expect(result).toBeTruthy();
      expect(result?.name).toBe('TestWallet');
    });

    test('should wait for wallet registration and resolve when found', async () => {
      const registry = getWalletRegistry();

      // Start waiting for wallet
      const waitPromise = waitForWalletRegistration('DelayedWallet', 3000);

      // Register wallet after some time
      setTimeout(() => {
        const mockWallet = createMockStandardWallet({
          'standard:connect': { connect: jest.fn() },
          'standard:events': { on: jest.fn() },
          'solana:signTransaction': { signTransaction: jest.fn() }
        });
        mockWallet.name = 'DelayedWallet';

        registry.register(mockWallet as any);
      }, 1000);

      // Fast forward time
      jest.advanceTimersByTime(1000);

      const result = await waitPromise;
      expect(result).toBeTruthy();
      expect(result?.name).toBe('DelayedWallet');
    });

    test('should timeout if wallet is not registered within timeout period', async () => {
      // Start waiting for wallet with short timeout
      const waitPromise = waitForWalletRegistration('NonExistentWallet', 1000);

      // Fast forward past timeout
      jest.advanceTimersByTime(1500);

      const result = await waitPromise;
      expect(result).toBeNull();
    });
  });

  describe('Wallet Detection Initialization', () => {
    test('should initialize wallet detection without errors', () => {
      expect(() => {
        initializeWalletDetection();
      }).not.toThrow();
    });

    test('should not initialize twice', () => {
      // First initialization
      const cleanup1 = initializeWalletDetection();
      expect(cleanup1).toBeDefined();

      // Second initialization should return empty cleanup
      const cleanup2 = initializeWalletDetection();
      expect(cleanup2).toBeDefined();
    });
  });

  describe('Registry Change Listeners', () => {
    test('should properly remove change listeners', () => {
      const registry = getWalletRegistry();
      const listener = jest.fn();

      const removeListener = addWalletRegistryChangeListener(listener);

      // Register a wallet to trigger listener
      const mockWallet = createMockStandardWallet({
        'standard:connect': { connect: jest.fn() },
        'standard:events': { on: jest.fn() },
        'solana:signTransaction': { signTransaction: jest.fn() }
      });
      mockWallet.name = 'TestWallet1';

      registry.register(mockWallet as any);
      const callCountAfterFirst = listener.mock.calls.length;
      expect(callCountAfterFirst).toBeGreaterThan(0);

      // Remove listener
      removeListener();

      // Register another wallet
      const mockWallet2 = createMockStandardWallet({
        'standard:connect': { connect: jest.fn() },
        'standard:events': { on: jest.fn() },
        'solana:signTransaction': { signTransaction: jest.fn() }
      });
      mockWallet2.name = 'TestWallet2';

      registry.register(mockWallet2 as any);

      // Listener should not be called again
      expect(listener).toHaveBeenCalledTimes(callCountAfterFirst);
    });
  });
}); 