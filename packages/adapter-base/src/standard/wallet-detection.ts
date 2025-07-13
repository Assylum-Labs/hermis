// packages/adapter-base/src/standard/wallet-detection.ts

import type {
  Wallet,
  WalletEventsWindow,
  WindowAppReadyEvent,
} from "@wallet-standard/base";
import { Adapter } from "@hermis/solana-headless-core";
import { StandardWalletAdapter } from "./wallet-adapter.js";
import {
  isWalletAdapterCompatibleStandardWallet,
  TypedStandardWallet,
} from "./types.js";

// Type guard for window with wallet events
function isWalletEventsWindow(window: any): window is WalletEventsWindow {
  return (
    typeof window !== "undefined" &&
    "addEventListener" in window &&
    "removeEventListener" in window
  );
}

// Cache for detected standard wallets to avoid duplicates
const detectedWallets = new Map<string, TypedStandardWallet>();

const registrationListeners = new Set<() => void>();

// Global flag to track if wallet detection has been initialized
let walletDetectionInitialized = false;

/**
 * Wallet registry to manage dynamically detected wallets
 */
export class WalletRegistry {
  #wallets: Map<string, TypedStandardWallet> = new Map();
  #adapters: Map<string, StandardWalletAdapter> = new Map();
  #changeListeners: Set<(adapters: StandardWalletAdapter[]) => void> =
    new Set();

  /**
   * Register a wallet and create an adapter for it
   */
  register(wallet: TypedStandardWallet): StandardWalletAdapter | null {
    // Check if compatible
    if (!isWalletAdapterCompatibleStandardWallet(wallet)) {
      return null;
    }

    // Check if already registered
    if (this.#wallets.has(wallet.name)) {
      return this.#adapters.get(wallet.name) || null;
    }

    try {
      // Create adapter
      const adapter = new StandardWalletAdapter(wallet);

      this.#wallets.set(wallet.name, wallet);
      this.#adapters.set(wallet.name, adapter);

      console.log(`[Wallet Registry] Successfully registered wallet: ${wallet.name}`);
      this.notifyChange();

      return adapter;
    } catch (error) {
      console.error(
        `Failed to create adapter for wallet ${wallet.name}:`,
        error
      );
      return null;
    }
  }

  /**
   * Unregister a wallet
   */
  unregister(wallet: TypedStandardWallet): void {
    if (this.#wallets.has(wallet.name)) {
      this.#wallets.delete(wallet.name);
      this.#adapters.delete(wallet.name);
      console.log(`[Wallet Registry] Unregistered wallet: ${wallet.name}`);
      this.notifyChange();
    }
  }

  /**
   * Get all registered adapters
   */
  getAdapters(): StandardWalletAdapter[] {
    return Array.from(this.#adapters.values());
  }

  /**
   * Get a specific adapter by name
   */
  getAdapter(name: string): StandardWalletAdapter | null {
    return this.#adapters.get(name) || null;
  }

  /**
   * Add a change listener
   */
  addChangeListener(listener: (adapters: StandardWalletAdapter[]) => void): () => void {
    this.#changeListeners.add(listener);
    return () => {
      this.#changeListeners.delete(listener);
    };
  }

  /**
   * Notify all change listeners
   */
  private notifyChange(): void {
    const adapters = this.getAdapters();
    this.#changeListeners.forEach((listener) => {
      try {
        listener(adapters);
      } catch (error) {
        console.error("Error in wallet registry change listener:", error);
      }
    });
  }

  /**
   * Check if a wallet is registered
   */
  hasWallet(name: string): boolean {
    return this.#wallets.has(name);
  }

  /**
   * Get wallet count
   */
  getWalletCount(): number {
    return this.#wallets.size;
  }
}

// Global registry instance
let globalRegistry: WalletRegistry | null = null;

/**
 * Get or create the global wallet registry
 */
export function getWalletRegistry(): WalletRegistry {
  if (!globalRegistry) {
    globalRegistry = new WalletRegistry();
  }
  return globalRegistry;
}

/**
 * Initialize wallet detection system with retry mechanism
 * This sets up event listeners for wallet registration
 */
export function initializeWalletDetection(): () => void {
  // Only run in browser
  if (typeof window === "undefined" || !isWalletEventsWindow(window)) {
    return () => {};
  }

  // Avoid duplicate initialization
  if (walletDetectionInitialized) {
    return () => {};
  }

  walletDetectionInitialized = true;
  const registry = getWalletRegistry();
  const cleanupFunctions: (() => void)[] = [];

  try {
    // Initialize legacy wallet support first
    initializeLegacyWalletSupport();

    // API for wallets to register themselves
    const api = Object.freeze({
      register(wallet: Wallet): () => void {
        const typedWallet = wallet as TypedStandardWallet;
        console.log(`[Wallet Detection] Registering wallet: ${typedWallet.name}`);
        detectedWallets.set(typedWallet.name, typedWallet);
        registry.register(typedWallet);

        // Return unregister function
        return () => {
          console.log(`[Wallet Detection] Unregistering wallet: ${typedWallet.name}`);
          detectedWallets.delete(typedWallet.name);
          registry.unregister(typedWallet);
        };
      },
    });

    // Listen for wallet registration events
    const handleRegisterWallet = (event: any) => {
      const { detail: callback } = event;
      if (typeof callback === "function") {
        try {
          callback(api);
        } catch (error) {
          console.error("Error executing wallet registration callback:", error);
        }
      }
    };

    window.addEventListener(
      "wallet-standard:register-wallet",
      handleRegisterWallet
    );
    cleanupFunctions.push(() => {
      window.removeEventListener(
        "wallet-standard:register-wallet",
        handleRegisterWallet
      );
    });

    // Dispatch app ready event
    try {
      // Use CustomEvent instead of custom class to avoid constructor issues
      const appReadyEvent = new CustomEvent("wallet-standard:app-ready", {
        detail: api,
        bubbles: false,
        cancelable: false,
        composed: false,
      });
      window.dispatchEvent(appReadyEvent);
    } catch (error) {
      console.warn("Failed to dispatch app ready event:", error);
    }

    // Set up periodic check for delayed wallet registration
    const periodicCheck = setInterval(() => {
      try {
        // Re-dispatch app ready event to catch any wallets that registered late
        const appReadyEvent = new CustomEvent("wallet-standard:app-ready", {
          detail: api,
          bubbles: false,
          cancelable: false,
          composed: false,
        });
        window.dispatchEvent(appReadyEvent);
      } catch (error) {
        console.warn("Failed to dispatch periodic app ready event:", error);
      }
    }, 1000); // Check every second for the first 10 seconds

    // Clear periodic check after 10 seconds
    setTimeout(() => {
      clearInterval(periodicCheck);
    }, 10000);

    cleanupFunctions.push(() => {
      clearInterval(periodicCheck);
    });

  } catch (error) {
    console.error("Failed to initialize wallet detection:", error);
  }

  // Return cleanup function
  const cleanup = () => {
    cleanupFunctions.forEach((fn) => fn());
    registrationListeners.clear();
    walletDetectionInitialized = false;
  };

  registrationListeners.add(cleanup);
  return cleanup;
}
class AppReadyEvent extends Event implements WindowAppReadyEvent {
  readonly #detail: any;

