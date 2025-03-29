// src/types.ts
var Environment = /* @__PURE__ */ ((Environment2) => {
  Environment2[Environment2["DESKTOP_WEB"] = 0] = "DESKTOP_WEB";
  Environment2[Environment2["MOBILE_WEB"] = 1] = "MOBILE_WEB";
  return Environment2;
})(Environment || {});

// src/standard/constants.ts
var SolanaMobileWalletAdapterWalletName = "Mobile Wallet Adapter";

// src/utils/environment.ts
import { WalletAdapterNetwork, WalletReadyState } from "@hermis/solana-headless-core";
var _userAgent;
function getUserAgent() {
  if (_userAgent === void 0) {
    _userAgent = typeof window !== "undefined" ? window.navigator?.userAgent ?? null : null;
  }
  return _userAgent;
}
function getUriForAppIdentity() {
  if (typeof window === "undefined") return void 0;
  const location = window.location;
  if (!location) return void 0;
  return `${location.protocol}//${location.host}`;
}
function isWebView(userAgentString) {
  return /(WebView|Version\/.+(Chrome)\/(\d+)\.(\d+)\.(\d+)\.(\d+)|; wv\).+(Chrome)\/(\d+)\.(\d+)\.(\d+)\.(\d+))/i.test(
    userAgentString
  );
}
function isIOS(userAgentString) {
  return /iphone|ipad|ipod/i.test(userAgentString);
}
function isAndroid(userAgentString) {
  return /android/i.test(userAgentString);
}
function isMobileDevice(userAgentString) {
  return (isAndroid(userAgentString) || isIOS(userAgentString)) && !isWebView(userAgentString);
}
function getEnvironment({ adapters, userAgentString }) {
  if (!userAgentString) {
    return 0 /* DESKTOP_WEB */;
  }
  if (isMobileDevice(userAgentString)) {
    return 1 /* MOBILE_WEB */;
  }
  if (adapters.some(
    (adapter) => adapter.name !== SolanaMobileWalletAdapterWalletName && adapter.readyState === WalletReadyState.Installed
  )) {
    return 0 /* DESKTOP_WEB */;
  }
  if (isAndroid(userAgentString) || isIOS(userAgentString)) {
    return 1 /* MOBILE_WEB */;
  }
  return 0 /* DESKTOP_WEB */;
}
function getIsMobile(adapters, userAgentString) {
  return getEnvironment({ adapters, userAgentString: userAgentString || getUserAgent() }) === 1 /* MOBILE_WEB */;
}
function isIosAndRedirectable() {
  if (typeof navigator === "undefined") return false;
  const userAgent = navigator.userAgent.toLowerCase();
  const isIos = userAgent.includes("iphone") || userAgent.includes("ipad");
  const isSafari = userAgent.includes("safari");
  return isIos && isSafari;
}
function getInferredNetworkFromEndpoint(endpoint) {
  if (!endpoint) {
    return WalletAdapterNetwork.Mainnet;
  }
  if (/devnet/i.test(endpoint)) {
    return WalletAdapterNetwork.Devnet;
  } else if (/testnet/i.test(endpoint)) {
    return WalletAdapterNetwork.Testnet;
  } else {
    return WalletAdapterNetwork.Mainnet;
  }
}

// src/utils/storage.ts
function createLocalStorageUtility(key, defaultValue) {
  return {
    async get() {
      try {
        if (typeof window === "undefined") return defaultValue;
        const value = window.localStorage.getItem(key);
        if (!value) return defaultValue;
        return JSON.parse(value);
      } catch (error) {
        console.error(`Error reading from localStorage:`, error);
        return defaultValue;
      }
    },
    async set(value) {
      try {
        if (typeof window === "undefined") return;
        if (value === null) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, JSON.stringify(value));
        }
      } catch (error) {
        console.error(`Error writing to localStorage:`, error);
      }
    }
  };
}

