const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = env => {
  return {
    entry: {
      app: './src/index.tsx',
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
        },
        {
          test: /\.css$/i,
          use: ['css-loader'],
        },
      ],
    },
    devServer: {
      contentBase: path.join(__dirname, '/src/assets/'),
      port: 9090,
    },
    output: {
      filename: '[name].bundle.js',
      path: path.resolve(__dirname, 'dist'),
      library: '[name]',
      libraryTarget: 'umd',
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
      }),
      new CopyPlugin({
        patterns: [{ from: './src/assets', to: './assets' }],
      }),
    ],
    mode: 'development',
    devtool: 'inline-source-map',
  };
};
