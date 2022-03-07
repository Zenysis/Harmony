const invariant = require('invariant');
const types = require('@babel/types');
const traverse = require('@babel/traverse').default;

const {
  PluralTranslationValue,
  objectToObjectExpression,
} = require('../util/PluralTranslationValue');
const {
  isPluralTranslation,
  isSingularTranslation,
} = require('../util/validateASTTranslations');
const { OUT_OF_SYNC_TOKEN } = require('../util/config');

/**
 * Sorts two object properties.
 *
 * @param {SpreadElement | ObjectProperty} prop1
 * @param {SpreadElement | ObjectProperty} prop2
 * @returns {number}
 */
function objectPropertyComparator(prop1, prop2) {
  const isProp1Spread = types.isSpreadElement(prop1);
  const isProp2Spread = types.isSpreadElement(prop2);

  // if both are SpreadElements, keep the order they came in
  if (isProp1Spread || isProp2Spread) {
    return 0;
  }

  // if only one prop is a spread, we'll sort them first
  if (isProp1Spread && !isProp2Spread) {
    return -1;
  }

  if (!isProp1Spread && isProp2Spread) {
    return 1;
  }

  // neither props are spread elements, so compare their keys
  const key1 = prop1.key;
  const key2 = prop2.key;
  const isKey1Identifier = types.isIdentifier(key1);
  const isKey1StringLiteral = types.isStringLiteral(key1);
  const isKey2Identifier = types.isIdentifier(key2);
  const isKey2StringLiteral = types.isStringLiteral(key2);

  if (
    (isKey1Identifier || isKey1StringLiteral) &&
    (isKey2Identifier || isKey2StringLiteral)
  ) {
    if (isKey1Identifier && isKey2Identifier) {
      if (key1.name < key2.name) {
        return -1;
      }
      return key1.name > key2.name ? 1 : 0;
    }

    if (isKey1StringLiteral && isKey2StringLiteral) {
      if (key1.value < key2.value) {
        return -1;
      }
      return key1.value > key2.value ? 1 : 0;
    }

    // identifiers get sorted first
    if (isKey1Identifier && isKey2StringLiteral) {
      return -1;
    }

    if (isKey2StringLiteral && isKey1Identifier) {
      return 1;
    }
  }

  return 0;
}

/**
 * Process the incoming translations to build a running map of all
 * translations that are left to write (will be mutated during AST traversal).
 * Also track the incoming translated values for instant id lookup by value.
 *
 * @param {Array<TranslationRecord>} translations list of incoming translations
 * @returns {[Object, Object]} A tuple of objects representing the translations
 * left to write, the first providing lookup by id and the second providing
 * lookup by value
 */
function _buildIncomingTranslationMaps(translations) {
  const translationsLeftToWrite = {};
  // It is possible for 2+ unique ids to share the same value, so in
  // `translationValuesMap`, the value key maps to a set of ids.
  const translationValuesMap = {};

  translations.forEach(t => {
    translationsLeftToWrite[t.getId()] = t.getValue();
    if (t.getValue() in translationValuesMap) {
      translationValuesMap[t.getValue()].add(t.getValue());
    } else {
      translationValuesMap[t.getValue()] = new Set([t.getId()]);
    }
  });

  return [translationsLeftToWrite, translationValuesMap];
}

/**
 * Given the ids of translations that may have changed due to the
 * already-processed updates to the `locale` translation, synchronize
 * the translations for other locales by mutating `i18nAST`.
 *
 * Possible adjustments for synchronization fall into one of three categories:
 * - All ids in `deletedIds` will be deleted.
 * - Ids in `modifiedIds` will be switched to the updated id unless that id
 *   is in `duplicateModifiedIds`
 * - All ids in `outOfSyncIds` will be tagged with an '@outOfSync' comment.
 *
 * @param {Object} duplicateModifiedIds set of ids linked to 2+ translations
 * @param {AST} i18nAST The AST of an i18n.js file
 * @param {string} locale The locale that has already been changed
 * @param {Object} translationAdjustments ids of translations that may have
 * changed, sorted by category (outOfSyncIds, modifiedIds, deletedIds)
 * @param {Set<string>} availableLocales All available ISO codes
 * @returns {void}
 */
