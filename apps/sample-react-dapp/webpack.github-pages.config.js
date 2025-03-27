const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/main.tsx',  // Changed from wallet.js to main.tsx
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
    publicPath: '/solana-headless-sdk/'  // Ensure this matches your GitHub Pages setup
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/'),
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',  // Changed from public/index.html
      filename: 'index.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: './src/index.css', to: 'styles.css' },  // Adjusted path
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'swc-loader',  // Use SWC loader for TypeScript
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
  // Add source map support for easier debugging
  devtool: 'source-map'
};