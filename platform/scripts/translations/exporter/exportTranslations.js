const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');

const collectTranslationsFromI18NFile = require('./collectTranslationsFromI18NFile');
const LogColor = require('../util/LogColor');
const { COLUMN_TITLES, IMPORT_ROOT } = require('../util/config');
const { getInvalidI18NFilepaths, readFile } = require('../util/io');

const PLURAL_KEYS = ['one', 'other', 'zero'];

const MISSING_STATUS = 'Missing';
const OUT_OF_SYNC_STATUS = 'Out of sync';
const VALID_STATUS = 'Up to date';
/**
 * Return a row to add to the exported CSV, unless this translation should
 * be filtered out, in which case return `undefined`.
 *
 * @param {string} filename File in which this translation is created
 * @param {string} id Id of translation to export
 * @param {boolean} missing Flag to export missing translations
 * @param {boolean} outOfSync Flag to export out-of-sync translations
 * @param {TranslationRecord} enTranslation English translation
 * @param {?TranslationRecord} nonEnTranslation Non-English translation,
 * if it exists
 * @param {?string} key Plural translation key, passed if `nonEnTranslation`
 * value is plural
 * @returns {?TranslationExportRow} The row to write to CSV output
 */
function _buildTranslationExport(
  filename,
  id,
  missing,
  outOfSync,
  enTranslationValue,
  nonEnTranslation,
  key = undefined,
) {
  const output = {
    id,
    english: key ? enTranslationValue[key] : enTranslationValue,
    filepath: path.relative(IMPORT_ROOT, filename),
    status: MISSING_STATUS,
    translation: '',
  };

  if (nonEnTranslation !== undefined) {
    output.status = nonEnTranslation.isOutOfSync()
      ? OUT_OF_SYNC_STATUS
      : VALID_STATUS;
    output.translation = key
      ? nonEnTranslation.getValue()[key]
      : nonEnTranslation.getValue();
  }

  // Return this translation if it should not be filtered out.
  if (
    (!missing && !outOfSync) ||
    (missing && output.status === MISSING_STATUS) ||
    (outOfSync && output.status === OUT_OF_SYNC_STATUS)
  ) {
    return output;
  }

  return undefined;
}

/**
 * This file gathers all translations for a target locale from i18n.js
 * files and outputs them to a CSV. One column is also added for
 * the original English value.
 *
 * By default, all translations are exported. If the `missing` and/or
 * `outOfSync` flag is specified, only those translations will be exported
 * (missing/out of sync defined relative to English translations)
 *
 * @param {string} targetLocale The locale to target for export
 * @param {string} outputCSVFile Filepath for output CSV
 * @param {Array<string>} filepaths Array of file paths to inspect for
 * translations. File paths must be absolute. Filepaths must point to
 * an i18n.js file otherwise you will get an error.
 * @param {boolean} missing Specifically export missing translations
 * @param {boolean} outOfSync Specifically export out-of-sync translations
 * @returns {void}
 */
function exportTranslations(
  targetLocale,
  outputCSVFile,
  filepaths,
  missing,
  outOfSync,
) {
  getInvalidI18NFilepaths(filepaths)
    .then(invalidFilepaths => {
      if (invalidFilepaths.length !== 0) {
        throw new Error(
          LogColor.text(
            `Received invalid file names:\n${invalidFilepaths.join('\n')}`,
            LogColor.RED,
          ),
        );
      }

      LogColor.print('Collecting all translations...', LogColor.YELLOW);
    })
    .then(() =>
      // Now we can finally start collecting all translations from each file
      Promise.all(
        filepaths.map(filepath =>
          readFile(filepath).then(contents => {
            const englishTranslations = collectTranslationsFromI18NFile(
              filepath,
              contents,
              'en',
            );
            const targetTranslations = collectTranslationsFromI18NFile(
              filepath,
              contents,
              targetLocale,
            );
            return {
              enGroup: englishTranslations,
              filename: filepath,
              targetGroup: targetTranslations,
            };
          }),
        ),
      ),
    )
    .then(translationGroups => {
      const rows = [];
      // Now that we have all translations, we can write to a csv
      translationGroups.forEach(({ enGroup, filename, targetGroup }) => {
        if (enGroup.hasTranslations()) {
          const enTranslations = enGroup.getTranslations();

          // build a lookup of id to translation for targetGroup
          const targetTranslationsLookup = targetGroup
            .getTranslations()
            .reduce(
              (map, translation) => map.set(translation.getId(), translation),
              new Map(),
            );

          enTranslations.forEach(translation => {
            const id = translation.getId();
            const englishValue = translation.getValue();
            const targetTranslation = targetTranslationsLookup.get(id);
            if (typeof englishValue === 'string') {
              // singular translation
              const outputRow = _buildTranslationExport(
                filename,
                id,
                missing,
                outOfSync,
                englishValue,
                targetTranslation,
              );
              if (outputRow !== undefined) {
                rows.push(outputRow);
              }
            } else {
              // plural translation
              PLURAL_KEYS.forEach(key => {
                const outputRow = _buildTranslationExport(
                  filename,
                  id,
                  missing,
                  outOfSync,
                  englishValue,
                  targetTranslation,
                  key,
                );
                if (outputRow !== undefined) {
                  rows.push(outputRow);
                }
              });
            }
          });
        }
      });

      const csvWriter = createObjectCsvWriter({
        header: [
          { id: 'filepath', title: COLUMN_TITLES.FILE },
          { id: 'id', title: COLUMN_TITLES.ID },
          { id: 'english', title: COLUMN_TITLES.ENGLISH },
          { id: 'translation', title: COLUMN_TITLES.TRANSLATION },
          { id: 'status', title: COLUMN_TITLES.STATUS },
        ],
        path: outputCSVFile,
      });

      LogColor.print(
        `Writing ${rows.length} translations to ${outputCSVFile}`,
        LogColor.GREEN,
      );
      csvWriter.writeRecords(rows);
    });
}

module.exports = exportTranslations;
