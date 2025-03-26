export default {
    preset: "ts-jest",
    // testEnvironment: "jsdom",
    testEnvironment: '<rootDir>/jest-environment.cjs',
    extensionsToTreatAsEsm: [
      ".ts"
    ],
    moduleNameMapper: { 
      "^@agateh/solana-headless-core/(.*)$": "<rootDir>/../core/src/$1",
      "^@agateh/solana-headless-core$": "<rootDir>/../core/src/index.ts",
      "@solana/web3\\.js$": '<rootDir>/__mocks__/@solana/web3.js',
      "^(\\.{1,2}/.*)\\.js$": "$1"
    },
    roots: [
      "<rootDir>/src/",
      "<rootDir>/__tests__/"
    ],
    transform: {
      '^.+\\.tsx?$': ['ts-jest', { useESM: true }]
    },
    transformIgnorePatterns: [
      '/node_modules/(?!(uuid|@solana|superstruct|bs58|jayson|@noble|eventemitter3)/)'
    ],
    testRegex: "(/__tests__/.*\\.(test|spec))\\.[jt]sx?$",
    moduleFileExtensions: [
      "ts",
      "tsx",
      "js",
      "jsx",
      "json",
      "node"
    ],
    setupFilesAfterEnv: [
      "./jest.setup.ts"
    ]
}