var webpack = require('webpack');
var path = require('path');
var webpackConfig = require('../../webpack.config.js');

// Our dev webpack config ignores fonts and python serves them directly from the
// filesystem. That isn't possible for styleguide, so change the font rule
// definition to compile fonts inside webpack.
webpackConfig.module.rules.forEach(rule => {
  if (rule.test.toString().includes('ttf')) {
    rule.options = {
      name: '[path][name].[ext]',
    };
  }
});

// Convert a relative path (starting from the repo root) to an absolute path.
function absPath(repoRootRelativePath) {
  return path.resolve(__dirname, '../../../', repoRootRelativePath);
}

module.exports = {
  webpackConfig,
  assetsDir: absPath('web/public'),
  webpackConfig: {
    ...webpackConfig,
    plugins: [
      // Remove the pretty output printer since it can accidentally hide errors
      // inside the styleguide config that were printed.
      ...webpackConfig.plugins.filter(
        p => p.constructor.name !== 'FriendlyErrorsWebpackPlugin',
      ),

      // Add a global mockup of __JSON_FROM_BACKEND
      new webpack.DefinePlugin({
        'window.__JSON_FROM_BACKEND': JSON.stringify({
          locale: 'en',
          ui: {
            minDataDate: '1970-01-01',
            maxDataDate: '2050-12-31',
            customColors: [],
          },
        }),
      }),
      // Work around a `process is not defined` error referenced here
      // https://github.com/styleguidist/react-styleguidist/pull/1707
      // and
      // https://github.com/facebook/create-react-app/pull/7929
      new webpack.DefinePlugin({ 'process.env': JSON.stringify({}) }),

      // HACK(stephen): Disable the websocket connection from starting since it
      // does not work.
      new webpack.DefinePlugin({
        WebSocket: 'Function(); var unused = () => ',
      }),
    ],

    // Clear out any `devServer` settings set since they might clash with the
    // steyleguidist webpack.
    // NOTE(stephen): The `publicPath` option is what broke it and it took me a
    // while to figure out what was going on since the `localhost:6060` site was
    // just showing the webpack dev server homepage and there were no errors in
    // the terminal.
    devServer: {
      // Add support for running the styleguide server on our internal host.
      allowedHosts: ['host.docker.internal', 'styleguide.corp.clambda.com'],
    },
  },
  sections: [
    {
      name: 'Style Guide',
      content: absPath('web/client/components/ui/styleguide.md'),
      sections: [
        {
          name: 'Colors',
          content: absPath('web/client/components/ui/colors.md'),
        },
        {
          name: 'Typography',
          content: absPath('web/client/components/ui/typography.md'),
        },
        {
          name: 'Layout',
          content: absPath('web/client/components/ui/layout.md'),
        },
        {
          name: 'Iconography',
          content: absPath('web/client/components/ui/iconography.md'),
        },
      ],
    },
    {
      name: 'UI Components',
      components: '../components/ui/**/*.jsx',
      ignore: [
        '**/ui/Breadcrumb/BreadcrumbItemWrapper.jsx',

        // Exclude all of HierarchicalSelector's components except for the
        // main index
        '**/ui/HierarchicalSelector/!(index).jsx',
        '**/ui/HierarchicalSelector/*/**/*.jsx',

        // Exclude HOCs
        '**/ui/hocs/**/*.jsx',

        // Exclude visualizations
        '**/ui/visualizations/**/*.jsx',

        // Exclude components that are used internally by the UI component that
        // should not be exposed to the public.
        '**/ui/**/internal/*',
        '**/ui/**/internal/**/*',
        '**/ui/**/__tests__/*',
        '**/ui/**/__tests__/**/*',
      ],
    },
    {
      name: 'Visualizations',
      components: '../components/ui/visualizations/**/*.jsx',
      ignore: [
        // TODO(stephen): Is there a way to share the ignore behavior?
        '**/ui/**/internal/*',
        '**/ui/**/internal/**/*',
        '**/ui/**/__tests__/*',
        '**/ui/**/__tests__/**/*',
        '**/ui/visualizations/common/*',
        '**/ui/visualizations/common/**/*',
      ],
    },
    {
      name: 'Common Visualization Components',
      components: '../components/ui/visualizations/common/**/*.jsx',
      content: '../components/ui/visualizations/common/index.md',
      ignore: [
        // TODO(stephen): Is there a way to share the ignore behavior?
        '**/ui/**/internal/*',
        '**/ui/**/internal/**/*',
      ],
    },
    {
      name: 'HOCs',
      components: '../components/ui/hocs/**/*.jsx',
      ignore: [],
    },
  ],

  context: {
    ZenArray: absPath('web/client/lib/Zen/ZenArray'),
    ZenMap: absPath('web/client/lib/Zen/ZenMap'),
  },

  require: [
    // load all our css
    absPath('web/public/scss/entry.scss'),
  ],

  // switch to 'expand' to have the 'Props & Methods' sections auto-expanded
  usageMode: 'collapse',
};
