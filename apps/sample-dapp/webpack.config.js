const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
//   entry: './src/wallet.ts',
  entry: './src/wallet.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 3000,
    hot: true,

    host: '0.0.0.0', // Listen on all interfaces, not just localhost
    allowedHosts: 'all', // Optional: allows any host to connect
    // If you need HTTPS:
    // https: true,
    
    // For webpack-dev-server v4+, you might also need:
    client: {
      webSocketURL: {
        hostname: '0.0.0.0',
      },
    },
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
      template: './public/index.html',
      filename: 'index.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: './public/styles.css', to: 'styles.css' },
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
    ]
  }
};