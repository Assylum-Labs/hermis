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

class JsExtensionResolverPlugin {
  constructor(options = {}) {
    this.options = options;
  }

  apply(resolver) {
    const target = resolver.ensureHook('resolved');
    
    resolver.getHook('raw-module').tapAsync('JsExtensionResolverPlugin', (request, resolveContext, callback) => {
      if (request.request && request.request.endsWith('.js') && 
          (request.request.startsWith('./') || request.request.startsWith('../'))) {
        
        // Try resolving with .ts extension
        const tsPath = request.request.replace(/\.js$/, '.ts');
        const newRequest = Object.assign({}, request, { request: tsPath });
        
        resolver.doResolve(target, newRequest, null, resolveContext, (err, result) => {
          if (err || !result) {
            // Fall back to original request
            callback(null, request);
          } else {
            // Use the resolved .ts file
            callback(null, result);
          }
        });
      } else {
        callback();
      }
    });
  }
}

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
    extensionAlias: {
      '.js': ['.ts', '.js'],
    },
    alias: {
      '@agateh/solana-headless-react': path.resolve(__dirname, '../../packages/react-core/src'),
      '@agateh/solana-headless-core': path.resolve(__dirname, '../../packages/core/src'),
      '@agateh/solana-headless-adapter-base': path.resolve(__dirname, '../../packages/adapter-base/src')
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
  plugins: [
    new JsExtensionResolverPlugin()
  ],
  devtool: 'source-map'
};