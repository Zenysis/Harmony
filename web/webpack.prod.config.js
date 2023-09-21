const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');
const webpack = require('webpack');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const CopyPlugin = require('copy-webpack-plugin');

// Convert a relative path (starting from the repo root) to an absolute path.
function absPath(repoRootRelativePath) {
  return path.resolve(__dirname, '../', repoRootRelativePath);
}

module.exports = {
  // Build a source map but do not link to it in the compiled JS files.
  devtool: 'hidden-source-map',
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
                  modules: false,
                  // List the minimum browser versions we want to support.
                  targets: {
                    chrome: 49,
                    edge: 15,
                    firefox: 51,
                    safari: 10,
                  },
                  // Enable debug mode to see the babel transpilation plugins
                  // that are needed for the browser versions specified above.
                  // debug: true
                },
              ],
              '@babel/react',
            ],
          },
        },
      },
      // Font and images
      {
        test: /\.(eot|gif|ico|jpe?g|png|ttf|svg|woff2?)(\?v=[0-9.]+)?$/,
        type: 'asset/resource',
      },
      {
        exclude: /node_modules/,
        test: /\.scss$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
      },
    ],
  },
  optimization: {
    emitOnErrors: false,
    minimize: true,
    minimizer: [
      new TerserPlugin({
        sourceMap: true,
        terserOptions: {
          compress: {
            arguments: true,
            passes: 2,
          },
          ecma: 2016,
          extractComments: false,
          mangle: true,
          output: {
            comments: false,
          },
        },
        test: /\.jsx?$/,
      }),
    ],
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
    path: absPath('web/public/build/min'),
    publicPath: '/build/min/',
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: 'bundle.[contenthash].css' }),
    new webpack.IgnorePlugin({
      contextRegExp: /moment$/,
      resourceRegExp: /^\.\/locale$/,
    }),
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(false),
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
      },
    }),
    new webpack.SourceMapDevToolPlugin({
      exclude: /cssBundle/,
      filename: '[name].[contenthash].js.map',
    }),
    new WebpackManifestPlugin({
      fileName: 'sourcemap.json',
      generate: (seed, files) => {
        const manifest = {};
        files.forEach(file => {
          let modifiedKey = file.name;
          if (file.isInitial) {
            // Otherwise the entry points have different keys than we expect
            modifiedKey = modifiedKey.replace('.js', '.bundle.js');
          }
          // NOTE: Couldn't find another way to get the key in the sourcemap
          // to align to our expectations
          if (modifiedKey === 'cssBundle.css') {
            modifiedKey = 'bundle.css';
          }
          manifest[modifiedKey] = file.path;
        });
        return manifest;
      },
    }),
    new CopyPlugin({
      patterns: [
        {
          from: absPath('web/public/images'),
          to: 'images/[path][name].[contenthash][ext]',
        },
        {
          from: absPath('web/public/fonts'),
          to: 'fonts/[path][name].[contenthash][ext]',
        },
        {
          from: absPath('web/public/scss'),
          to: 'scss/[path][name].[contenthash][ext]',
        },
        {
          from: absPath('web/public/js'),
          globOptions: {
            ignore: ['**/flow-typed/**'],
          },
          to: 'js/[path][name].[contenthash][ext]',
        },
      ],
    }),
  ],
  resolve: {
    // NOTE: Rewrite the react-draggable import to use an ES6 compatible
    // module and not an ES5 compatible version. Rough workaround to this bug:
    // https://github.com/STRML/react-draggable/issues/476.
    alias: {
      'react-draggable': absPath(
        'node_modules/react-draggable/build/module/cjs.js',
      ),
    },
    // You can now require('file') instead of require('file.jsx').
    extensions: ['.js', '.json', '.jsx'],
    modules: [absPath('web/client'), absPath('node_modules')],
  },
};
