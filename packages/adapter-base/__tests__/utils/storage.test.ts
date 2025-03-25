// packages/adapter-base/__tests__/utils/storage.test.ts

import { createLocalStorageUtility } from '../../src/utils/storage';

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    _getStore: () => store // For testing
  };
})();

// Save original localStorage
const originalLocalStorage = global.localStorage;

describe('Local Storage Utility', () => {
  beforeEach(() => {
    // Setup mock localStorage
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
    
    // Clear the mock storage before each test
    mockLocalStorage.clear();
  });
  
  afterEach(() => {
    // Restore original localStorage
    Object.defineProperty(global, 'localStorage', {
      value: originalLocalStorage,
      writable: true
    });
  });
  
  describe('createLocalStorageUtility', () => {
    test('should create a storage utility with get and set methods', () => {
      const storageUtil = createLocalStorageUtility('testKey', 'defaultValue');
      
      expect(storageUtil).toHaveProperty('get');
      expect(storageUtil).toHaveProperty('set');
      expect(typeof storageUtil.get).toBe('function');
      expect(typeof storageUtil.set).toBe('function');
    });
    
    test('get should return default value when key does not exist', async () => {
      const storageUtil = createLocalStorageUtility('nonExistentKey', 'defaultValue');
      
      const value = await storageUtil.get();
      
      expect(value).toBe('defaultValue');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('nonExistentKey');
    });
    
    test('get should parse JSON from localStorage', async () => {
      const testObj = { test: 'value', number: 42 };
      mockLocalStorage.setItem('testKey', JSON.stringify(testObj));
      
      const storageUtil = createLocalStorageUtility('testKey', null);
      const value = await storageUtil.get();
      
      expect(value).toEqual(testObj);
    });
    
    test('set should store JSON in localStorage', async () => {
      const testObj = { test: 'value', number: 42 };
      const storageUtil = createLocalStorageUtility('testKey', null);
      
      await storageUtil.set(testObj);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('testKey', JSON.stringify(testObj));
    });
    
    test('set should remove key from localStorage when value is null', async () => {
      const storageUtil = createLocalStorageUtility('testKey', 'defaultValue');
      
      await storageUtil.set(null);
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('testKey');
    });
    
    test('should handle errors gracefully', async () => {
      // Create a storage utility
      const storageUtil = createLocalStorageUtility('testKey', 'defaultValue');
      
      // Make localStorage.getItem throw an error
      mockLocalStorage.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      // get() should return the default value when there's an error
      const value = await storageUtil.get();
      expect(value).toBe('defaultValue');
      
      // Mock console.error to verify it's called
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // Make localStorage.setItem throw an error
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      // set() should handle errors gracefully
      await storageUtil.set('testValue');
      expect(console.error).toHaveBeenCalled();
      
      // Restore console.error
      console.error = originalConsoleError;
    });
    
    test('should handle non-browser environment gracefully', async () => {
      // Remove localStorage to simulate non-browser environment
      delete global.localStorage;
      
      const storageUtil = createLocalStorageUtility('testKey', 'defaultValue');
      
      // get() should return the default value
      const value = await storageUtil.get();
      expect(value).toBe('defaultValue');
      
      // set() should not throw an error
      await expect(storageUtil.set('testValue')).resolves.not.toThrow();
      
      // Restore global.localStorage for other tests
      global.localStorage = mockLocalStorage;
    });
  });
});