function _synchronizeASTWithAdjustments(
  duplicateModifiedIds,
  i18nAST,
  locale,
  translationAdjustments,
  availableLocales,
) {
  const { deletedIds, modifiedIds, outOfSyncIds } = translationAdjustments;
  // Traverse all translations except the base translation, which has already
  // been processed. Apply adjustments to synchronize translations with the
  // changed translation.
  traverse(i18nAST, {
    ObjectProperty(astPath) {
      const { key, value } = astPath.node;

      if (
        types.isIdentifier(key) &&
        availableLocales.has(key.name) &&
        types.isObjectExpression(value) &&
        key.name !== locale
      ) {
        const { properties } = value;
        const newProperties = [];

        properties.forEach(property => {
          // leave any spread elements in, we're not dealing with those here
          if (types.isSpreadElement(property)) {
            newProperties.push(property);
          } else {
            const id = types.isIdentifier(property.key)
              ? property.key.name
              : property.key.value;

            if (
              id in modifiedIds &&
              !duplicateModifiedIds.has(modifiedIds[id])
            ) {
              // Update translation id if it has been changed.
              newProperties.push(
                types.objectProperty(
                  types.stringLiteral(modifiedIds[id]),
                  property.value,
                ),
              );
            } else if (outOfSyncIds.has(id)) {
              // Add @outOfSync tag to translations that may have changed.
              // Tag is only added if the id is not already tagged.
              const { leadingComments } = property;
              if (
                !leadingComments ||
                !leadingComments.some(
                  comment => comment.value === OUT_OF_SYNC_TOKEN,
                )
              ) {
                types.addComment(property, 'leading', OUT_OF_SYNC_TOKEN, true);
              }
              newProperties.push(property);
            } else if (!deletedIds.has(id)) {
              // Keep property as-is if it has not been deleted.
              newProperties.push(property);
            }
          }
        });

        // ensure a stable sorted version of `newProperties`
        newProperties.sort(objectPropertyComparator);

        const newTranslationObjectNode = types.objectProperty(
          key,
          types.objectExpression(newProperties),
        );

        astPath.replaceWith(newTranslationObjectNode);
        astPath.skip();
      }
    },
  });
}

/**
 * Given the AST for an i18n.js file, and an array of translation objects,
 * generate a modified AST that includes all translations from the array.
 *
 * @param {AST} i18nAST The AST of an i18n.js file
 * @param {Array<TranslationRecord>} translations
 * @param {string} locale The locale to change, e.g. 'en', 'pt', etc.
 * @param {string} filename The filename that holds the AST being processed
 * @param {Set<string>} availableLocales All available ISO codes
 * @returns {[AST, boolean]} A tuple of the updated AST, and a boolean telling
 * us if any translations were changed, added, or removed.
 */
