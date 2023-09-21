const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const types = require('@babel/types');

const { isSingularTranslation } = require('../util/validateASTTranslations');
const { PluralTranslationValue } = require('../util/PluralTranslationValue');
const { BABEL_OPTIONS } = require('../util/config');

/**
 * Return all translations that may be out of sync, as designated by an
 * '@outOfSync' tag.
 *
 * @param {string} code The source code to parse
 * @param {Set<string>} availableLocales All available ISO codes
 * @returns {Array<[string, string, string]>} An array of tuples of
 * [<locale ISO code>, <outOfSync translation ID>, <translated value>]
 */
function collectOutOfSyncFromFile(code, availableLocales) {
  const ast = parser.parse(code, BABEL_OPTIONS);
  const outOfSyncTranslations = [];

  // Traverse AST to inspect translation objects for comments
  traverse(ast, {
    ObjectProperty(path) {
      const { key, value } = path.node;
      if (
        types.isIdentifier(key) &&
        availableLocales.has(key.name) &&
        types.isObjectExpression(value)
      ) {
        const localeName = key.name;
        const { properties } = value;

        properties.forEach(property => {
          // Skip spread elements
          if (types.isObjectProperty(property)) {
            const { leadingComments } = property;
            const id = types.isIdentifier(property.key)
              ? property.key.name
              : property.key.value;
            // Does this translation have a leading comment and is 'outOfSync'
            // its value? If yes, add to `outOfSyncTranslations`.
            if (
              leadingComments &&
              leadingComments[0].value.trim() === '@outOfSync'
            ) {
              const translationValue = isSingularTranslation(property.value)
                ? property.value.value
                : PluralTranslationValue.ObjectExpressionInstance(
                    property.value,
                  ).asString();
              outOfSyncTranslations.push([localeName, id, translationValue]);
            }
          }
        });
        path.skip();
      }
    },
  });

  return outOfSyncTranslations;
}

module.exports = collectOutOfSyncFromFile;
