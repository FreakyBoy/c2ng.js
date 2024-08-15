const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');
const libraryName = 'c2ng';

let plugins = [];

const baseConfig = {
  entry: [`./${libraryName}.js`],
  module: {
    rules: [
      {
        loader:'babel-loader',
        test: /\.js$/,
        exclude:  /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.js']
  },
  plugins: plugins
}

const output = {
  ...baseConfig,
  mode: 'development',
  devtool: false,
  output: {
    pathinfo: false,
    path: path.resolve(__dirname),
    filename: `${libraryName}.js`
  }
}

const minified = {
  ...baseConfig,
  mode: 'production',
  output: {
    path: path.resolve(__dirname),
    filename: `${libraryName}.min.js`
  },
  optimization: {
    minimize: false,
    removeEmptyChunks: true,
    mergeDuplicateChunks: true,
    providedExports: true,
    usedExports: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_fnames: true, // Verhindert das Umbenennen von Funktionsnamen
          mangle: true, // Verhindert das Umbenennen von Variablen
          output: {
            comments: false,
          },
        },
      }),
    ]
  }
}

module.exports = [
  minified
];
