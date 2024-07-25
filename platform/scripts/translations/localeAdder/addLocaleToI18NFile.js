const generate = require('@babel/generator').default;
const parser = require('@babel/parser');
const types = require('@babel/types');
const traverse = require('@babel/traverse').default;
const prettier = require('prettier');

const { BABEL_OPTIONS, PRETTIER_CONFIG } = require('../util/config');
const { writeFile } = require('../util/io');

/**
 * Insert the new locale key into the `translations` TranslationGroup in
 * the provided i18n.js file. The value for the new key is simply an
 * empty dictionary {}.
 *
 * The updated file contents are written back to the original file.
 *
 * @param {string} newLocale The ISO code for the new locale
 * @param {string} fileContents The source code to parse
 * @param {string} i18nFilename The filename being processed
 *
 * @returns {void}
 */
function addLocaleToI18NFile(newLocale, fileContents, i18nFilename) {
  // Element to insert: {ISO locale code}: {}
  const newLocaleObject = types.objectProperty(
    types.identifier(newLocale),
    types.objectExpression([]),
  );

  // Parse file as an AST and traverse until the `en` key.
  const i18nAST = parser.parse(fileContents, BABEL_OPTIONS);

  traverse(i18nAST, {
    ObjectProperty(astPath) {
      const { node } = astPath;
      if (types.isIdentifier(node.key, { name: 'en' })) {
        // Insert the new locale after the `en` key.
        astPath.insertAfter(newLocaleObject);
      }
      astPath.skip();
    },
  });

  // Write the updated contents back to the original file.
  const code = prettier.format(generate(i18nAST).code, PRETTIER_CONFIG);
  writeFile(i18nFilename, code);
}

module.exports = addLocaleToI18NFile;
