// packages/adapter-base/__tests__/utils/environment.test.ts

import { WalletAdapterNetwork, WalletReadyState, Adapter, PublicKey, WalletName } from '@agateh/solana-headless-core';
import { 
  getEnvironment, 
  getIsMobile, 
  isAndroid, 
  isIOS, 
  isMobileDevice,
  isIosAndRedirectable,
  getInferredNetworkFromEndpoint,
  getUriForAppIdentity
} from '../../src/utils/environment';
import { SolanaMobileWalletAdapterWalletName } from '../../src/standard/constants';
import { Environment } from '../../src/types';

// Create a comprehensive mock adapter that fully implements the Adapter interface
function createMockAdapter(
  name: string, 
  readyState: WalletReadyState
): Adapter {
  return {
    name: name as WalletName,
    url: `https://${name.toLowerCase()}.com`,
    icon: `${name.toLowerCase()}-icon`,
    readyState,
    publicKey: null,
    connecting: false,
    connected: false,
    supportedTransactionVersions: null,
    
    // Implement required methods with minimal mock implementations
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    autoConnect: jest.fn().mockResolvedValue(undefined),
    sendTransaction: jest.fn(),
    signTransaction: jest.fn(),
    
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
    eventNames: jest.fn().mockReturnValue([])
  };
}

// Mock the global window object
const originalWindow = global.window;

describe('Environment Utilities', () => {
  // Create mock adapters for testing
  const mockAdapters: Adapter[] = [
    createMockAdapter('Phantom', WalletReadyState.Installed),
    createMockAdapter('Solflare', WalletReadyState.Installed),
    createMockAdapter(SolanaMobileWalletAdapterWalletName, WalletReadyState.Loadable)
  ];

  beforeAll(() => {
    // Mock the window object for testing
    Object.defineProperty(global, 'window', {
      value: {
        location: {
          protocol: 'https:',
          host: 'test.com',
        }
      },
      writable: true
    });
  });

  afterAll(() => {
    // Restore the original window object
    global.window = originalWindow;
  });

  describe('getEnvironment', () => {
    test('should detect mobile environment based on user agent', () => {
      const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
      const environment = getEnvironment({ 
        adapters: mockAdapters,
        userAgentString: mobileUA
      });
      
      expect(environment).toBe(Environment.MOBILE_WEB);
    });

    test('should detect desktop environment when desktop adapters are installed', () => {
      // Android user agent, but desktop wallet is installed
      const mobileUA = 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Mobile Safari/537.36';
      
      // Use installed adapters (which should force desktop environment)
      const environment = getEnvironment({ 
        adapters: mockAdapters,
        userAgentString: mobileUA
      });
      
      expect(environment).toBe(Environment.DESKTOP_WEB);
    });

    test('should default to desktop with no user agent', () => {
      const environment = getEnvironment({ 
        adapters: mockAdapters,
        userAgentString: null
      });
      
      expect(environment).toBe(Environment.DESKTOP_WEB);
    });
  });

  describe('getIsMobile', () => {
    test('should return true for mobile environment', () => {
      const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
      
      const isMobile = getIsMobile(mockAdapters, mobileUA);
      expect(isMobile).toBe(true);
    });

    test('should return false for desktop environment', () => {
      const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      
      const isMobile = getIsMobile(mockAdapters, desktopUA);
      expect(isMobile).toBe(false);
    });
  });

  describe('getUriForAppIdentity', () => {
    test('should return protocol and host', () => {
      const uri = getUriForAppIdentity();
      expect(uri).toBe('https://test.com');
    });

    test('should return undefined if window is undefined', () => {
      const originalWindow = global.window;
      // @ts-ignore: Intentionally setting window to undefined for testing
      delete global.window;

      const uri = getUriForAppIdentity();
      expect(uri).toBeUndefined();

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('isAndroid', () => {
    test('should return true for Android user agent', () => {
      const androidUA = 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Mobile Safari/537.36';
      expect(isAndroid(androidUA)).toBe(true);
    });

    test('should return false for non-Android user agent', () => {
      const iosUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
      expect(isAndroid(iosUA)).toBe(false);
    });
  });

  describe('isIOS', () => {
    test('should return true for iOS user agent', () => {
      const iosUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
      expect(isIOS(iosUA)).toBe(true);
    });

    test('should return true for iPad user agent', () => {
      const iPadUA = 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
      expect(isIOS(iPadUA)).toBe(true);
    });

    test('should return false for non-iOS user agent', () => {
      const androidUA = 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Mobile Safari/537.36';
      expect(isIOS(androidUA)).toBe(false);
    });
  });

  describe('isMobileDevice', () => {
    test('should return true for mobile device not in WebView', () => {
      const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
      expect(isMobileDevice(mobileUA)).toBe(true);
    });

    test('should return false for WebView', () => {
      const webViewUA = 'Mozilla/5.0 (Linux; Android 10; SM-G975F; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/91.0.4472.101 Mobile Safari/537.36';
      expect(isMobileDevice(webViewUA)).toBe(false);
    });

    test('should return false for desktop', () => {
      const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      expect(isMobileDevice(desktopUA)).toBe(false);
    });
  });

  describe('isIosAndRedirectable', () => {
    test('should return true for iOS Safari', () => {
      const iosSafariUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
      
      // Mock navigator for this test
      const originalNavigator = global.navigator;
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: iosSafariUA },
        writable: true
      });

      expect(isIosAndRedirectable()).toBe(true);

      // Restore original navigator
      global.navigator = originalNavigator;
    });

    test('should return false for iOS WebView', () => {
      const iosWebViewUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
      
      // Mock navigator for this test
      const originalNavigator = global.navigator;
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: iosWebViewUA },
        writable: true
      });

      expect(isIosAndRedirectable()).toBe(false);

      // Restore original navigator
      global.navigator = originalNavigator;
    });
  });

  describe('getInferredNetworkFromEndpoint', () => {
    test('should infer mainnet from unspecified endpoint', () => {
      const network = getInferredNetworkFromEndpoint();
      expect(network).toBe(WalletAdapterNetwork.Mainnet);
    });
    
    test('should infer devnet from devnet endpoint', () => {
      const network = getInferredNetworkFromEndpoint('https://api.devnet.solana.com');
      expect(network).toBe(WalletAdapterNetwork.Devnet);
    });
    
    test('should infer testnet from testnet endpoint', () => {
      const network = getInferredNetworkFromEndpoint('https://api.testnet.solana.com');
      expect(network).toBe(WalletAdapterNetwork.Testnet);
    });
    
    test('should infer mainnet from other endpoints', () => {
      const network = getInferredNetworkFromEndpoint('https://custom-mainnet.solana.com');
      expect(network).toBe(WalletAdapterNetwork.Mainnet);
    });
  });
});