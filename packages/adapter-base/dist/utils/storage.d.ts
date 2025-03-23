/**
 * Create a local storage utility for persisting data
 * @param key The local storage key
 * @param defaultValue Default value if the key doesn't exist
 * @returns An object with get and set methods
 */
export declare function createLocalStorageUtility<T>(key: string, defaultValue: T): {
    get(): Promise<T>;
    set(value: T): Promise<void>;
};
