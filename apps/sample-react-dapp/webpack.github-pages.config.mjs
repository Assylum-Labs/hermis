import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import webpack from 'webpack';  // Add this import

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
    alias: {
      // Fix for @solana/web3 truncated imports
      '@solana/web3': '@solana/web3.js',
      
      // Fix for the polyfills import
      './polyfills/index.js': path.resolve(__dirname, '../../packages/core/src/polyfills/index.ts'),
      
      // Your package aliases
      '@agateh/solana-headless-react': path.resolve(__dirname, '../../packages/react-core/src'),
      '@agateh/solana-headless-core': path.resolve(__dirname, '../../packages/core/src'),
      '@agateh/solana-headless-adapter-base': path.resolve(__dirname, '../../packages/adapter-base/src')
    },
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/index.js'),
      // Add these Node.js polyfills that @solana/web3.js might need
      fs: false,
      path: require.resolve('path-browserify'),
      os: require.resolve('os-browserify/browser'),
      zlib: require.resolve('browserify-zlib'),
      https: require.resolve('https-browserify'),
      http: require.resolve('stream-http'),
      assert: require.resolve('assert/'),
      constants: require.resolve('constants-browserify'),
      util: require.resolve('util/'),
      url: require.resolve('url/')
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
          }
        ]
      },
      // Add a loader to handle .js extensions in imports
      {
        test: /\.(ts|tsx|js|jsx)$/,
        include: [
          path.resolve(__dirname, '../../packages/core/src'),
          path.resolve(__dirname, '../../packages/react-core/src'),
          path.resolve(__dirname, '../../packages/adapter-base/src')
        ],
        use: [
          {
            loader: 'string-replace-loader',
            options: {
              multiple: [
                {
                  search: /from\s+['"]([^'"]+)\.js['"]/g,
                  replace: 'from "$1"'
                },
                {
                  search: /import\s+(['"])@solana\/web3\1/g,
                  replace: 'import $1@solana/web3.js$1'
                },
                {
                  search: /from\s+(['"])@solana\/web3\1/g,
                  replace: 'from $1@solana/web3.js$1'
                }
              ]
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
    // Provide Buffer for browser
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    })
  ],
  devtool: 'source-map'
};