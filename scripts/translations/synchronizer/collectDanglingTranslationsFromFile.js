const invariant = require('invariant');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const types = require('@babel/types');

const {
  isPluralTranslation,
  isSingularTranslation,
} = require('../util/validateASTTranslations');
const { BABEL_OPTIONS } = require('../util/config');

/**
 * Collects all dangling translations from the given i18n.js file.
 * Dangling translations are defined as translation ids that do not
 * match an id in the `baseLocale` translation.
 *
 * @param {string} baseLocale The ISO code for the base locale
 * @param {string} code The source code to parse
 * @param {string} filename The filename being processed
 * @param {Set<string>} availableLocales All available ISO codes
 * @returns {Array<[string, string]>} An array of tuples of
 * [<locale ISO code>, <dangling translation ID>]
 */
function collectDanglingTranslationsFromFile(
  baseLocale,
  code,
  filename,
  availableLocales,
) {
  const ast = parser.parse(code, BABEL_OPTIONS);
  const localeIds = {};

  // Traverse AST to collect ids from each translation object
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
        const idList = new Set();

        // Each property is an id-translation pair
        properties.forEach(property => {
          // Skip spread elements
          if (types.isObjectProperty(property)) {
            const keyIsIdentifier = types.isIdentifier(property.key);
            invariant(
              keyIsIdentifier || types.isStringLiteral(property.key),
              `Internal error inspecting translations in ${filename}: invalid translation id. Expected an Identifier or StringLiteral. Encountered ${property.key.type} instead.`,
            );
            invariant(
              isSingularTranslation(property.value) ||
                isPluralTranslation(property.value),
              `Internal error merging translations in ${filename}: invalid translation value. Expected a StringLiteral or ObjectExpression with appropriate keys. Encountered ${property.value.type} instead.`,
            );

            const id = keyIsIdentifier ? property.key.name : property.key.value;
            idList.add(id);
          }
        });

        localeIds[localeName] = idList;
      }
    },
  });

  invariant(
    baseLocale in localeIds,
    `Error: Base translation object (${baseLocale}) missing in ${filename}.`,
  );
  baseLocaleIds = localeIds[baseLocale];

  // Set difference: check if any non-base translations contain ids that
  // are *not* also present in the base translation
  const danglingTranslations = [];
  Object.entries(localeIds).forEach(([localeCode, idList]) => {
    if (localeCode !== baseLocale) {
      const danglingIds = [...idList].filter(id => !baseLocaleIds.has(id));
      danglingIds.forEach(danglingId =>
        danglingTranslations.push([localeCode, danglingId]),
      );
    }
  });

  return danglingTranslations;
}

module.exports = collectDanglingTranslationsFromFile;
