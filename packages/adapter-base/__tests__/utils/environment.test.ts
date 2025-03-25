// packages/adapter-base/__tests__/utils/environment.test.ts

import { WalletAdapterNetwork, WalletReadyState } from '@agateh/solana-headless-core';
import { 
  getEnvironment, 
  getIsMobile, 
  isAndroid, 
  isIOS, 
  isMobileDevice,
  isIosAndRedirectable,
  getInferredNetworkFromEndpoint,
  getUriForAppIdentity,
  Environment
} from '../../src/utils/environment';
import { SolanaMobileWalletAdapterWalletName } from '../../src/standard/constants';

// Mock the global window object
const originalWindow = global.window;

beforeAll(() => {
  // Mock the window object for testing
  global.window = Object.create(window);
  Object.defineProperty(window, 'location', {
    value: {
      protocol: 'https:',
      host: 'test.com',
    },
    writable: true
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
      // Mock getEnvironment implementation for this test
      jest.spyOn(global, 'getEnvironment').mockReturnValueOnce(Environment.MOBILE_WEB);
      
      const isMobile = getIsMobile(mockAdapters);
      expect(isMobile).toBe(true);
    });

    test('should return false for desktop environment', () => {
      // Mock getEnvironment implementation for this test
      jest.spyOn(global, 'getEnvironment').mockReturnValueOnce(Environment.DESKTOP_WEB);
      
      const isMobile = getIsMobile(mockAdapters);
      expect(isMobile).toBe(false);
    });
  });

  describe('isIosAndRedirectable', () => {
    let originalNavigator: Navigator;
    
    beforeEach(() => {
      // Save original navigator
      originalNavigator = global.navigator;
      
      // Mock navigator for iOS Safari
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
        },
        writable: true
      });
    });
    
    afterEach(() => {
      // Restore original navigator
      global.navigator = originalNavigator;
    });
    
    test('should return true for iOS Safari', () => {
      expect(isIosAndRedirectable()).toBe(true);
    });
    
    test('should return false for iOS WebView', () => {
      // Mock navigator for iOS WebView (no Safari in user agent)
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
      });
      
      expect(isIosAndRedirectable()).toBe(false);
    });
    
    test('should return false for Android', () => {
      // Mock navigator for Android
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Mobile Safari/537.36'
      });
      
      expect(isIosAndRedirectable()).toBe(false);
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

afterAll(() => {
  // Restore the original window object
  global.window = originalWindow;
});

describe('Environment Utilities', () => {
  // Create mock adapters for testing
  const createMockAdapter = (
    name: string, 
    readyState: WalletReadyState
  ) => ({
    name,
    readyState
  });

  const mockAdapters = [
    createMockAdapter('Phantom', WalletReadyState.Installed),
    createMockAdapter('Solflare', WalletReadyState.Installed),
    createMockAdapter(SolanaMobileWalletAdapterWalletName, WalletReadyState.Loadable)
  ];
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