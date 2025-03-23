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

// Default storage factory uses localStorage
const defaultStorageFactory: StorageProviderFactory = <T>(key: string, defaultValue: T) => 
  createLocalStorageUtility<T>(key, defaultValue);

// Global storage factory that can be overridden
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
): [T, Dispatch<SetStateAction<T>>] {
  // Use custom factory if provided, otherwise use global factory
  const storageFactory = customStorageFactory || globalStorageFactory;
  
  // Create a storage provider for this key
  const storageProviderRef = useRef<StorageProvider<T>>(
    storageFactory<T>(key, defaultState)
  );
  
  // Initialize state with persisted value or default
  const [state, setState] = useState<T>(defaultState);
  
  // Track the first render to avoid unnecessary storage updates
  const isFirstRenderRef = useRef(true);
  
  // Update storage when state changes
  useEffect(() => {
    const updateStorage = async() => {
        if (isFirstRenderRef.current) {
          isFirstRenderRef.current = false;
          return;
        }
        
        try {
           await
           storageProviderRef.current.set(state);
        } catch (error) {
          console.error(`Error writing to storage for key ${key}:`, error);
        }
    }

    updateStorage()
  }, [key, state]);
  
  return [state, setState];
}

/**
 * Example of creating an IndexedDB storage provider factory
 * This is a simplified example - a real implementation would need more robust error handling
 */
export const createIndexedDBStorageFactory = (
  dbName: string, 
  storeName: string
): StorageProviderFactory => {
  // Initialize the database
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
    // Initialize the DB when the provider is created
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
              // If value doesn't exist, return default
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