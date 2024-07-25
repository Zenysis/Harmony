const invariant = require('invariant');

const addLocaleToI18NFile = require('./addLocaleToI18NFile');
const LogColor = require('../util/LogColor');
const { getInvalidI18NFilepaths, readFile } = require('../util/io');
const { collectLocaleCodes } = require('../util/localeCodes');
const { I18N_TEMPLATE_FILEPATH } = require('../util/config');

const LOCALE_CODE_REGEX = RegExp('^[A-Za-z]{2}$');

/**
 * Insert the new locale key into all directory-level i18n.js files
 * (and also the 18n.js file template).
 *
 * @param {string} newLocale The ISO code for the new locale
 * @param {Array<string>} filepaths Array of file paths that need new locale.
 * File paths must be absolute and point to an i18n.js file.
 * @returns {void}
 */
function addLocale(newLocale, filepaths) {
  const availableLocales = collectLocaleCodes();

  // Confirm that the new locale code is a two alpha char string
  invariant(
    LOCALE_CODE_REGEX.test(newLocale),
    'Locale code must be in valid ISO 3166-1 alpha-2 format',
  );
  const lowercaseLocaleCode = newLocale.toLowerCase();

  Promise.resolve(availableLocales)
    .then(localeCodes => {
      // Confirm that the new locale code is not already part of project.
      invariant(
        !localeCodes.has(lowercaseLocaleCode),
        'The new locale must not already be in the project.',
      );
    })
    .then(() => {
      // Confirm that all file paths are valid.
      const checkFilepathPromise = getInvalidI18NFilepaths(filepaths);
      return Promise.resolve(checkFilepathPromise);
    })
    .then(invalidFilepaths => {
      if (invalidFilepaths.length !== 0) {
        throw new Error(
          LogColor.text(
            `Received invalid file names:\n${invalidFilepaths.join('\n')}`,
            LogColor.RED,
          ),
        );
      }
    })
    .then(() => {
      // Add the new locale key to every i18n.js file, as well as the template.
      const addNewLocalePromise = filename =>
        readFile(filename).then(contents =>
          addLocaleToI18NFile(lowercaseLocaleCode, contents, filename),
        );

      filepaths.push(I18N_TEMPLATE_FILEPATH);
      return Promise.allSettled(filepaths.map(addNewLocalePromise));
    })
    .then(results => {
      const numAttempted = results.length;
      const numFailed = results.filter(res => res.status === 'rejected').length;
      if (numFailed === 0) {
        LogColor.print(
          `Locale ${lowercaseLocaleCode} inserted into ${numAttempted} i18n.js files`,
          LogColor.GREEN,
        );
      } else {
        LogColor.print(
          `Failed to insert new locale into ${numFailed} i18n.js files`,
          LogColor.RED,
        );
      }
    });
}

module.exports = addLocale;