  get detail() {
    return this.#detail;
  }

  get type() {
    return "wallet-standard:app-ready" as const;
  }

  constructor(api: any) {
    super("wallet-standard:app-ready", {
      bubbles: false,
      cancelable: false,
      composed: false,
    });
    this.#detail = api;
  }

  preventDefault(): never {
    throw new Error("preventDefault cannot be called");
  }

  stopImmediatePropagation(): never {
    throw new Error("stopImmediatePropagation cannot be called");
  }

  stopPropagation(): never {
    throw new Error("stopPropagation cannot be called");
  }
}

/**
 * Get detected wallet adapters merged with provided adapters
 * Now includes change listener support
 */
export function getDetectedWalletAdapters(
  providedAdapters: Adapter[] = []
): Adapter[] {
  const registry = getWalletRegistry();
  const detectedAdapters = registry.getAdapters();

  const adapterMap = new Map<string, Adapter>();

  providedAdapters.forEach((adapter) => {
    adapterMap.set(adapter.name, adapter);
  });

  detectedAdapters.forEach((adapter) => {
    if (!adapterMap.has(adapter.name)) {
      adapterMap.set(adapter.name, adapter);
    } else {
      // Warn about duplicate
      console.warn(
        `${adapter.name} was auto-detected as a Standard Wallet. ` +
          `The manually provided adapter for ${adapter.name} can be removed.`
      );
    }
  });

  return Array.from(adapterMap.values());
}

/**
 * Get only the detected wallet adapters from the registry
 */
export function getDetectedStandardWalletAdapters(): StandardWalletAdapter[] {
  const registry = getWalletRegistry();
  return registry.getAdapters();
}

/**
 * Add a listener for wallet registry changes
 * This allows React components to react to dynamically registered wallets
 */
export function addWalletRegistryChangeListener(
  listener: (adapters: StandardWalletAdapter[]) => void
): () => void {
  const registry = getWalletRegistry();
  return registry.addChangeListener(listener);
}

/**
 * Legacy window.navigator.wallets support
 */
export function initializeLegacyWalletSupport(): void {
  if (
    typeof window === "undefined" ||
    typeof window.navigator === "undefined"
  ) {
    return;
  }

  const registry = getWalletRegistry();

  // Support for deprecated window.navigator.wallets
  const legacyWallets: any[] = [];

  // Create push function that handles legacy wallet registration
  const push = (callback: any) => {
    if (typeof callback === "function") {
      const api = {
        register(wallet: Wallet): () => void {
          const typedWallet = wallet as TypedStandardWallet;
          registry.register(typedWallet);
          return () => registry.unregister(typedWallet);
        },
      };

      try {
        callback(api);
      } catch (error) {
        console.error("Error in legacy wallet registration:", error);
      }
    }

    // Maintain legacy array behavior
    legacyWallets.push(callback);
    return legacyWallets.length;
  };

  // Override push method
  legacyWallets.push = push;

  // Define legacy wallets property
  try {
    Object.defineProperty(window.navigator, "wallets", {
      value: legacyWallets,
      writable: false,
      enumerable: true,
      configurable: true,
    });
  } catch (error) {
    // Property might already exist
    const existingWallets = (window.navigator as any).wallets;
    if (Array.isArray(existingWallets)) {
      existingWallets.forEach((callback) => push(callback));
    }
  }
}

/**
 * Utility function to wait for wallet registration
 * This can be used when you need to wait for a specific wallet to be detected
 */
export function waitForWalletRegistration(
  walletName: string,
  timeout: number = 5000
): Promise<StandardWalletAdapter | null> {
  return new Promise((resolve) => {
    const registry = getWalletRegistry();
    
    // Check if wallet is already registered
    const existingAdapter = registry.getAdapter(walletName);
    if (existingAdapter) {
      resolve(existingAdapter);
      return;
    }

    // Set up timeout
    const timeoutId = setTimeout(() => {
      resolve(null);
    }, timeout);

    // Listen for wallet registration
    const removeListener = registry.addChangeListener((adapters) => {
      const adapter = adapters.find(a => a.name === walletName);
      if (adapter) {
        clearTimeout(timeoutId);
        removeListener();
        resolve(adapter);
      }
    });
  });
}
