/**
 * Create a local storage utility for persisting data
 * @param key The local storage key
 * @param defaultValue Default value if the key doesn't exist
 * @returns An object with get and set methods
 */
export function createLocalStorageUtility(key, defaultValue) {
    return {
        async get() {
            try {
                if (typeof window === 'undefined')
                    return defaultValue;
                const value = window.localStorage.getItem(key);
                if (!value)
                    return defaultValue;
                return JSON.parse(value);
            }
            catch (error) {
                console.error(`Error reading from localStorage:`, error);
                return defaultValue;
            }
        },
        async set(value) {
            try {
                if (typeof window === 'undefined')
                    return;
                if (value === null) {
                    window.localStorage.removeItem(key);
                }
                else {
                    window.localStorage.setItem(key, JSON.stringify(value));
                }
            }
            catch (error) {
                console.error(`Error writing to localStorage:`, error);
            }
        }
    };
}
