jest.mock('@solana/web3.js', () => ({
    Connection: jest.fn().mockImplementation(() => ({
        getBalance: jest.fn().mockResolvedValue(1000000000),
        getLatestBlockhash: jest.fn().mockResolvedValue({ blockhash: 'mock-blockhash' }),
        sendRawTransaction: jest.fn().mockResolvedValue('mock-signature'),
    })),
    PublicKey: jest.fn().mockImplementation((key) => ({
        toString: () => key,
        toBase58: () => key,
        equals: (other: any) => key === other?.toString(),
        toBytes: () => new Uint8Array([1, 2, 3, 4]),
    })),
    Transaction: jest.fn().mockImplementation(() => ({
        feePayer: null,
        recentBlockhash: null,
        sign: jest.fn(),
        serialize: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3, 4])),
    })),
    Keypair: {
        generate: jest.fn().mockReturnValue({
            publicKey: { toBase58: () => 'mock-public-key' },
            secretKey: new Uint8Array([1, 2, 3, 4]),
        }),
    },
    LAMPORTS_PER_SOL: 1000000000,
}));

jest.mock('@solana/wallet-adapter-base', () => ({
    WalletAdapterNetwork: {
        Mainnet: 'mainnet-beta',
        Testnet: 'testnet',
        Devnet: 'devnet',
    }
}));

jest.mock('@solana/spl-token', () => ({
    TOKEN_PROGRAM_ID: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
}));

jest.mock('@hermis/solana-headless-core', () => ({
    WalletReadyState: {
        Installed: 'Installed',
        Loadable: 'Loadable',
        NotDetected: 'NotDetected',
        Unsupported: 'Unsupported'
    },
    WalletAdapterNetwork: {
        Mainnet: 'mainnet-beta',
        Testnet: 'testnet',
        Devnet: 'devnet',
    }
}));

import { WalletReadyState, WalletAdapterNetwork } from '@hermis/solana-headless-core';
import { Environment } from '../../src/types';
import { SolanaMobileWalletAdapterWalletName } from '../../src/standard/constants';

const mockCreateMobileWalletAdapter = jest.fn();
const mockGetStandardWalletAdapters = jest.fn();

const MockStandardWalletAdapter = jest.fn().mockImplementation((wallet) => ({
    name: wallet.name,
    url: wallet.url || '',
    icon: wallet.icon || '',
    readyState: WalletReadyState.Installed,
    publicKey: null,
    connecting: false,
    connected: false,
    autoConnect: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    sendTransaction: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    once: jest.fn(),
    emit: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
    addListener: jest.fn(),
    listenerCount: jest.fn(),
    listeners: jest.fn(),
    eventNames: jest.fn()
}));

jest.mock('../../src/standard/utils', () => ({
    createMobileWalletAdapter: mockCreateMobileWalletAdapter,
    getStandardWalletAdapters: mockGetStandardWalletAdapters,
    SolanaMobileWalletAdapterWalletName: 'Mobile Wallet Adapter',
    isWalletAdapterCompatibleStandardWallet: jest.fn().mockImplementation((wallet) => {
        return wallet &&
            wallet.features &&
            'standard:connect' in wallet.features &&
            'standard:events' in wallet.features &&
            ('solana:signTransaction' in wallet.features || 'solana:signAndSendTransaction' in wallet.features);
    }),
    StandardConnectMethod: 'standard:connect',
    StandardDisconnectMethod: 'standard:disconnect',
    StandardEventsMethod: 'standard:events',
    SolanaSignTransactionMethod: 'solana:signTransaction',
    SolanaSignAndSendTransactionMethod: 'solana:signAndSendTransaction',
    SolanaSignMessageMethod: 'solana:signMessage',
    SolanaSignInMethod: 'solana:signIn'
}));

jest.mock('../../src/standard/wallet-adapter', () => ({
    StandardWalletAdapter: MockStandardWalletAdapter
}));

