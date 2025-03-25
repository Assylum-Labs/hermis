// packages/adapter-base/__tests__/standard/mobile-wallet.test.ts

import { createMobileWalletAdapter } from '../../src/standard/utils';
import { SolanaMobileWalletAdapterWalletName } from '../../src/standard/constants';
import { getUriForAppIdentity } from '../../src/utils/environment';
import { WalletAdapterNetwork } from '@agateh/solana-headless-core';

// Mock the Solana Mobile Wallet Adapter dependency
jest.mock('@solana-mobile/wallet-adapter-mobile', () => {
  const SolanaMobileWalletAdapter = jest.fn().mockImplementation((config) => ({
    name: SolanaMobileWalletAdapterWalletName,
    url: 'https://solanamobile.com',
    icon: 'solanamobile-icon',
    readyState: 'Loadable',
    publicKey: null,
    connecting: false,
    connected: false,
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    sendTransaction: jest.fn(),
    signTransaction: jest.fn(),
    on: jest.fn().mockReturnThis(),
    off: jest.fn().mockReturnThis(),
    // Store config for testing
    _config: config
  }));

  return {
    SolanaMobileWalletAdapter,
    createDefaultAuthorizationResultCache: jest.fn().mockReturnValue({}),
    createDefaultWalletNotFoundHandler: jest.fn().mockReturnValue(jest.fn())
  };
});

// Mock getInferredNetworkFromEndpoint
jest.mock('../../src/utils/environment', () => ({
  getInferredNetworkFromEndpoint: jest.fn().mockReturnValue(WalletAdapterNetwork.Mainnet),
  getUriForAppIdentity: jest.fn().mockReturnValue('https://test.com')
}));

// Mock browser environment
Object.defineProperty(global, 'document', {
  value: {
    title: 'Test dApp'
  },
  writable: true
});

Object.defineProperty(global, 'window', {
  value: {
    location: {
      href: 'https://test.com/app'
    }
  },
  writable: true
});

describe('Mobile Wallet Adapter', () => {
  // Save originals
  const originalWindow = global.window;
  const originalDocument = global.document;

  afterEach(() => {
    // Restore originals
    global.window = originalWindow;
    global.document = originalDocument;
    
    // Clear mocks
    jest.clearAllMocks();
  });

  test('should create a mobile wallet adapter', async () => {
    const adapter = await createMobileWalletAdapter();
    
    expect(adapter).not.toBeNull();
    expect(adapter!.name).toBe(SolanaMobileWalletAdapterWalletName);
  });

  test('should use default cluster based on endpoint', async () => {
    const adapter = await createMobileWalletAdapter('https://api.devnet.solana.com');
    
    // Get the mock implementation
    const mobileAdapter = adapter as any;
    
    // Check that the network/cluster was properly inferred from the endpoint
    expect(mobileAdapter._config.cluster).toBe(WalletAdapterNetwork.Mainnet);
  });

  test('should use app identity from document title and URI', async () => {
    const adapter = await createMobileWalletAdapter();
    
    // Get the mock implementation
    const mobileAdapter = adapter as any;
    
    // Check that the app identity was properly set
    expect(mobileAdapter._config.appIdentity.name).toBe('Test dApp');
    expect(mobileAdapter._config.appIdentity.uri).toBe('https://test.com');
  });

  test('should handle address selection', async () => {
    const adapter = await createMobileWalletAdapter();
    
    // Get the mock implementation
    const mobileAdapter = adapter as any;
    
    // Test the address selector
    const mockAddresses = ['address1', 'address2', 'address3'];
    const selectedAddress = await mobileAdapter._config.addressSelector.select(mockAddresses);
    
    // Should select the first address
    expect(selectedAddress).toBe('address1');
  });

  test('should handle wallet not found', async () => {
    // Get the import
    const { createDefaultWalletNotFoundHandler } = require('@solana-mobile/wallet-adapter-mobile');
    
    const adapter = await createMobileWalletAdapter();
    
    // Get the mock implementation
    const mobileAdapter = adapter as any;
    
    // Check that the wallet not found handler was properly set
    expect(mobileAdapter._config.onWalletNotFound).toBeDefined();
    expect(createDefaultWalletNotFoundHandler).toHaveBeenCalled();
  });

  test('should return null when window is undefined', async () => {
    // Temporarily remove window
    // delete global.window;
    const tempWindow = { ...global.window };
    Object.defineProperty(window, 'window', {
        value: { ...tempWindow, window: undefined },
        writable: true,
        configurable: true
    });
    
    const adapter = await createMobileWalletAdapter();
    
    expect(adapter).toBeNull();
    
    // Restore window
    global.window = originalWindow;
  });

  test('should return null when SolanaMobileWalletAdapter throws', async () => {
    // Make the constructor throw
    require('@solana-mobile/wallet-adapter-mobile').SolanaMobileWalletAdapter.mockImplementationOnce(() => {
      throw new Error('Mobile wallet adapter not available');
    });
    
    const adapter = await createMobileWalletAdapter();
    
    expect(adapter).toBeNull();
  });
});