// src/core/adapters.ts
import { WalletReadyState as WalletReadyState2 } from "@hermis/solana-headless-core";
var _adapters = [];
var _selectedAdapter = null;
function initAdapters(adapters) {
  _adapters = adapters.filter((adapter) => adapter.readyState !== WalletReadyState2.Unsupported);
}
function selectAdapter(walletName) {
  if (!walletName) {
    _selectedAdapter = null;
    return null;
  }
  const adapter = _adapters.find((adapter2) => adapter2.name === walletName) || null;
  _selectedAdapter = adapter;
  return adapter;
}
function getSelectedAdapter() {
  return _selectedAdapter;
}
function getWalletAdapters(readyState) {
  let adapters = _adapters;
  if (readyState) {
    adapters = adapters.filter((adapter) => adapter.readyState === readyState);
  }
  return adapters.map((adapter) => ({
    adapter,
    name: adapter.name,
    icon: adapter.icon,
    url: adapter.url,
    readyState: adapter.readyState
  }));
}
function getAdaptersByReadyState(adapters, readyState) {
  return adapters.filter((adapter) => adapter.readyState === readyState);
}
function sortWalletAdapters(adapters) {
  const sortedAdapters = [...adapters];
  return sortedAdapters.sort((a, b) => {
    if (a.name === SolanaMobileWalletAdapterWalletName) return -1;
    if (b.name === SolanaMobileWalletAdapterWalletName) return 1;
    if (a.readyState === WalletReadyState2.Installed && b.readyState !== WalletReadyState2.Installed) {
      return -1;
    }
    if (a.readyState !== WalletReadyState2.Installed && b.readyState === WalletReadyState2.Installed) {
      return 1;
    }
    if (a.readyState === WalletReadyState2.Loadable && b.readyState !== WalletReadyState2.Loadable) {
      return -1;
    }
    if (a.readyState !== WalletReadyState2.Loadable && b.readyState === WalletReadyState2.Loadable) {
      return 1;
    }
    return 0;
  });
}
function addWalletAdapterEventListeners(adapter, handlers) {
  const { onConnect, onDisconnect, onError, onReadyStateChange } = handlers;
  if (onConnect) {
    adapter.on("connect", onConnect);
  }
  if (onDisconnect) {
    adapter.on("disconnect", onDisconnect);
  }
  if (onError) {
    adapter.on("error", onError);
  }
  if (onReadyStateChange) {
    adapter.on("readyStateChange", onReadyStateChange);
  }
  return () => {
    if (onConnect) {
      adapter.off("connect", onConnect);
    }
    if (onDisconnect) {
      adapter.off("disconnect", onDisconnect);
    }
    if (onError) {
      adapter.off("error", onError);
    }
    if (onReadyStateChange) {
      adapter.off("readyStateChange", onReadyStateChange);
    }
  };
}

