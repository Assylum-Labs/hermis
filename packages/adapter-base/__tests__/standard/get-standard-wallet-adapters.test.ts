// packages/adapter-base/__tests__/standard/get-standard-wallet-adapters.test.ts

import { Adapter, WalletReadyState } from '@agateh/solana-headless-core';
import { getStandardWalletAdapters } from '../../src/standard/utils';
import { Environment } from '../../src/types';
import { SolanaMobileWalletAdapterWalletName } from '../../src/standard/constants';
import { createMockAdapter } from '../testHelpers';

// Mock the environment detection
jest.mock('../../src/utils/environment', () => ({
  getEnvironment: jest.fn().mockReturnValue(Environment.DESKTOP_WEB),
  getUserAgent: jest.fn().mockReturnValue('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
  getInferredNetworkFromEndpoint: jest.fn().mockReturnValue('mainnet-beta')
}));

// Mock createMobileWalletAdapter
jest.mock('../../src/standard/utils', () => {
  const originalModule = jest.requireActual('../../src/standard/utils');
  return {
    ...originalModule,
    createMobileWalletAdapter: jest.fn().mockImplementation(() => {
      return Promise.resolve(createMockAdapter(SolanaMobileWalletAdapterWalletName, WalletReadyState.Installed));
    }),
    // Re-export to avoid circular dependency
    isWalletAdapterCompatibleStandardWallet: originalModule.isWalletAdapterCompatibleStandardWallet,
    StandardConnectMethod: originalModule.StandardConnectMethod,
    StandardDisconnectMethod: originalModule.StandardDisconnectMethod,
    StandardEventsMethod: originalModule.StandardEventsMethod,
    SolanaSignTransactionMethod: originalModule.SolanaSignTransactionMethod,
    SolanaSignAndSendTransactionMethod: originalModule.SolanaSignAndSendTransactionMethod,
    SolanaSignMessageMethod: originalModule.SolanaSignMessageMethod,
    SolanaSignInMethod: originalModule.SolanaSignInMethod
  };
});

// Mock StandardWalletAdapter
jest.mock('../../src/standard/wallet-adapter', () => ({
  StandardWalletAdapter: jest.fn().mockImplementation(() => createMockAdapter('Standard Wallet', WalletReadyState.Installed))
}));

declare global {
  interface Navigator {
    wallets?: {
      get: () => any[];
    };
  }
}

describe('getStandardWalletAdapters', () => {
  // Define types for the extended window & navigator objects

  // Mock window.navigator.wallets
  const mockWindowWallets = {
    get: jest.fn().mockReturnValue([
      {
        name: 'Standard Wallet 1',
        icon: 'data:,',
        features: {
          'standard:connect': { connect: jest.fn() },
          'standard:events': { on: jest.fn() },
          'solana:signTransaction': { signTransaction: jest.fn() }
        }
      },
      {
        name: 'Standard Wallet 2',
        icon: 'data:,',
        features: {
          'standard:connect': { connect: jest.fn() },
          'standard:events': { on: jest.fn() },
          'solana:signAndSendTransaction': { signAndSendTransaction: jest.fn() }
        }
      },
      {
        name: 'Incompatible Wallet',
        icon: 'data:,',
        features: {
          'standard:connect': { connect: jest.fn() }
          // Missing required features
        }
      }
    ])
  };

  // Store original navigator
  const originalNavigator = window.navigator;

  beforeEach(() => {
    // Set up window.navigator.wallets
    Object.defineProperty(window, 'navigator', {
      value: {
        ...window.navigator,
        wallets: mockWindowWallets
      },
      writable: true,
      configurable: true
    });

    // Reset environment to desktop
    require('../../src/utils/environment').getEnvironment.mockReturnValue(Environment.DESKTOP_WEB);

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original navigator
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true
    });
  });

  test('should return existing adapters when not in browser environment', async () => {
    // Temporarily remove wallets property
    const tempNavigator = { ...window.navigator };
    Object.defineProperty(window, 'navigator', {
      value: { ...tempNavigator, wallets: undefined },
      writable: true,
      configurable: true
    });

    const existingAdapters = [
      createMockAdapter('Existing Adapter 1', WalletReadyState.Installed),
      createMockAdapter('Existing Adapter 2', WalletReadyState.Installed)
    ];

    const adapters = await getStandardWalletAdapters(existingAdapters);
    expect(adapters).toEqual(existingAdapters);
  });

  test('should add mobile wallet adapter in mobile environment', async () => {
    // Set environment to mobile
    require('../../src/utils/environment').getEnvironment.mockReturnValue(Environment.MOBILE_WEB);

    const existingAdapters = [
      createMockAdapter('Existing Adapter', WalletReadyState.Installed)
    ];

    const adapters = await getStandardWalletAdapters(existingAdapters);
    
    // Should have added the mobile wallet adapter
    expect(adapters.length).toBe(existingAdapters.length + 1);
    expect(adapters[0].name).toBe(SolanaMobileWalletAdapterWalletName);
    
    // The createMobileWalletAdapter function should have been called
    expect(require('../../src/standard/utils').createMobileWalletAdapter).toHaveBeenCalled();
  });

  test('should not add mobile wallet adapter if already included', async () => {
    // Set environment to mobile
    require('../../src/utils/environment').getEnvironment.mockReturnValue(Environment.MOBILE_WEB);

    const existingAdapters = [
      createMockAdapter(SolanaMobileWalletAdapterWalletName, WalletReadyState.Installed),
      createMockAdapter('Existing Adapter', WalletReadyState.Installed)
    ];

    const adapters = await getStandardWalletAdapters(existingAdapters);
    
    // Should not have added another mobile wallet adapter
    expect(adapters.length).toBe(existingAdapters.length);
    
    // The createMobileWalletAdapter function should not have been called
    expect(require('../../src/standard/utils').createMobileWalletAdapter).not.toHaveBeenCalled();
  });

  test('should add standard wallet adapters', async () => {
    const existingAdapters = [
      createMockAdapter('Existing Adapter', WalletReadyState.Installed)
    ];

    const adapters = await getStandardWalletAdapters(existingAdapters);
    
    // Should have added standard wallet adapters (2 valid ones from the mock)
    expect(adapters.length).toBe(existingAdapters.length + 2);
    
    // Check that wallets.get was called
    expect(mockWindowWallets.get).toHaveBeenCalled();
    
    // StandardWalletAdapter constructor should have been called for each valid wallet
    expect(require('../../src/standard/wallet-adapter').StandardWalletAdapter).toHaveBeenCalledTimes(2);
  });

  test('should filter out duplicate adapters by name', async () => {
    const existingAdapters = [
      createMockAdapter('Standard Wallet 1', WalletReadyState.Installed)
    ];

    const adapters = await getStandardWalletAdapters(existingAdapters);
    
    // Should have only added the second standard wallet (the first is a duplicate)
    expect(adapters.length).toBe(existingAdapters.length + 1);
    
    // Check names to ensure no duplicates
    const names = adapters.map(a => a.name);
    const uniqueNames = [...new Set(names)];
    expect(names.length).toBe(uniqueNames.length);
  });

  test('should handle errors when creating adapters', async () => {
    // Make StandardWalletAdapter throw for one call
    require('../../src/standard/wallet-adapter').StandardWalletAdapter
      .mockImplementationOnce(() => { throw new Error('Failed to create adapter'); })
      .mockImplementationOnce(() => createMockAdapter('Standard Wallet 2', WalletReadyState.Installed));

    const existingAdapters = [
      createMockAdapter('Existing Adapter', WalletReadyState.Installed)
    ];

    const adapters = await getStandardWalletAdapters(existingAdapters);
    
    // Should still add the second adapter even if the first fails
    expect(adapters.length).toBe(existingAdapters.length + 1);
  });

  test('should handle missing wallet standard gracefully', async () => {
    // Remove window.navigator.wallets
    const tempNavigator = { ...window.navigator };
    Object.defineProperty(window, 'navigator', {
      value: { ...tempNavigator, wallets: undefined },
      writable: true,
      configurable: true
    });

    const existingAdapters = [
      createMockAdapter('Existing Adapter', WalletReadyState.Installed)
    ];

    const adapters = await getStandardWalletAdapters(existingAdapters);
    
    // Should return only existing adapters
    expect(adapters).toEqual(existingAdapters);
  });

  test('should pass endpoint to createMobileWalletAdapter', async () => {
    // Set environment to mobile
    require('../../src/utils/environment').getEnvironment.mockReturnValue(Environment.MOBILE_WEB);

    const existingAdapters = [
      createMockAdapter('Existing Adapter', WalletReadyState.Installed)
    ];

    await getStandardWalletAdapters(existingAdapters, 'https://api.devnet.solana.com');
    
    // Check that createMobileWalletAdapter was called with the endpoint
    expect(require('../../src/standard/utils').createMobileWalletAdapter)
      .toHaveBeenCalledWith('https://api.devnet.solana.com');
  });

  test('should handle errors gracefully', async () => {
    // Make window.navigator.wallets.get throw
    mockWindowWallets.get.mockImplementationOnce(() => {
      throw new Error('Failed to get wallets');
    });

    const existingAdapters = [
      createMockAdapter('Existing Adapter', WalletReadyState.Installed)
    ];

    const adapters = await getStandardWalletAdapters(existingAdapters);
    
    // Should return only existing adapters
    expect(adapters).toEqual(existingAdapters);
  });
});