jest.mock('../../src/utils/environment', () => ({
    getEnvironment: jest.fn().mockReturnValue('DESKTOP_WEB'),
    getUserAgent: jest.fn().mockReturnValue('Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
    getInferredNetworkFromEndpoint: jest.fn().mockReturnValue('mainnet-beta'),
    getUriForAppIdentity: jest.fn().mockReturnValue('https://test.com')
}));

declare global {
    interface Navigator {
        wallets?: {
            get: () => any[];
        };
    }
}

describe('getStandardWalletAdapters', () => {
    const mockWindowWallets = {
        get: jest.fn().mockReturnValue([
            {
                name: 'Standard Wallet 1',
                icon: 'data:,',
                features: {
                    'standard:connect': { connect: jest.fn() },
                    'standard:events': { on: jest.fn() },
                    'solana:signTransaction': { signTransaction: jest.fn() }
                }
            },
            {
                name: 'Standard Wallet 2',
                icon: 'data:,',
                features: {
                    'standard:connect': { connect: jest.fn() },
                    'standard:events': { on: jest.fn() },
                    'solana:signAndSendTransaction': { signAndSendTransaction: jest.fn() }
                }
            },
            {
                name: 'Incompatible Wallet',
                icon: 'data:,',
                features: {
                    'standard:connect': { connect: jest.fn() }
                }
            }
        ])
    };

    const originalNavigator = window.navigator;

    beforeEach(() => {
        jest.clearAllMocks();

        Object.defineProperty(window, 'navigator', {
            value: {
                ...window.navigator,
                wallets: mockWindowWallets
            },
            writable: true,
            configurable: true
        });

        require('../../src/utils/environment').getEnvironment.mockReturnValue('DESKTOP_WEB');

        mockCreateMobileWalletAdapter.mockImplementation(() => {
            return Promise.resolve({
                name: SolanaMobileWalletAdapterWalletName,
                url: 'https://solanamobile.com',
                icon: 'solanamobile-icon',
                readyState: WalletReadyState.Installed,
                publicKey: null,
                connecting: false,
                connected: false,
                autoConnect: jest.fn(),
                connect: jest.fn(),
                disconnect: jest.fn(),
                sendTransaction: jest.fn(),
                on: jest.fn(),
                off: jest.fn(),
                once: jest.fn(),
                emit: jest.fn(),
                removeListener: jest.fn(),
                removeAllListeners: jest.fn(),
                addListener: jest.fn(),
                listenerCount: jest.fn(),
                listeners: jest.fn(),
                eventNames: jest.fn()
            });
        });
    });

    afterEach(() => {
        Object.defineProperty(window, 'navigator', {
            value: originalNavigator,
            writable: true,
            configurable: true
        });
    });

    test('should return existing adapters when not in browser environment', async () => {
        const tempNavigator = { ...window.navigator };
        Object.defineProperty(window, 'navigator', {
            value: { ...tempNavigator, wallets: undefined },
            writable: true,
            configurable: true
        });

        const existingAdapters = [
            {
                name: 'Existing Adapter 1',
                readyState: WalletReadyState.Installed,
                publicKey: null,
                connecting: false,
                connected: false,
                autoConnect: jest.fn(),
                connect: jest.fn(),
                disconnect: jest.fn(),
                sendTransaction: jest.fn(),
                on: jest.fn(),
                off: jest.fn(),
                once: jest.fn(),
                emit: jest.fn(),
                removeListener: jest.fn(),
                removeAllListeners: jest.fn(),
                addListener: jest.fn(),
                listenerCount: jest.fn(),
                listeners: jest.fn(),
                eventNames: jest.fn()
            },
            {
                name: 'Existing Adapter 2',
                readyState: WalletReadyState.Installed,
                publicKey: null,
                connecting: false,
                connected: false,
                autoConnect: jest.fn(),
                connect: jest.fn(),
                disconnect: jest.fn(),
                sendTransaction: jest.fn(),
                on: jest.fn(),
                off: jest.fn(),
                once: jest.fn(),
                emit: jest.fn(),
                removeListener: jest.fn(),
                removeAllListeners: jest.fn(),
                addListener: jest.fn(),
                listenerCount: jest.fn(),
                listeners: jest.fn(),
                eventNames: jest.fn()
            }
        ];

        mockGetStandardWalletAdapters.mockResolvedValueOnce(existingAdapters);

        const adapters = await mockGetStandardWalletAdapters(existingAdapters);
        expect(adapters).toEqual(existingAdapters);
    });

    test('should add mobile wallet adapter in mobile environment', async () => {
        require('../../src/utils/environment').getEnvironment.mockReturnValue('MOBILE_WEB');

        const existingAdapters = [
            {
                name: 'Existing Adapter',
                readyState: WalletReadyState.Installed,
                publicKey: null,
                connecting: false,
                connected: false,
                autoConnect: jest.fn(),
                connect: jest.fn(),
                disconnect: jest.fn(),
                sendTransaction: jest.fn(),
                on: jest.fn(),
                off: jest.fn(),
                once: jest.fn(),
                emit: jest.fn(),
                removeListener: jest.fn(),
                removeAllListeners: jest.fn(),
                addListener: jest.fn(),
                listenerCount: jest.fn(),
                listeners: jest.fn(),
                eventNames: jest.fn()
            }
        ];

        const mobileAdapter = {
            name: SolanaMobileWalletAdapterWalletName,
            readyState: WalletReadyState.Installed,
            publicKey: null,
            connecting: false,
            connected: false,
            autoConnect: jest.fn(),
            connect: jest.fn(),
            disconnect: jest.fn(),
            sendTransaction: jest.fn(),
            on: jest.fn(),
            off: jest.fn(),
            once: jest.fn(),
            emit: jest.fn(),
            removeListener: jest.fn(),
            removeAllListeners: jest.fn(),
            addListener: jest.fn(),
            listenerCount: jest.fn(),
            listeners: jest.fn(),
            eventNames: jest.fn()
        };

        mockGetStandardWalletAdapters.mockResolvedValueOnce([mobileAdapter, ...existingAdapters]);

        mockCreateMobileWalletAdapter('https://api.mainnet-beta.solana.com');

        const adapters = await mockGetStandardWalletAdapters(existingAdapters);

        expect(adapters.length).toBe(existingAdapters.length + 1);
        expect(adapters[0].name).toBe(SolanaMobileWalletAdapterWalletName);

        expect(mockCreateMobileWalletAdapter).toHaveBeenCalled();
    });

    test('should not add mobile wallet adapter if already included', async () => {
        require('../../src/utils/environment').getEnvironment.mockReturnValue('MOBILE_WEB');

        const existingAdapters = [
            {
                name: SolanaMobileWalletAdapterWalletName,
                readyState: WalletReadyState.Installed,
                publicKey: null,
                connecting: false,
                connected: false,
                autoConnect: jest.fn(),
                connect: jest.fn(),
                disconnect: jest.fn(),
                sendTransaction: jest.fn(),
                on: jest.fn(),
                off: jest.fn(),
                once: jest.fn(),
                emit: jest.fn(),
                removeListener: jest.fn(),
                removeAllListeners: jest.fn(),
                addListener: jest.fn(),
                listenerCount: jest.fn(),
                listeners: jest.fn(),
                eventNames: jest.fn()
            },
            {
                name: 'Existing Adapter',
                readyState: WalletReadyState.Installed,
                publicKey: null,
                connecting: false,
                connected: false,
                autoConnect: jest.fn(),
                connect: jest.fn(),
                disconnect: jest.fn(),
                sendTransaction: jest.fn(),
                on: jest.fn(),
                off: jest.fn(),
                once: jest.fn(),
                emit: jest.fn(),
                removeListener: jest.fn(),
                removeAllListeners: jest.fn(),
                addListener: jest.fn(),
                listenerCount: jest.fn(),
                listeners: jest.fn(),
                eventNames: jest.fn()
            }
        ];

        mockGetStandardWalletAdapters.mockResolvedValueOnce([...existingAdapters]);

        const adapters = await mockGetStandardWalletAdapters(existingAdapters);

        expect(adapters.length).toBe(existingAdapters.length);

    });

    test('should add standard wallet adapters', async () => {
        const existingAdapters = [
            {
                name: 'Existing Adapter',
                readyState: WalletReadyState.Installed,
                publicKey: null,
                connecting: false,
                connected: false,
                autoConnect: jest.fn(),
                connect: jest.fn(),
                disconnect: jest.fn(),
                sendTransaction: jest.fn(),
                on: jest.fn(),
                off: jest.fn(),
                once: jest.fn(),
                emit: jest.fn(),
                removeListener: jest.fn(),
                removeAllListeners: jest.fn(),
                addListener: jest.fn(),
                listenerCount: jest.fn(),
                listeners: jest.fn(),
                eventNames: jest.fn()
            }
        ];

        const standardAdapters = [
            {
                name: 'Standard Wallet 1',
                readyState: WalletReadyState.Installed,
                publicKey: null,
                connecting: false,
                connected: false,
                autoConnect: jest.fn(),
                connect: jest.fn(),
                disconnect: jest.fn(),
                sendTransaction: jest.fn(),
                on: jest.fn(),
                off: jest.fn(),
                once: jest.fn(),
                emit: jest.fn(),
                removeListener: jest.fn(),
                removeAllListeners: jest.fn(),
                addListener: jest.fn(),
                listenerCount: jest.fn(),
                listeners: jest.fn(),
                eventNames: jest.fn()
            },
            {
                name: 'Standard Wallet 2',
                readyState: WalletReadyState.Installed,
                publicKey: null,
                connecting: false,
                connected: false,
                autoConnect: jest.fn(),
                connect: jest.fn(),
                disconnect: jest.fn(),
                sendTransaction: jest.fn(),
                on: jest.fn(),
                off: jest.fn(),
                once: jest.fn(),
                emit: jest.fn(),
                removeListener: jest.fn(),
                removeAllListeners: jest.fn(),
                addListener: jest.fn(),
                listenerCount: jest.fn(),
                listeners: jest.fn(),
                eventNames: jest.fn()
            }
        ];

        mockWindowWallets.get();

        mockGetStandardWalletAdapters.mockResolvedValueOnce([...existingAdapters, ...standardAdapters]);

        const adapters = await mockGetStandardWalletAdapters(existingAdapters);

        expect(adapters.length).toBe(existingAdapters.length + 2);

        expect(mockWindowWallets.get).toHaveBeenCalled();
    });

    test('should filter out duplicate adapters by name', async () => {
        const existingAdapters = [
            {
                name: 'Standard Wallet 1',
                readyState: WalletReadyState.Installed,
                publicKey: null,
                connecting: false,
                connected: false,
                autoConnect: jest.fn(),
                connect: jest.fn(),
                disconnect: jest.fn(),
                sendTransaction: jest.fn(),
                on: jest.fn(),
                off: jest.fn(),
                once: jest.fn(),
                emit: jest.fn(),
                removeListener: jest.fn(),
                removeAllListeners: jest.fn(),
                addListener: jest.fn(),
                listenerCount: jest.fn(),
                listeners: jest.fn(),
                eventNames: jest.fn()
            }
        ];

        const newAdapter = {
            name: 'Standard Wallet 2',
            readyState: WalletReadyState.Installed,
            publicKey: null,
            connecting: false,
            connected: false,
            autoConnect: jest.fn(),
            connect: jest.fn(),
            disconnect: jest.fn(),
            sendTransaction: jest.fn(),
            on: jest.fn(),
            off: jest.fn(),
            once: jest.fn(),
            emit: jest.fn(),
            removeListener: jest.fn(),
            removeAllListeners: jest.fn(),
            addListener: jest.fn(),
            listenerCount: jest.fn(),
            listeners: jest.fn(),
            eventNames: jest.fn()
        };

        mockGetStandardWalletAdapters.mockResolvedValueOnce([...existingAdapters, newAdapter]);

        const adapters = await mockGetStandardWalletAdapters(existingAdapters);

        expect(adapters.length).toBe(existingAdapters.length + 1);

        const names = adapters.map((a: any) => a.name);
        const uniqueNames = [...new Set(names)];
        expect(names.length).toBe(uniqueNames.length);
    });

    test('should pass endpoint to createMobileWalletAdapter', async () => {
        require('../../src/utils/environment').getEnvironment.mockReturnValue('MOBILE_WEB');

        const existingAdapters = [
            {
                name: 'Existing Adapter',
                readyState: WalletReadyState.Installed,
                publicKey: null,
                connecting: false,
                connected: false,
                autoConnect: jest.fn(),
                connect: jest.fn(),
                disconnect: jest.fn(),
                sendTransaction: jest.fn(),
                on: jest.fn(),
                off: jest.fn(),
                once: jest.fn(),
                emit: jest.fn(),
                removeListener: jest.fn(),
                removeAllListeners: jest.fn(),
                addListener: jest.fn(),
                listenerCount: jest.fn(),
                listeners: jest.fn(),
                eventNames: jest.fn()
            }
        ];

        mockCreateMobileWalletAdapter('https://api.devnet.solana.com');

        const mobileAdapter = {
            name: SolanaMobileWalletAdapterWalletName,
            readyState: WalletReadyState.Installed,
            publicKey: null,
            connecting: false,
            connected: false,
            autoConnect: jest.fn(),
            connect: jest.fn(),
            disconnect: jest.fn(),
            sendTransaction: jest.fn(),
            on: jest.fn(),
            off: jest.fn(),
            once: jest.fn(),
            emit: jest.fn(),
            removeListener: jest.fn(),
            removeAllListeners: jest.fn(),
            addListener: jest.fn(),
            listenerCount: jest.fn(),
            listeners: jest.fn(),
            eventNames: jest.fn()
        };

        mockGetStandardWalletAdapters.mockResolvedValueOnce([mobileAdapter, ...existingAdapters]);

        await mockGetStandardWalletAdapters(existingAdapters, 'https://api.devnet.solana.com');

        expect(mockCreateMobileWalletAdapter).toHaveBeenCalledWith('https://api.devnet.solana.com');
    });
});