const generate = require('@babel/generator').default;
const invariant = require('invariant');
const parser = require('@babel/parser');
const types = require('@babel/types');
const traverse = require('@babel/traverse').default;
const prettier = require('prettier');

const {
  objectPropertyComparator,
} = require('../generator/writeTranslationsIntoAST');
const { objectToObjectExpression } = require('../util/PluralTranslationValue');
const { isI18NFilepathValid, readFile, writeFile } = require('../util/io');
const TranslationRecord = require('../util/TranslationRecord');
const { BABEL_OPTIONS, PRETTIER_CONFIG } = require('../util/config');

/**
 * Go through all translations and consolidate plural translations
 * (i.e. all translation records with the same key) into one translation.
 *
 * Assumption: incoming plural translations are listed in one, other, zero
 * order — this matches the CSV created in `exportTranslations`.
 *
 * @param {Array<TranslationRecord>} translations
 * @returns {Array<TranslationRecord>} list of translations with plural
 * translations consolidated
 */
function _consolidateTranslations(translations) {
  const groupedTranslations = {};
  // Build a map of translation id: list of values
  translations.forEach(translationRecord => {
    const translationId = translationRecord.getId();
    const translationValue = translationRecord.getValue();
    if (translationId in groupedTranslations) {
      groupedTranslations[translationId].push(translationValue);
    } else {
      groupedTranslations[translationId] = [translationValue];
    }
  });

  const consolidatedTranslationRecords = [];
  Object.keys(groupedTranslations).forEach(translationId => {
    const translationValueList = groupedTranslations[translationId];
    const translationValueCount = translationValueList.length;
    const isSingularTranslation = translationValueCount === 1;
    invariant(
      isSingularTranslation || translationValueCount === 3,
      `Invalid input file. ID must be associated with one value (singular translation) or three values (plural translation). Found ${translationValueCount} values for '${translationId}'`,
    );

    let translationValue;
    if (isSingularTranslation) {
      [translationValue] = translationValueList;
    } else {
      const [one, other, zero] = translationValueList;
      translationValue = { one, other, zero };
    }
    consolidatedTranslationRecords.push(
      TranslationRecord.create({
        id: translationId,
        value: translationValue,
      }),
    );
  });

  return consolidatedTranslationRecords;
}

/**
 * Given the AST for an i18n.js file, and a list of translation records,
 * generate a modified AST that includes those translations in the appropriate
 * locale object.
 *
 * @param {AST} i18nAST The AST of an i18n.js file
 * @param {Array<TranslationRecord>} translations
 * @param {string} locale The locale to add `translations` to
 * @param {string} filename The filename that holds the AST being processed
 * @returns {AST} The updated AST
 */
function _writeTranslationIntoAST(i18nAST, translations, locale, filename) {
  const translationsLeftToWrite = {};
  translations.forEach(t => {
    translationsLeftToWrite[t.getId()] = t.getValue();
  });

  traverse(i18nAST, {
    ObjectProperty(astPath) {
      const { node } = astPath;

      // Handle only the locale object we want to update
      if (types.isIdentifier(node.key, { name: locale })) {
        invariant(
          types.isObjectExpression(node.value),
          `Internal error merging translations in ${filename}: '${locale}' must hold an object expression. Encountered ${node.value.type} instead.`,
        );

        const { properties } = node.value;
        const newProperties = [];

        // Traverse over the existing properties in case an incoming
        // translation updates an existing translation
        properties.forEach(property => {
          // Ignore spread elements
          if (types.isSpreadElement(property)) {
            newProperties.push(property);
          } else {
            const id = types.isIdentifier(property.key)
              ? property.key.name
              : property.key.value;
            if (id in translationsLeftToWrite) {
              const incomingValue = translationsLeftToWrite[id];
              // Format translation value into AST element
              const formattedIncomingValue =
                typeof incomingValue === 'string'
                  ? types.stringLiteral(incomingValue)
                  : objectToObjectExpression(incomingValue);
              // This will remove @outOfSync tag
              // (the translation is no longer outdated)
              newProperties.push(
                types.objectProperty(property.key, formattedIncomingValue),
              );
              delete translationsLeftToWrite[id];
            } else {
              // Keep the existing translation as-is
              newProperties.push(property);
            }
          }
        });

        // Add incoming translations that did not already exist in this locale
        Object.keys(translationsLeftToWrite).forEach(id => {
          const value = translationsLeftToWrite[id];
          const keyNode = types.isValidIdentifier(id)
            ? types.identifier(id)
            : types.stringLiteral(id);
          const valueNode =
            typeof value === 'string'
              ? types.stringLiteral(value)
              : objectToObjectExpression(value);

          newProperties.push(types.objectProperty(keyNode, valueNode));
        });

        // Ensure a stable sorted version of `newProperties`
        newProperties.sort(objectPropertyComparator);

        const newTranslationObjectNode = types.objectProperty(
          node.key,
          types.objectExpression(newProperties),
        );

        astPath.replaceWith(newTranslationObjectNode);
        astPath.skip();
      }
    },
  });

  return i18nAST;
}

/**
 * Validate that the file to write to exists, then write the given translations
 * into the appropriate locale.
 *
 * @param {Array<TranslationRecord>} translations
 * @param {string} locale The locale block to add `translation` to
 * @param {string} i18nFilename i18n.js file to add `translation` to
 * @returns {void}
 */
function writeTranslationsIntoI18NFile(translations, locale, i18nFilename) {
  const groupedTranslations = _consolidateTranslations(translations);
  const validFilepathPromise = isI18NFilepathValid(i18nFilename);

  Promise.resolve(validFilepathPromise)
    .then(isValid => {
      invariant(isValid, `Invalid filepath: ${i18nFilename}`);
      return Promise.resolve(readFile(i18nFilename));
    })
    .then(code => parser.parse(code, BABEL_OPTIONS))
    .then(ast =>
      _writeTranslationIntoAST(ast, groupedTranslations, locale, i18nFilename),
    )
    .then(updatedAST => {
      const code = prettier.format(generate(updatedAST).code, PRETTIER_CONFIG);
      writeFile(i18nFilename, code);
    });
}

module.exports = writeTranslationsIntoI18NFile;
