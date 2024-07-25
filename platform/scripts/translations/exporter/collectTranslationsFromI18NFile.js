const parser = require('@babel/parser');
const invariant = require('invariant');
const traverse = require('@babel/traverse').default;
const types = require('@babel/types');

const {
  objectExpressionToPluralTranslationObject,
} = require('../util/PluralTranslationValue');
const {
  isPluralTranslation,
  isSingularTranslation,
} = require('../util/validateASTTranslations');
const TranslationGroup = require('../util/TranslationGroup');
const TranslationRecord = require('../util/TranslationRecord');
const { BABEL_OPTIONS, OUT_OF_SYNC_TOKEN } = require('../util/config');

/**
 * Collects all translations from an I18N.js file for a given locale.
 *
 * @param {string} filename The filename being processed
 * @param {string} code The source code to parse
 * @param {string} locale The locale to pull translations from (e.g. 'en')
 * @returns {TranslationGroup} A translation group holding all
 * TranslationRecords for this file
 */
function collectTranslationsFromI18NFile(filename, code, locale) {
  const ast = parser.parse(code, BABEL_OPTIONS);
  const translations = [];

  traverse(ast, {
    ObjectProperty(astPath) {
      const { node } = astPath;

      // Handle only the locale object we want to collect
      if (types.isIdentifier(node.key, { name: locale })) {
        invariant(
          types.isObjectExpression(node.value),
          `Internal error collecting translations in ${filename}: '${locale}' must hold an object expression. Encountered ${node.value.type} instead.`,
        );

        const { properties } = node.value;
        properties.forEach(property => {
          // Skip spread elements
          if (!types.isSpreadElement(property)) {
            // Test invariants:
            // - property key must be an identifier or string literal
            // - property value must be a string literal or object expression
            const keyIsIdentifier = types.isIdentifier(property.key);
            const valueIsSingular = isSingularTranslation(property.value);

            invariant(
              keyIsIdentifier || types.isStringLiteral(property.key),
              `Internal error collecting translations in ${filename}: invalid translation id. Expected an Identifier or StringLiteral. Encountered ${property.key.type} instead.`,
            );
            invariant(
              valueIsSingular || isPluralTranslation(property.value),
              `Internal error collecting translations in ${filename}: invalid translation value. Expected a StringLiteral or ObjectExpression with appropriate keys. Encountered ${property.value.type} instead.`,
            );

            const id = keyIsIdentifier ? property.key.name : property.key.value;

            const propertyValue = valueIsSingular
              ? property.value.value
              : objectExpressionToPluralTranslationObject(property.value);

            const outOfSync =
              property.leadingComments &&
              property.leadingComments.some(
                comment => comment.value === OUT_OF_SYNC_TOKEN,
              );

            translations.push(
              TranslationRecord.create(
                {
                  id,
                  value: propertyValue,
                },
                outOfSync,
              ),
            );
          }
        });
      }
    },
  });

  return TranslationGroup.create({ filename, translations });
}

module.exports = collectTranslationsFromI18NFile;
