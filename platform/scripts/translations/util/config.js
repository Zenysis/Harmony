const prettier = require('prettier');

module.exports = {
  /** Options for babel parser */
  BABEL_OPTIONS: {
    plugins: ['jsx', 'flow', 'classProperties', 'decorators-legacy'],
    sourceType: 'module',
  },

  /** CSV column names for exporting/importing translations */
  COLUMN_TITLES: {
    ENGLISH: 'english',
    FILE: 'filename',
    ID: 'id',
    STATUS: 'status',
    TRANSLATION: 'translation',
  },

  /** The name to give to any generated translation files */
  I18N_FILENAME: 'i18n.js',

  /** Where to place the root i18n file relative to the project root */
  I18N_ROOT: 'web/client',

  /** The translation file template */
  I18N_TEMPLATE_FILEPATH: 'scripts/translations/generator/i18n.template.txt',

  /** The import root for files in the JS codebase */
  IMPORT_ROOT: `${process.cwd()}/web/client`,

  /** Comment token to designate a translated value that may be outdated */
  OUT_OF_SYNC_TOKEN: ' @outOfSync',

  /** Options for prettier parser */
  PRETTIER_CONFIG: {
    ...prettier.resolveConfig.sync(null, {
      config: `${process.cwd()}/.prettierrc`,
    }),
    parser: 'flow',
  },
};