// src/core/manager.ts
import { WalletReadyState as WalletReadyState3, EventEmitter, signTransaction, signAllTransactions, signMessage } from "@hermis/solana-headless-core";
function createWalletConnectionManager(adapters, localStorageKey = "walletName") {
  const storageUtil = createLocalStorageUtility(localStorageKey, null);
  let currentAdapter = null;
  storageUtil.get().then((storedWalletName) => {
    if (storedWalletName) {
      currentAdapter = adapters.find((a) => a.name === storedWalletName) || null;
    }
  });
  return {
    /**
     * Get the current adapter
     */
    getAdapter: () => currentAdapter,
    /**
     * Select an adapter by wallet name
     */
    selectWallet: (walletName) => {
      if (currentAdapter?.name === walletName) return currentAdapter;
      if (currentAdapter && currentAdapter.connected) {
        try {
          currentAdapter.disconnect();
        } catch (error) {
          console.error("Error disconnecting wallet:", error);
        }
      }
      if (!walletName) {
        currentAdapter = null;
        storageUtil.set(null);
        return null;
      }
      const adapter = adapters.find((a) => a.name === walletName) || null;
      currentAdapter = adapter;
      if (adapter) {
        storageUtil.set(walletName);
      } else {
        storageUtil.set(null);
      }
      return adapter;
    },
    /**
     * Connect to the selected wallet
     */
    connect: async () => {
      if (!currentAdapter) throw new Error("No wallet selected");
      if (!currentAdapter.connected) {
        await currentAdapter.connect();
      }
      return currentAdapter;
    },
    /**
     * Disconnect from the current wallet
     */
    disconnect: async () => {
      if (currentAdapter?.connected) {
        await currentAdapter.disconnect();
      }
    },
    /**
     * Auto-connect to the stored wallet
     */
    autoConnect: async () => {
      if (!currentAdapter) return null;
      try {
        await currentAdapter.autoConnect();
        return currentAdapter;
      } catch (error) {
        console.error("Error auto-connecting wallet:", error);
        return null;
      }
    }
  };
}
var WalletAdapterManager = class extends EventEmitter {
  constructor(adapters = [], localStorageKey = "walletName") {
    super();
    this.adapters = [];
    this.selectedAdapter = null;
    this.cleanupListeners = null;
    this.isHandlingError = false;
    this.adapters = adapters.filter((adapter) => adapter.readyState !== WalletReadyState3.Unsupported);
    this.storageUtil = createLocalStorageUtility(localStorageKey, null);
    this.storageUtil.get().then((storedWalletName) => {
      if (storedWalletName) {
        this.selectedAdapter = this.adapters.find((a) => a.name === storedWalletName) || null;
        if (this.selectedAdapter) {
          this.setupEventListeners();
        }
      }
    });
  }
  /**
   * Get all wallet adapters
   */
  getAdapters() {
    return this.adapters;
  }
  /**
   * Get the currently selected adapter
   */
  getSelectedAdapter() {
    return this.selectedAdapter;
  }
  /**
   * Select a wallet adapter by name
   */
  selectAdapter(walletName) {
    if (this.selectedAdapter?.name === walletName) return this.selectedAdapter;
    this.cleanupAdapterListeners();
    if (this.selectedAdapter && this.selectedAdapter.connected) {
      try {
        this.selectedAdapter.disconnect();
      } catch (error) {
        console.error("Error disconnecting wallet:", error);
      }
    }
    if (!walletName) {
      this.clearSelectedAdapter();
      return null;
    }
    const adapter = this.adapters.find((a) => a.name === walletName) || null;
    this.selectedAdapter = adapter;
    if (adapter) {
      this.setupEventListeners();
      this.storageUtil.set(walletName);
    } else {
      this.storageUtil.set(null);
    }
    this.emit("adapterChange", adapter);
    return adapter;
  }
  cleanupAdapterListeners() {
    if (this.cleanupListeners) {
      this.cleanupListeners();
      this.cleanupListeners = null;
    }
  }
  clearSelectedAdapter() {
    this.selectedAdapter = null;
    this.storageUtil.set(null);
    this.emit("adapterChange", null);
  }
  emitSafeError(error) {
    if (this.isHandlingError) return;
    try {
      this.isHandlingError = true;
      this.emit("error", error);
    } finally {
      setTimeout(() => {
        this.isHandlingError = false;
      }, 100);
    }
  }
  /**
   * Connect to the selected wallet
   */
  async connect() {
    if (!this.selectedAdapter) {
      return null;
    }
    try {
      if (!this.selectedAdapter.connected) {
        await this.selectedAdapter.connect();
      }
      return this.selectedAdapter;
    } catch (error) {
      this.emitSafeError(error);
      return null;
    }
  }
  /**
   * Disconnect from the current wallet
   */
  async disconnect() {
    if (this.selectedAdapter?.connected) {
      try {
        await this.selectedAdapter.disconnect();
        this.clearSelectedAdapter();
      } catch (error) {
        this.emitSafeError(error);
      }
    }
  }
  /**
   * Auto-connect to the stored wallet
   */
  async autoConnect() {
    if (!this.selectedAdapter) return null;
    try {
      await this.selectedAdapter.autoConnect();
      return this.selectedAdapter;
    } catch (error) {
      this.emitSafeError(error);
      return null;
    }
  }
  /**
   * Set up event listeners for the selected adapter
   * @private
   */
  setupEventListeners() {
    if (!this.selectedAdapter) return;
    this.cleanupListeners = addWalletAdapterEventListeners(this.selectedAdapter, {
      onConnect: (publicKey) => {
        this.emit("connect", publicKey);
      },
      onDisconnect: () => {
        this.emit("disconnect");
      },
      onError: (error) => {
        this.emitSafeError(error);
      },
      onReadyStateChange: (readyState) => {
        this.emit("readyStateChange", readyState);
      }
    });
  }
  /**
   * 
   * @param optional wallet adapter event 
   * @returns The class to manage wallet adapters with event emission
   */
  removeAllListeners(event) {
    super.removeAllListeners(event);
    return this;
  }
  /**
   * Clean up resources when no longer needed
   */
  dispose() {
    if (this.cleanupListeners) {
      this.cleanupListeners();
      this.cleanupListeners = null;
    }
    this.removeAllListeners();
  }
  async signTransaction(transaction) {
    if (!this.selectedAdapter) {
      this.emitSafeError("No Adapter connected");
      return null;
    }
    try {
      return await signTransaction(transaction, this.selectedAdapter);
    } catch (error) {
      this.emitSafeError(error);
      return null;
    }
  }
  async signAllTransaction(transaction) {
    if (!this.selectedAdapter) {
      this.emitSafeError("No Adapter connected");
      return null;
    }
    try {
      return await signAllTransactions(transaction, this.selectedAdapter);
    } catch (error) {
      this.emitSafeError(error);
      return null;
    }
  }
  async signMessage(message) {
    if (!this.selectedAdapter) {
      this.emitSafeError("No Adapter connected");
      return null;
    }
    try {
      return await signMessage(message, this.selectedAdapter);
    } catch (error) {
      this.emitSafeError(error);
      return null;
    }
  }
};

