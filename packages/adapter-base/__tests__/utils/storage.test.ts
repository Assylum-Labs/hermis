import { createLocalStorageUtility } from '../../src/utils/storage';

const createMockLocalStorage = () => {
    let store: Record<string, string> = {};
    return {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        }),
        key: jest.fn((index: number) => Object.keys(store)[index] || null),
        get length() { return Object.keys(store).length; },
        _getStore: () => store
    };
};

describe('Local Storage Utility', () => {
    const originalLocalStorage = Object.getOwnPropertyDescriptor(window, 'localStorage');
    let mockLocalStorage: ReturnType<typeof createMockLocalStorage>;

    beforeEach(() => {
        mockLocalStorage = createMockLocalStorage();
        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true,
            configurable: true
        });

        mockLocalStorage.clear();
    });

    afterEach(() => {
        if (originalLocalStorage) {
            Object.defineProperty(window, 'localStorage', originalLocalStorage);
        } else {
            delete (window as any).localStorage;
        }
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
            const storageUtil = createLocalStorageUtility<typeof testObj | null>('testKey', null);

            await storageUtil.set(testObj);

            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('testKey', JSON.stringify(testObj));
        });

        test('set should remove key from localStorage when value is null', async () => {
            const storageUtil = createLocalStorageUtility('testKey', 'defaultValue');

            await storageUtil.set(null);

            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('testKey');
        });

        test('should handle errors gracefully', async () => {
            const storageUtil = createLocalStorageUtility('testKey', 'defaultValue');

            mockLocalStorage.getItem.mockImplementationOnce(() => {
                throw new Error('Storage error');
            });

            const value = await storageUtil.get();
            expect(value).toBe('defaultValue');

            const originalConsoleError = console.error;
            console.error = jest.fn();

            mockLocalStorage.setItem.mockImplementationOnce(() => {
                throw new Error('Storage error');
            });

            await storageUtil.set('value');
            expect(console.error).toHaveBeenCalled();

            console.error = originalConsoleError;
        });

        test('should handle non-browser environment gracefully', async () => {
            const originalLocalStorage = window.localStorage;
            Object.defineProperty(window, 'localStorage', {
                value: undefined,
                writable: true,
                configurable: true
            });

            const storageUtil = createLocalStorageUtility('testKey', 'defaultValue');

            const value = await storageUtil.get();
            expect(value).toBe('defaultValue');

            await expect(storageUtil.set('value')).resolves.not.toThrow();

            Object.defineProperty(window, 'localStorage', {
                value: originalLocalStorage,
                writable: true,
                configurable: true
            });
        });
    });
});