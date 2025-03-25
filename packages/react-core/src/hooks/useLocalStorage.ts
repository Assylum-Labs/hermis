import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { createLocalStorageUtility } from '@agateh/solana-headless-adapter-base';

/**
 * Interface for storage provider
 */
export interface StorageProvider<T> {
    get(): Promise<T>;
    set(value: T): Promise<void>;
}

/**
 * Factory to create storage providers
 */
export type StorageProviderFactory = <T>(key: string, defaultValue: T) => StorageProvider<T>;

const defaultStorageFactory: StorageProviderFactory = <T>(key: string, defaultValue: T) =>
    createLocalStorageUtility<T>(key, defaultValue);

let globalStorageFactory: StorageProviderFactory = defaultStorageFactory;

/**
 * Set a custom storage provider factory to be used by all useLocalStorage hooks
 * 
 * @param factory Custom storage provider factory
 */
export function setStorageProviderFactory(factory: StorageProviderFactory): void {
    globalStorageFactory = factory;
}

/**
 * Reset the storage provider factory to the default localStorage implementation
 */
export function resetStorageProviderFactory(): void {
    globalStorageFactory = defaultStorageFactory;
}

/**
 * Hook for accessing and updating persistent storage
 * 
 * This hook allows for persistent state across sessions using the configured
 * storage provider (localStorage by default).
 * 
 * @param key Storage key
 * @param defaultState Default state if key doesn't exist
 * @param customStorageFactory Optional custom storage factory for this specific instance
 * @returns [state, setState] tuple
 */
export function useLocalStorage<T>(
    key: string,
    defaultState: T,
    customStorageFactory?: StorageProviderFactory
): [T, Dispatch<SetStateAction<T>>, boolean] {
    const storageFactory = customStorageFactory || globalStorageFactory;
    const storageProviderRef = useRef<StorageProvider<T>>(storageFactory<T>(key, defaultState));
    const [state, setState] = useState<T>(defaultState);
    const [loading, setLoading] = useState(true);
    const isFirstRenderRef = useRef(true);

    useEffect(() => {
        let mounted = true;

        const loadInitialValue = async () => {
            try {
                setLoading(true);
                const storedValue = await storageProviderRef.current.get();
                if (mounted) {
                    setState(storedValue);
                }
            } catch (error) {
                console.error(`Error reading from storage for key ${key}:`, error);
            } finally {
                if (mounted) {
                    setLoading(false);
                    isFirstRenderRef.current = false;
                }
            }
        };

        loadInitialValue();

        return () => {
            mounted = false;
        };
    }, [key]);

    useEffect(() => {
        if (isFirstRenderRef.current) {
            return;
        }

        const saveValue = async () => {
            try {
                await storageProviderRef.current.set(state);
            } catch (error) {
                console.error(`Error writing to storage for key ${key}:`, error);
            }
        };

        saveValue();
    }, [key, state]);

    return [state, setState, loading];
}

/**
 * Example of creating an IndexedDB storage provider factory
 * This is a simplified example - a real implementation would need more robust error handling
 */
export const createIndexedDBStorageFactory = (
    dbName: string,
    storeName: string
): StorageProviderFactory => {
    let dbPromise: Promise<IDBDatabase> | null = null;

    const initDB = (): Promise<IDBDatabase> => {
        if (!dbPromise) {
            dbPromise = new Promise((resolve, reject) => {
                const request = indexedDB.open(dbName, 1);

                request.onerror = (event) => {
                    reject(new Error('Failed to open IndexedDB'));
                };

                request.onsuccess = (event) => {
                    resolve(request.result);
                };

                request.onupgradeneeded = (event) => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains(storeName)) {
                        db.createObjectStore(storeName);
                    }
                };
            });
        }

        return dbPromise;
    };

    return <T>(key: string, defaultValue: T): StorageProvider<T> => {
        initDB();

        return {
            async get(): Promise<T> {
                try {
                    const db = await dbPromise!;

                    return new Promise<T>((resolve, reject) => {
                        const transaction = db.transaction(storeName, 'readonly');
                        const store = transaction.objectStore(storeName);
                        const request = store.get(key);

                        request.onerror = () => reject(new Error(`Error reading from IndexedDB for key ${key}`));

                        request.onsuccess = () => {
                            resolve(request.result === undefined ? defaultValue : request.result);
                        };
                    });
                } catch (error) {
                    console.error(`Error reading from IndexedDB for key ${key}:`, error);
                    return defaultValue;
                }
            },

            async set(value: T): Promise<void> {
                try {
                    const db = await dbPromise!;

                    return new Promise<void>((resolve, reject) => {
                        const transaction = db.transaction(storeName, 'readwrite');
                        const store = transaction.objectStore(storeName);
                        const request = value === null
                            ? store.delete(key)
                            : store.put(value, key);

                        request.onerror = () => reject(new Error(`Error writing to IndexedDB for key ${key}`));
                        request.onsuccess = () => resolve();
                    });
                } catch (error) {
                    console.error(`Error writing to IndexedDB for key ${key}:`, error);
                }
            }
        };
    };
};