// src/standard/wallet-adapter.ts
import {
  WalletReadyState as WalletReadyState4,
  PublicKey as PublicKey3,
  Transaction as Transaction2,
  VersionedTransaction,
  WalletError,
  EventEmitter as EventEmitter2
} from "@hermis/solana-headless-core";

// src/standard/types.ts
var StandardConnectMethod = "standard:connect";
var StandardDisconnectMethod = "standard:disconnect";
var StandardEventsMethod = "standard:events";
var SolanaSignTransactionMethod = "solana:signTransaction";
var SolanaSignAndSendTransactionMethod = "solana:signAndSendTransaction";
var SolanaSignMessageMethod = "solana:signMessage";
var SolanaSignInMethod = "solana:signIn";

// src/standard/utils.ts
import {
  createDefaultAuthorizationResultCache,
  createDefaultWalletNotFoundHandler
} from "@solana-mobile/wallet-adapter-mobile";

// src/standard/adapter-factory.ts
function createStandardWalletAdapter(wallet) {
  return new StandardWalletAdapter(wallet);
}

// src/standard/utils.ts
function isWalletAdapterCompatibleStandardWallet(wallet) {
  if (!wallet || !wallet.features) return false;
  return (
    // Must have standard:connect feature
    StandardConnectMethod in wallet.features && // Must have standard:events feature
    StandardEventsMethod in wallet.features && // Must have either solana:signAndSendTransaction OR solana:signTransaction feature
    (SolanaSignAndSendTransactionMethod in wallet.features || SolanaSignTransactionMethod in wallet.features)
  );
}
async function createMobileWalletAdapter(endpoint) {
  if (typeof window === "undefined" || !window.navigator) {
    console.log("not in a browser");
    return null;
  }
  const {
    SolanaMobileWalletAdapter: SolanaMobileWalletAdapter2
  } = await import("@solana-mobile/wallet-adapter-mobile");
  try {
    console.log(SolanaMobileWalletAdapter2);
  } catch (error) {
    console.warn("Mobile wallet adapter not available:", error);
    console.log("null returned");
    return null;
  }
  if (!SolanaMobileWalletAdapter2) {
    console.log("null returned");
    return null;
  }
  try {
    console.log("Mobile wallet");
    const network = getInferredNetworkFromEndpoint(endpoint);
    const adapter = new SolanaMobileWalletAdapter2({
      addressSelector: {
        select: (addresses) => Promise.resolve(addresses[0])
        //   resolveImmediately: true,
      },
      appIdentity: {
        name: document.title || "Solana dApp",
        uri: getUriForAppIdentity() || window.location.href
      },
      authorizationResultCache: createDefaultAuthorizationResultCache(),
      cluster: network,
      onWalletNotFound: createDefaultWalletNotFoundHandler()
    });
    return adapter;
  } catch (error) {
    console.warn("Error creating mobile wallet adapter:", error);
    console.log("null returned");
    return null;
  }
}
async function getStandardWalletAdapters(existingAdapters = [], endpoint) {
  if (typeof window === "undefined" || !window.navigator) {
    return existingAdapters;
  }
  const userAgentString = getUserAgent();
  const adaptersToUse = [...existingAdapters];
  try {
    const isMobileEnv = getEnvironment({
      adapters: existingAdapters,
      userAgentString
    }) === 1 /* MOBILE_WEB */;
    const hasMobileWalletAdapter = existingAdapters.some(
      (adapter) => adapter.name === SolanaMobileWalletAdapterWalletName
    );
    if (isMobileEnv && !hasMobileWalletAdapter) {
      console.log("Created Mobile Adapter");
      const mobileAdapter = await createMobileWalletAdapter(endpoint);
      if (mobileAdapter) {
        adaptersToUse.unshift(mobileAdapter);
      }
    }
    const walletStandard = window.navigator.wallets;
    if (!walletStandard) {
      return adaptersToUse;
    }
    const standardWallets = walletStandard.get();
    const standardAdapters = standardWallets.filter(isWalletAdapterCompatibleStandardWallet).map((wallet) => {
      try {
        return createStandardWalletAdapter(wallet);
      } catch (error) {
        console.error("Error creating adapter for wallet:", wallet.name, error);
        return null;
      }
    }).filter(Boolean);
    const existingNames = new Set(adaptersToUse.map((a) => a.name));
    const uniqueStandardAdapters = standardAdapters.filter((a) => !existingNames.has(a.name));
    return [...adaptersToUse, ...uniqueStandardAdapters];
  } catch (error) {
    console.error("Error getting standard wallets:", error);
    return adaptersToUse;
  }
}
function isMobileWalletAdapter(adapter) {
  return adapter && "findWallets" in adapter;
}

