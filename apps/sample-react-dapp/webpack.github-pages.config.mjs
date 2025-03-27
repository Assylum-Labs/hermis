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
    alias: {
      '@agateh/solana-headless-react': path.resolve(__dirname, '../../packages/react-core/src'),
      '@agateh/solana-headless-core': path.resolve(__dirname, '../../packages/core/src'),
      '@agateh/solana-headless-adapter-base': path.resolve(__dirname, '../../packages/adapter-base/src')
    },
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/index.js')
    },
    // Add this plugin to resolve .js extensions to .ts files
    plugins: [
      {
        apply(resolver) {
          // This is called for every path that is resolved
          resolver.hooks.resolve.tapAsync('JsToTsResolver', (request, resolveContext, callback) => {
            // Check if this is a .js file
            if (request.request && request.request.endsWith('.js')) {
              // Create a new request with .ts extension
              const tsRequest = Object.assign({}, request, {
                request: request.request.replace(/\.js$/, '.ts')
              });
              
              // Try to resolve the .ts file first
              resolver.doResolve(
                resolver.hooks.resolve,
                tsRequest,
                `Resolving ${request.request} to ${tsRequest.request}`,
                resolveContext,
                (err, result) => {
                  if (err || !result) {
                    // If .ts resolution fails, continue with original request
                    callback(null);
                  } else {
                    // If .ts resolution succeeds, use that result
                    callback(null, result);
                  }
                }
              );
            } else {
              // Not a .js file, continue normal resolution
              callback(null);
            }
          });
        }
      }
    ]
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
        use: {
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