function writeTranslationsIntoAST(
  i18nAST,
  locale,
  translations,
  filename,
  availableLocales,
) {
  const [
    translationsLeftToWrite,
    translationValuesMap,
  ] = _buildIncomingTranslationMaps(translations);

  let translationsChanged = false;
  // Track adjustments that may be necessary for synchronizing other
  // translations with the changed `locale` translations.
  const translationAdjustments = {
    deletedIds: new Set(),
    modifiedIds: {},
    outOfSyncIds: new Set(),
  };
  // Data structures for handling same-value edge case.
  // If multiple existing translations have the same value, ensure that neither
  // is considered a "modified id" case, since it's not safe to make that
  // assumption.
  const newModifiedIds = {};
  const duplicateModifiedIds = new Set();

  traverse(i18nAST, {
    ObjectProperty(astPath) {
      const { node } = astPath;

      // Handle only the locale object we want to change
      if (types.isIdentifier(node.key, { name: locale })) {
        invariant(
          types.isObjectExpression(node.value),
          `Internal error merging translations in ${filename}: '${locale}' must hold an object expression. Encountered ${node.value.type} instead.`,
        );

        const { properties } = node.value;
        const newProperties = [];

        properties.forEach(property => {
          // leave any spread elements in, we're not dealing with those here
          if (types.isSpreadElement(property)) {
            newProperties.push(property);
          } else {
            const keyIsIdentifier = types.isIdentifier(property.key);
            const valueIsSingular = isSingularTranslation(property.value);

            invariant(
              keyIsIdentifier || types.isStringLiteral(property.key),
              `Internal error merging translations in ${filename}: invalid translation id. Expected an Identifier or StringLiteral. Encountered ${property.key.type} instead.`,
            );
            invariant(
              valueIsSingular || isPluralTranslation(property.value),
              `Internal error merging translations in ${filename}: invalid translation value. Expected a StringLiteral or ObjectExpression with appropriate keys. Encountered ${property.value.type} instead.`,
            );

            const id = keyIsIdentifier ? property.key.name : property.key.value;

            const propertyValue = valueIsSingular
              ? property.value.value
              : PluralTranslationValue.ObjectExpressionInstance(property.value);

            // Do we keep this translation?
            if (id in translationsLeftToWrite) {
              const newValue = translationsLeftToWrite[id];

              // Did the value change? If so, recreate this translation with
              // the new value and note that this id may be out of sync in
              // other locales.
              const valueChanged =
                typeof propertyValue === 'string'
                  ? propertyValue !== newValue
                  : !propertyValue.translationEquals(
                      PluralTranslationValue.ObjectInstance(newValue),
                    );

              if (valueChanged) {
                translationsChanged = true;
                translationAdjustments.outOfSyncIds.add(id);

                const newFormattedValue =
                  typeof newValue === 'string'
                    ? types.stringLiteral(newValue)
                    : objectToObjectExpression(newValue);
                newProperties.push(
                  types.objectProperty(property.key, newFormattedValue),
                );
              } else {
                // If its value hasn't changed, re-add this property as-is
                newProperties.push(property);
              }

              // Delete the id once we've processed it; we no longer need it.
              delete translationsLeftToWrite[id];
              // Also update `translationValuesMap` to un-link this now-deleted
              // id from association with its value.
              const idListForValue = translationValuesMap[newValue];
              if (idListForValue.length === 1) {
                delete translationValuesMap[newValue];
              } else {
                idListForValue.delete(id);
              }
            } else {
              // This property is not getting added back, so that means our
              // translations have changed
              translationsChanged = true;

              // Is this property's value present in an incoming translation,
              // meaning the id has changed but the value remained the same?
              // No-op when multiple incoming translations have same value.
              //   i.e `translationValuesMap[propertyValue].length` is longer
              //   than 1
              // No-op when another translation has already matched to value
              //   i.e. `newModifiedIds` contains id assoc. w/ matching value
              if (
                propertyValue in translationValuesMap &&
                translationValuesMap[propertyValue].size === 1
              ) {
                const newId = [...translationValuesMap[propertyValue]][0];
                if (newId in newModifiedIds) {
                  // Another existing translation has already been associated
                  // with this incoming value -- cannot assume connections for
                  // this incoming translation so add it to `duplicateModifiedIds`
                  duplicateModifiedIds.add(newId);
                  const falselyAssignedId = newModifiedIds[newId];
                  delete translationAdjustments.modifiedIds[falselyAssignedId];
                  // Delete both old translations
                  translationAdjustments.deletedIds.add(id);
                  translationAdjustments.deletedIds.add(falselyAssignedId);
                } else {
                  // This translation's id has changed
                  newModifiedIds[newId] = id;
                  translationAdjustments.modifiedIds[id] = newId;
                }
              } else {
                translationAdjustments.deletedIds.add(id);
              }
            }
          }
        });

        // Add the remaining translations we need to write from the
        // `translationsLeftToWrite` map. These are all new translations.
        Object.keys(translationsLeftToWrite).forEach(id => {
          translationsChanged = true;

          const keyNode = types.isValidIdentifier(id)
            ? types.identifier(id)
            : types.stringLiteral(id);

          const newValue = translationsLeftToWrite[id];
          const newFormattedValue =
            typeof newValue === 'string'
              ? types.stringLiteral(newValue)
              : objectToObjectExpression(newValue);

          newProperties.push(types.objectProperty(keyNode, newFormattedValue));
        });

        // ensure a stable sorted version of `newProperties`
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

  _synchronizeASTWithAdjustments(
    duplicateModifiedIds,
    i18nAST,
    locale,
    translationAdjustments,
    availableLocales,
  );

  return [i18nAST, translationsChanged];
}

module.exports = { objectPropertyComparator, writeTranslationsIntoAST };