// src/standard/wallet-adapter.ts
var StandardWalletAdapter = class {
  constructor(wallet) {
    this.readyState = WalletReadyState4.Installed;
    this._publicKey = null;
    this._connecting = false;
    this._eventEmitter = new EventEmitter2();
    this._removeAccountChangeListener = null;
    if (!isWalletAdapterCompatibleStandardWallet(wallet)) {
      throw new Error("Wallet is not adapter compatible");
    }
    this._wallet = wallet;
    this.name = wallet.name;
    this.url = wallet.website || "";
    this.icon = wallet.icon || "";
    if (SolanaSignTransactionMethod in wallet.features) {
      try {
        const feature = wallet.features[SolanaSignTransactionMethod];
        if (feature && feature.supportedTransactionVersions) {
          const versions = feature.supportedTransactionVersions;
          if (Array.isArray(versions)) {
            this.supportedTransactionVersions = new Set(versions);
          }
        }
      } catch (error) {
        console.warn("Error extracting supportedTransactionVersions from signTransaction feature", error);
      }
    } else if (SolanaSignAndSendTransactionMethod in wallet.features) {
      try {
        const feature = wallet.features[SolanaSignAndSendTransactionMethod];
        if (feature && feature.supportedTransactionVersions) {
          const versions = feature.supportedTransactionVersions;
          if (Array.isArray(versions)) {
            this.supportedTransactionVersions = new Set(versions);
          }
        }
      } catch (error) {
        console.warn("Error extracting supportedTransactionVersions from signAndSendTransaction feature", error);
      }
    }
    if (StandardEventsMethod in wallet.features) {
      try {
        const events = wallet.features[StandardEventsMethod];
        if (events && typeof events.on === "function") {
          this._removeAccountChangeListener = events.on("change", (event) => {
            try {
              if (!event || !event.accounts || !Array.isArray(event.accounts)) {
                console.warn("Invalid event data received from wallet", event);
                return;
              }
              const solanaAccount = event.accounts.find(
                (account) => account && account.features && Array.isArray(account.features) && account.features.includes("solana:publicKey")
              );
              if (solanaAccount) {
                try {
                  if (!solanaAccount.publicKey) {
                    console.warn("Account has no publicKey", solanaAccount);
                    return;
                  }
                  const publicKey = new PublicKey3(solanaAccount.publicKey);
                  if (!this._publicKey || !this._publicKey.equals(publicKey)) {
                    this._publicKey = publicKey;
                    this._eventEmitter.emit("connect", publicKey);
                  }
                } catch (error) {
                  console.error("Error creating PublicKey from account", error);
                  this._eventEmitter.emit("error", new WalletError("Invalid public key from wallet"));
                }
              } else if (this._publicKey) {
                this._publicKey = null;
                this._eventEmitter.emit("disconnect");
              }
            } catch (error) {
              console.error("Error handling wallet account change event", error);
              this._eventEmitter.emit("error", new WalletError("Error handling wallet event"));
            }
          });
        }
      } catch (error) {
        console.error("Error setting up account change listener", error);
      }
    }
  }
  get publicKey() {
    return this._publicKey;
  }
  get connecting() {
    return this._connecting;
  }
  get connected() {
    return !!this._publicKey;
  }
  // Standard EventEmitter interface implementation
  eventNames() {
    return this._eventEmitter.eventNames();
  }
  listeners(event) {
    return this._eventEmitter.listeners(event);
  }
  listenerCount(event) {
    return this._eventEmitter.listenerCount(event);
  }
  addListener(event, listener) {
    this._eventEmitter.addListener(event, listener);
    return this;
  }
  removeListener(event, listener) {
    this._eventEmitter.removeListener(event, listener);
    return this;
  }
  on(event, listener) {
    this._eventEmitter.on(event, listener);
    return this;
  }
  once(event, listener) {
    this._eventEmitter.once(event, listener);
    return this;
  }
  off(event, listener) {
    this._eventEmitter.off(event, listener);
    return this;
  }
  emit(event, ...args) {
    return this._eventEmitter.emit(event, ...args);
  }
  removeAllListeners(event) {
    this._eventEmitter.removeAllListeners(event);
    return this;
  }
  async autoConnect() {
    try {
      await this.connect();
    } catch (error) {
      console.error("Error in autoConnect", error);
      throw error;
    }
  }
  async connect() {
    try {
      if (this.connected || this.connecting) return;
      this._connecting = true;
      if (!(StandardConnectMethod in this._wallet.features)) {
        throw new Error("Wallet does not support connect feature");
      }
      const connectFeature = this._wallet.features[StandardConnectMethod];
      if (!connectFeature || typeof connectFeature.connect !== "function") {
        throw new Error("Wallet has invalid connect feature");
      }
      const connectResult = await connectFeature.connect();
      if (!connectResult || !connectResult.accounts || !Array.isArray(connectResult.accounts)) {
        throw new Error("Invalid connect result from wallet");
      }
      const solanaAccount = connectResult.accounts.find(
        (account) => account && account.features && Array.isArray(account.features) && account.features.includes("solana:publicKey")
      );
      if (!solanaAccount) {
        throw new Error("No Solana accounts found");
      }
      if (!solanaAccount.publicKey) {
        throw new Error("Solana account has no public key");
      }
      const publicKeyBytes = solanaAccount.publicKey;
      this._publicKey = new PublicKey3(publicKeyBytes);
      this._eventEmitter.emit("connect", this._publicKey);
    } catch (error) {
      console.error("Error connecting to wallet", error);
      this._eventEmitter.emit("error", error);
      throw error;
    } finally {
      this._connecting = false;
    }
  }
  async disconnect() {
    try {
      if (StandardDisconnectMethod in this._wallet.features) {
        const disconnectFeature = this._wallet.features[StandardDisconnectMethod];
        if (disconnectFeature && typeof disconnectFeature.disconnect === "function") {
          try {
            await disconnectFeature.disconnect();
          } catch (error) {
            console.error("Error disconnecting wallet", error);
            this._eventEmitter.emit("error", error);
          }
        }
      }
      if (this._publicKey) {
        this._publicKey = null;
        this._eventEmitter.emit("disconnect");
      }
      if (this._removeAccountChangeListener) {
        try {
          this._removeAccountChangeListener();
        } catch (error) {
          console.error("Error removing account change listener", error);
        }
        this._removeAccountChangeListener = null;
      }
    } catch (error) {
      console.error("Error in disconnect", error);
      this._eventEmitter.emit("error", error);
      throw error;
    }
  }
  async sendTransaction(transaction, connection, options = {}) {
    if (!this.connected) throw new Error("Wallet not connected");
    try {
      if (SolanaSignAndSendTransactionMethod in this._wallet.features) {
        const feature = this._wallet.features[SolanaSignAndSendTransactionMethod];
        if (!feature || typeof feature.signAndSendTransaction !== "function") {
          throw new Error("Wallet has invalid signAndSendTransaction feature");
        }
        if (transaction instanceof Transaction2) {
          transaction.feePayer = this.publicKey;
          const { blockhash } = await connection.getLatestBlockhash(options.preflightCommitment);
          transaction.recentBlockhash = blockhash;
        }
        let transactionBytes;
        try {
          transactionBytes = transaction instanceof Transaction2 ? transaction.serialize({ verifySignatures: false }) : transaction.serialize();
        } catch (error) {
          console.error("Error serializing transaction", error);
          throw new Error("Failed to serialize transaction");
        }
        const result = await feature.signAndSendTransaction({
          transaction: transactionBytes,
          chain: { id: "solana:" + (connection.rpcEndpoint || "mainnet-beta") },
          options
        });
        if (!result || !result.signature) {
          throw new Error("No signature returned from signAndSendTransaction");
        }
        let signatureBase64;
        try {
          if (typeof window !== "undefined") {
            signatureBase64 = btoa(String.fromCharCode.apply(
              null,
              Array.from(new Uint8Array(result.signature))
            ));
          } else {
            signatureBase64 = Buffer.from(result.signature).toString("base64");
          }
        } catch (error) {
          console.error("Error encoding signature", error);
          throw new Error("Failed to encode transaction signature");
        }
        return signatureBase64;
      } else if (SolanaSignTransactionMethod in this._wallet.features) {
        const signedTransaction = await this.signTransaction(transaction);
        const rawTransaction = signedTransaction instanceof Transaction2 ? signedTransaction.serialize() : signedTransaction.serialize();
        return await connection.sendRawTransaction(rawTransaction, options);
      } else {
        throw new Error("Wallet does not support sending transactions");
      }
    } catch (error) {
      console.error("Error in sendTransaction", error);
      this._eventEmitter.emit("error", error);
      throw error;
    }
  }
  async signTransaction(transaction) {
    if (!this.connected) throw new Error("Wallet not connected");
    try {
      if (!(SolanaSignTransactionMethod in this._wallet.features)) {
        throw new Error("Wallet does not support signing transactions");
      }
      const feature = this._wallet.features[SolanaSignTransactionMethod];
      if (!feature || typeof feature.signTransaction !== "function") {
        throw new Error("Wallet has invalid signTransaction feature");
      }
      if (transaction instanceof Transaction2 && !transaction.feePayer) {
        transaction.feePayer = this.publicKey;
      }
      let transactionBytes;
      try {
        transactionBytes = transaction instanceof Transaction2 ? transaction.serialize({ verifySignatures: false }) : transaction.serialize();
      } catch (error) {
        console.error("Error serializing transaction for signing", error);
        throw new Error("Failed to serialize transaction for signing");
      }
      const result = await feature.signTransaction({
        transaction: transactionBytes
      });
      if (!result || !result.signedTransaction) {
        throw new Error("No signed transaction returned from wallet");
      }
      try {
        if (transaction instanceof Transaction2) {
          return Transaction2.from(result.signedTransaction);
        } else {
          return VersionedTransaction.deserialize(result.signedTransaction);
        }
      } catch (error) {
        console.error("Error deserializing signed transaction", error);
        throw new Error("Failed to deserialize signed transaction");
      }
    } catch (error) {
      console.error("Error in signTransaction", error);
      this._eventEmitter.emit("error", error);
      throw error;
    }
  }
  async signAllTransactions(transactions) {
    if (!this.connected) throw new Error("Wallet not connected");
    try {
      const signedTransactions = [];
      for (const transaction of transactions) {
        signedTransactions.push(await this.signTransaction(transaction));
      }
      return signedTransactions;
    } catch (error) {
      console.error("Error in signAllTransactions", error);
      this._eventEmitter.emit("error", error);
      throw error;
    }
  }
  async signMessage(message) {
    if (!this.connected) throw new Error("Wallet not connected");
    try {
      if (!(SolanaSignMessageMethod in this._wallet.features)) {
        throw new Error("Wallet does not support signing messages");
      }
      const feature = this._wallet.features[SolanaSignMessageMethod];
      if (!feature || typeof feature.signMessage !== "function") {
        throw new Error("Wallet has invalid signMessage feature");
      }
      const result = await feature.signMessage({
        message
      });
      if (!result || !result.signature) {
        throw new Error("No signature returned from signMessage");
      }
      return result.signature;
    } catch (error) {
      console.error("Error in signMessage", error);
      this._eventEmitter.emit("error", error);
      throw error;
    }
  }
  async signIn(input) {
    if (!this.connected) throw new Error("Wallet not connected");
    try {
      if (!(SolanaSignInMethod in this._wallet.features)) {
        throw new Error("Wallet does not support sign in");
      }
      const feature = this._wallet.features[SolanaSignInMethod];
      if (!feature || typeof feature.signIn !== "function") {
        throw new Error("Wallet has invalid signIn feature");
      }
      return await feature.signIn(input);
    } catch (error) {
      console.error("Error in signIn", error);
      this._eventEmitter.emit("error", error);
      throw error;
    }
  }
};
export {
  Environment,
  SolanaMobileWalletAdapterWalletName,
  SolanaSignAndSendTransactionMethod,
  SolanaSignInMethod,
  SolanaSignMessageMethod,
  SolanaSignTransactionMethod,
  StandardConnectMethod,
  StandardDisconnectMethod,
  StandardEventsMethod,
  StandardWalletAdapter,
  WalletAdapterManager,
  addWalletAdapterEventListeners,
  createLocalStorageUtility,
  createMobileWalletAdapter,
  createWalletConnectionManager,
  getAdaptersByReadyState,
  getEnvironment,
  getInferredNetworkFromEndpoint,
  getIsMobile,
  getSelectedAdapter,
  getStandardWalletAdapters,
  getUriForAppIdentity,
  getUserAgent,
  getWalletAdapters,
  initAdapters,
  isAndroid,
  isIOS,
  isIosAndRedirectable,
  isMobileDevice,
  isMobileWalletAdapter,
  isWalletAdapterCompatibleStandardWallet,
  selectAdapter,
  sortWalletAdapters
};
//# sourceMappingURL=index.js.map