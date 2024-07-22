const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const FriendlyErrorsOutputPrinter = require('friendly-errors-webpack-plugin/src/output');

// NOTE: Update the FriendlyErrors output printer to clear the terminal
// each time a compilation happens instead of building up a long scrollback.
// This is similar to how our flow and mypy watchers work.
/* eslint-disable func-names */
FriendlyErrorsOutputPrinter.clearConsole = function() {
  if (!this.capturing && this.enabled && process.stdout.isTTY) {
    // Clear any lines that can be scrolled to.
    /* eslint-disable no-console */
    console.log('\x1B[3J');
    console.clear();
  }
};

// Convert a relative path (starting from the repo root) to an absolute path.
function absPath(repoRootRelativePath) {
  return path.resolve(__dirname, '../', repoRootRelativePath);
}

module.exports = {
  devServer: {
    allowedHosts: ['host.docker.internal'],

    // Disable Live Reload
    hot: false,
    injectClient: false,
    injectHot: false,
    inline: false,
    liveReload: false,
    publicPath: '/build/',

    // Needed for friendly errors plugin.
    quiet: true,
    port: 9001
  },
  devtool: 'source-map',
  entry: {
    admin: absPath('web/client/entryPoints/adminEntry.js'),
    advancedQuery: absPath('web/client/entryPoints/advancedQueryEntry.js'),
    alerts: absPath('web/client/entryPoints/alertsAppEntry.js'),
    // CSS entry point: we just load all css for now. Since all JS entrypoints
    // rely on the same CSS bundle, we can build the css separate from the other
    // bundles and reduce our webpack build time.
    cssBundle: absPath('web/public/scss/entry.scss'),
    dashboardBuilder: absPath(
      'web/client/entryPoints/DashboardBuilderEntry.js',
    ),
    dataCatalog: absPath('web/client/entryPoints/dataCatalogEntry.js'),
    dataDigest: absPath('web/client/entryPoints/dataDigestEntry.js'),
    dataQuality: absPath('web/client/entryPoints/dataQualityEntry.js'),
    dataUpload: absPath('web/client/entryPoints/dataUploadEntry.js'),
    embeddedQuery: absPath('web/client/entryPoints/embeddedQueryEntry.js'),
    fieldSetup: absPath('web/client/entryPoints/fieldSetupEntry.js'),
    forgotPasswordPage: absPath(
      'web/client/entryPoints/forgotPasswordEntry.js',
    ),
    loginPage: absPath('web/client/entryPoints/loginEntry.js'),
    navbar: absPath('web/client/entryPoints/navbarEntry.js'),
    newUserButton: absPath('web/client/entryPoints/newUserButtonEntry.js'),
    notFoundPage: absPath('web/client/entryPoints/notFoundPageEntry.js'),
    overviewPage: absPath('web/client/entryPoints/overviewEntry.js'),
    registerPage: absPath('web/client/entryPoints/registerEntry.js'),
    resetPasswordPage: absPath('web/client/entryPoints/resetPasswordEntry.js'),
    unauthorizedPage: absPath(
      'web/client/entryPoints/unauthorizedPageEntry.js',
    ),
  },
  module: {
    // Used so babel doesn't check this and throw a warning for precompiled
    // libraries that are used via require.
    noParse: [/web\/public\/js\/vendor/],
    rules: [
      {
        exclude: [/node_modules/, /web\/public\/js\/vendor/],
        test: /\.jsx?$/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            plugins: [
              'relay',
              ['@babel/plugin-proposal-decorators', { legacy: true }],
              ['@babel/plugin-proposal-class-properties', { loose: true }],
            ],
            presets: [
              '@babel/flow',
              [
                '@babel/env',
                {
                  loose: true,
                  // Enable debug mode to see the babel transpilation plugins
                  // that are needed for the browser versions specified above.
                  // debug: true
                  // List the minimum browser versions we want to support.
                  modules: false,
                  targets: {
                    chrome: 49,
                    edge: 15,
                    firefox: 51,
                    safari: 10,
                  },
                },
              ],
              [
                '@babel/react',
                {
                  development: true,
                },
              ],
            ],
          },
        },
      },
      // Font and images
      {
        generator: {
          // Avoid copying the file to an output dir since we can serve the
          // file directly from the local filesystem. The /static route is used
          // by the python webpack proxy to retrieve the file.
          emit: false,
          filename: '[path][name][ext]',
          publicPath: '/static/',
        },
        test: /\.(eot|gif|ico|jpe?g|png|ttf|svg|woff2?)(\?v=[0-9.]+)?$/,
        type: 'asset/resource',
      },
      {
        exclude: /node_modules/,
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader?sourceMap',
          'sass-loader?sourceMap',
        ],
      },
    ],
  },
  optimization: {
    emitOnErrors: false,
    splitChunks: {
      cacheGroups: {
        commons: {
          chunks: 'initial',
          enforce: true,
          minChunks: 3,
          name: 'commons',
          // Test that the path is inside our client repo. This is needed so
          // that node_modules vendor code won't get included here.
          test: absPath('web/client'),
        },
        // Build a separate node_modules vendor bundle so that it can be
        // cached. It won't change as often as common.
        // TODO: Make sure we set up flask and webpack to make this
        // cacheable.
        vendor: {
          chunks: 'initial',
          enforce: true,
          name: 'vendor',
          test: absPath('node_modules'),
        },
      },
    },
  },
  output: {
    filename: '[name].bundle.js',
    path: absPath('web/public/build'),
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: 'bundle.css' }),
    new webpack.IgnorePlugin({
      contextRegExp: /moment$/,
      resourceRegExp: /^\.\/locale$/,
    }),
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(true),
    }),
    new FriendlyErrorsWebpackPlugin(),
  ],
  resolve: {
    // You can now require('file') instead of require('file.jsx').
    extensions: ['.js', '.json', '.jsx'],
    modules: [absPath('web/client'), absPath('node_modules')],
  }
};
