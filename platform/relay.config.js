module.exports = {
  eagerESModules: true,
  exclude: ['**/node_modules/**', '**/__mocks__/**', '**/__generated__/**'],
  extensions: ['js', 'jsx'],
  schema: './graphql/schema.graphql',
  src: './web/client',
};
