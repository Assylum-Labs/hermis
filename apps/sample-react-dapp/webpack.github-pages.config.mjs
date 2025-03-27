import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// This is needed to get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

export default {
  mode: 'production',
  entry: './src/main.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
    publicPath: '/solana-headless-sdk/'
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.jsx'],
    // New enhanced alias configuration to handle .js extensions
    alias: {
      // These match specific patterns we're seeing in the errors
      './providers/WalletProvider.js': path.resolve(__dirname, '../../packages/react-core/src/providers/WalletProvider.ts'),
      './providers/ConnectionProvider.js': path.resolve(__dirname, '../../packages/react-core/src/providers/ConnectionProvider.ts'),
      './components/ContextProvider.js': path.resolve(__dirname, '../../packages/react-core/src/components/ContextProvider.ts'),
      './components/WalletConnectionManager.js': path.resolve(__dirname, '../../packages/react-core/src/components/WalletConnectionManager.ts'),
      './components/AgatehProvider.js': path.resolve(__dirname, '../../packages/react-core/src/components/AgatehProvider.ts'),
      
      // These are your main package aliases
      '@agateh/solana-headless-react': path.resolve(__dirname, '../../packages/react-core/src'),
      '@agateh/solana-headless-core': path.resolve(__dirname, '../../packages/core/src'),
      '@agateh/solana-headless-adapter-base': path.resolve(__dirname, '../../packages/adapter-base/src'),
      
      // General .js to .ts mappings for imported files
      // This is a simple but effective approach - map any .js in these directories to .ts
      '../../packages/core/src/': path.resolve(__dirname, '../../packages/core/src/'),
      '../../packages/react-core/src/': path.resolve(__dirname, '../../packages/react-core/src/'),
      '../../packages/adapter-base/src/': path.resolve(__dirname, '../../packages/adapter-base/src/')
    },
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/index.js')
    }
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        include: [
          path.resolve(__dirname, 'src'),
          path.resolve(__dirname, '../../packages/react-core/src'),
          path.resolve(__dirname, '../../packages/core/src'),
          path.resolve(__dirname, '../../packages/adapter-base/src')
        ],
        use: [
          {
            loader: 'swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                  tsx: true
                },
                transform: {
                  react: {
                    runtime: 'automatic'
                  }
                }
              }
            }
          },
          // Add a loader to transform imports
          {
            loader: 'string-replace-loader',
            options: {
              search: /from ['"]([^'"]+)\.js['"]/g,
              replace: 'from "$1"',
              flags: 'g'
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new NodePolyfillPlugin(),
    new HtmlWebpackPlugin({
      template: './index.html',
      filename: 'index.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: './src/index.css', to: 'styles.css' },
      ],
    }),
  ],
  devtool: 'source-map'
};