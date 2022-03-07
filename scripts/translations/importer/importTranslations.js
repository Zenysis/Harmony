const csv = require('csv-parser');
const invariant = require('invariant');

const fs = require('fs');
const writeTranslationsIntoI18NFile = require('./writeTranslationsIntoI18NFile');
const LogColor = require('../util/LogColor');
const { fileExistsSync } = require('../util/io');
const { collectLocaleCodes } = require('../util/localeCodes');
const TranslationRecord = require('../util/TranslationRecord');
const { COLUMN_TITLES, I18N_ROOT } = require('../util/config');

/**
 * Check that a filepath is valid for importing. The conditions are:
 * 1. file has csv extension
 * 2. file exists
 *
 * @param {string} filepath The file path to test
 * @returns {boolean}
 */
function _isFilepathValid(filepath) {
  if (filepath.endsWith('.csv')) {
    return fileExistsSync(filepath);
  }

  return false;
}

/**
 * Read in the provided CSV file and sort all translations to write by the
 * the filename they should be written to.
 *
 * @param {string} inputFile File to read and import
 * @returns {Promise<Map<string, Array<TranslationRecord>>>} map of filename to
 * array of TranslationRecords to write to that file
 */
function parseCSVToTranslationMap(inputFile) {
  // Read in CSV file contents
  LogColor.print('Reading in CSV.', LogColor.YELLOW);

  const translationPromise = new Promise((resolve, reject) => {
    const translationPairs = new Map();

    fs.createReadStream(inputFile)
      .pipe(csv())
      .on('headers', headers => {
        // Validate presence of required columns
        invariant(
          headers.includes(COLUMN_TITLES.ID) &&
            headers.includes(COLUMN_TITLES.TRANSLATION) &&
            headers.includes(COLUMN_TITLES.FILE),
          `CSV input file must have "${COLUMN_TITLES.ID}", "${COLUMN_TITLES.TRANSLATION}", and ${COLUMN_TITLES.FILE} columns.`,
        );
      })
      .on('data', row => {
        // Add (id, translated value) pairs to `translationPairs`
        // indexed by the filename they belong in.
        const record = new TranslationRecord({
          id: row[COLUMN_TITLES.ID],
          value: row[COLUMN_TITLES.TRANSLATION],
        });
        const filename = row[COLUMN_TITLES.FILE];
        if (translationPairs.has(filename)) {
          const records = translationPairs.get(filename);
          translationPairs.set(filename, records.concat(record));
        } else {
          translationPairs.set(filename, [record]);
        }
      })
      .on('error', error => reject(error))
      .on('end', () => {
        LogColor.print('CSV file successfully processed.', LogColor.YELLOW);
        resolve(translationPairs);
      });
  });

  return translationPromise;
}

/**
 * Given the path to a CSV file, read in the file, validate that it contains
 * appropriately-labeled, translated values, and then use translation ids to
 * write each translation to the right i18n.js file, for `targetLocale`.
 *
 * @param {string} targetLocale Translated text locale
 * @param {string} inputFite Filepath of input CSV
 * @returns {void}
 */
function importTranslations(targetLocale, inputFile) {
  const cwd = process.cwd();

  // Validate filepath to read in
  if (!_isFilepathValid(inputFile)) {
    LogColor.print(
      'Invalid filepath. Call import with a local CSV.',
      LogColor.RED,
    );
  } else {
    // Validate provided locale
    const availableLocales = collectLocaleCodes();
    Promise.resolve(availableLocales)
      .then(localeList => {
        invariant(
          localeList.has(targetLocale.toLowerCase()),
          `Invalid locale code. Must be one of {${[...localeList].join(', ')}}`,
        );

        return parseCSVToTranslationMap(inputFile);
      })
      .then(translationPairs => {
        // Write all new translated values into i18n.js files
        const writeTranslationPromises = Array.from(
          translationPairs.keys(),
        ).map(filepath =>
          writeTranslationsIntoI18NFile(
            translationPairs.get(filepath),
            targetLocale,
            `${cwd}/${I18N_ROOT}/${filepath}`,
          ),
        );

        return Promise.allSettled(writeTranslationPromises);
      })
      .then(results => {
        const numAttempted = results.length;
        const numFailed = results.filter(res => res.status === 'rejected')
          .length;
        if (numFailed === 0) {
          LogColor.print(
            `Number of i18n.js files updated: ${numAttempted}`,
            LogColor.GREEN,
          );
        } else {
          LogColor.print(
            `Number of failed i18n.js files updates: ${numFailed}`,
            LogColor.RED,
          );
        }
      });
  }
}

module.exports = importTranslations;
