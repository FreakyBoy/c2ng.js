const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');
const { BannerPlugin } = require('webpack');
const libraryName = 'heimdall';

let plugins = [
  new BannerPlugin({
    banner: `
    /*!
    * ${libraryName} - Copyright (c) ${new Date().getFullYear()} Patryk Rzyszka
    * Lizenz: CC BY-NC 4.0
    * Weitere Informationen: https://creativecommons.org/licenses/by-nc/4.0/
    */`,
    raw: false, // stellt sicher, dass der Kommentar roh eingefügt wird und nicht formatiert
    entryOnly: true, // Banner wird nur in den Entry-Dateien eingefügt
  })
];

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
  plugins: plugins,
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
    minimize: true,
    removeEmptyChunks: true,
    mergeDuplicateChunks: false,
    providedExports: true,
    usedExports: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_fnames: false, // Verhindert das Umbenennen von Funktionsnamen
          mangle: {
            reserved: ['magaDomain'], // Verhindert das Umbenennen dieses Variablennamens
          },
          format: {
            comments: /@license|Copyright/i, // Behalte nur Copyright- oder Lizenz-Kommentare
          },
        },
        extractComments: false,
      }),
    ],
  }
}

module.exports = [
  minified
];
