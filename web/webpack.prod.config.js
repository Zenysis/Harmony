const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

// Convert a relative path (starting from the repo root) to an absolute path.
function absPath(repoRootRelativePath) {
  return path.resolve(__dirname, '../', repoRootRelativePath);
}

module.exports = {
  // Build a source map but do not link to it in the compiled JS files.
  devtool: 'hidden-source-map',
  entry: {
    admin: absPath('web/client/entryPoints/adminEntry.js'),
    gridDashboard: absPath('web/client/entryPoints/gridDashboardEntry.js'),
    navbar: absPath('web/client/entryPoints/navbarEntry.js'),
    query: absPath('web/client/entryPoints/queryEntry.js'),
    upload: absPath('web/client/entryPoints/dataUploadEntry.js'),
    newUserButton: absPath('web/client/entryPoints/newUserButtonEntry.js'),
    unauthorizedPage: absPath(
      'web/client/entryPoints/unauthorizedPageEntry.js',
    ),
    notFoundPage: absPath('web/client/entryPoints/notFoundPageEntry.js'),
    overviewPage: absPath('web/client/entryPoints/overviewEntry.js'),

    // CSS entry point: we just load all css for now. Since all JS entrypoints
    // rely on the same CSS bundle, we can build the css separate from the other
    // bundles and reduce our webpack build time.
    cssBundle: absPath('web/public/scss/entry.scss'),
  },
  output: {
    path: absPath('web/public/build/min'),
    publicPath: '/build/min/',
    filename: '[name].bundle.js',
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: 'bundle.css' }),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new webpack.ProvidePlugin({
      // TODO(stephen): Provide bluebird as the default Promise implementation.
      t: absPath('web/client/translate'),
    }),
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(false),
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
      },
    }),
  ],
  optimization: {
    noEmitOnErrors: true,
    splitChunks: {
      cacheGroups: {
        commons: {
          chunks: 'initial',
          minChunks: 3,
          name: 'commons',
          // Test that the path is inside our client repo. This is needed so
          // that node_modules vendor code won't get included here.
          test: absPath('web/client'),
          enforce: true,
        },
        // Build a separate node_modules vendor bundle so that it can be
        // cached. It won't change as often as common.
        // TODO(stephen): Make sure we set up flask and webpack to make this
        // cacheable.
        vendor: {
          chunks: 'all',
          name: 'vendor',
          test: absPath('node_modules'),
          enforce: true,
        },
      },
    },
    minimizer: [new UglifyJsPlugin({ sourceMap: true })],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: [/node_modules/, /web\/public\/js\/vendor/],
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/flow',
              ['@babel/stage-2', { decoratorsLegacy: true }],
              [
                '@babel/env',
                {
                  // List the minimum browser versions we want to support.
                  targets: {
                    chrome: 49,
                    edge: 15,
                    firefox: 51,
                    safari: 10,
                  },
                  modules: false,
                  loose: true,
                  // Enable debug mode to see the babel transpilation plugins
                  // that are needed for the browser versions specified above.
                  // debug: true
                },
              ],
              '@babel/react',
            ],
            plugins: [
              ['@babel/plugin-proposal-decorators', { legacy: true }],
              ['@babel/plugin-proposal-class-properties', { loose: true }],
            ],
            cacheDirectory: true,
          },
        },
      },
      // Font and images
      {
        test: /\.(eot|gif|ico|jpe?g|png|ttf|svg|woff2?)(\?v=[0-9.]+)?$/,
        loader: 'file-loader',
      },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader?sourceMap',
          'sass-loader?sourceMap',
        ],
      },
    ],
    // Used so babel doesn't check this and throw a warning for precompiled
    // libraries that are used via require.
    noParse: [/web\/public\/js\/vendor/],
  },
  resolve: {
    // You can now require('file') instead of require('file.jsx').
    extensions: ['.js', '.json', '.jsx'],
    modules: [absPath('web/client'), absPath('node_modules')],
  },
};
