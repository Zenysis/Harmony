const invariant = require('invariant');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const types = require('@babel/types');

const { cleanTranslationId } = require('../util/cleanTranslationId');
const getPropStringFromI18NJSX = require('../util/getPropStringFromI18NJSX');
const { BABEL_OPTIONS } = require('../util/config');

/**
 * Collects all references by translation id from a file's source code by
 * parsing uses of <I18N.Ref> and I18N.textById().
 *
 * @param {string} filename The filename being processed
 * @param {string} code The source code to parse
 * @returns {Array<string>} List of all translation ids referenced in file
 */
function collectReferencesFromFile(filename, code) {
  const ast = parser.parse(code, BABEL_OPTIONS);
  const referencedIds = new Set();

  // Find uses of `<I18N.Ref>`, but NOT of `<I18N>`
  // Find uses of `I18N.textById()`, but NOT of `I18N.text()`
  traverse(ast, {
    /**
     * Detect any uses of:
     *   - I18N.textById('id');
     *   - I18N.textById('id', { config: '...' });
     */
    CallExpression(path) {
      const { callee } = path.node;

      // Only inspect calls to `I18N.textById`.
      if (
        types.isMemberExpression(callee) &&
        types.isIdentifier(callee.object, { name: 'I18N' }) &&
        types.isIdentifier(callee.property, { name: 'textById' })
      ) {
        // Validate the translation text.
        const idArg = path.node.arguments[0];
        invariant(
          (idArg && types.isStringLiteral(idArg)) || types.isIdentifier(idArg),
          `Error processing ${filename}. You must call I18N.textById with a string or string variable.`,
        );

        if (types.isStringLiteral(idArg)) {
          // Add the reference id to list.
          referencedIds.add(cleanTranslationId(idArg.value));
        }
        // TODO(isabel): `textById` may be called with a variable referencing a
        // string (case: types.isIdentifier(idArg)); need to be able to find
        // identifier value in the file in order to track those references
      }
    },

    /**
     * Detect any uses of:
     *   - <I18N.Ref id="my-id"/>
     *   - <I18N.Ref id="my-id" configVar="..."/>
     */
    JSXElement(path) {
      const { openingElement } = path.node;
      const { attributes, name } = openingElement;

      // Only inspect elements that are `<I18N.Ref>`.
      if (types.isJSXMemberExpression(name)) {
        const { object, property } = name;
        if (
          types.isJSXIdentifier(object, { name: 'I18N' }) &&
          types.isJSXIdentifier(property, { name: 'Ref' })
        ) {
          const i18nId = getPropStringFromI18NJSX(attributes, 'id');
          if (i18nId) {
            // Add the reference id to list.
            referencedIds.add(cleanTranslationId(i18nId));
          }
          // TODO(isabel): `<I18N.Ref>` may receive an identifier as an id
          // prop. In this case, `i18nId` will be null because
          // `getPropStringFromI18NJSX` only returns string prop values.
          // Need to be able to find identifier value in order to add those
          // references to `referencedIds`
        }
      }
    },
  });

  return [...referencedIds];
}

module.exports = collectReferencesFromFile;
