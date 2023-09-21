const path = require('path');

const collectDanglingTranslationsFromFile = require('./collectDanglingTranslationsFromFile');
const { collectLocaleCodes } = require('../util/localeCodes');
const LogColor = require('../util/LogColor');
const { getInvalidI18NFilepaths, readFile } = require('../util/io');
const { IMPORT_ROOT } = require('../util/config');

/**
 * This file inspects all directory-level i18n.js files and prints
 * "dangling ids," i.e. any id in a non-base translation that does
 * not match an id in the base translation.
 *
 * @param {string} baseLocale The ISO code for the base locale
 * @param {Array<string>} filepaths Array of file paths to inspect for
 * dangling translations. File paths must be absolute and point to an
 * i18n.js file.
 * @returns {void}
 */
function listDanglingTranslations(baseLocale, filepaths) {
  const availableLocales = collectLocaleCodes();

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
    })
    .then(() => Promise.resolve(availableLocales))
    .then(localeCodes => {
      // Collect list of dangling ids in each I18N file
      const perFileDanglingTranslations = filename =>
        readFile(filename).then(contents => [
          filename,
          collectDanglingTranslationsFromFile(
            baseLocale,
            contents,
            filename,
            localeCodes,
          ),
        ]);

      const allDanglingTranslationsPromise = Promise.all(
        filepaths.map(perFileDanglingTranslations),
      );

      return Promise.resolve(allDanglingTranslationsPromise);
    })
    .then(filesAndDanglingTranslations => {
      let danglingCount = 0;
      // All dangling translations have been collected, so print filename plus
      // the names of all (locale code, id) pairs that are dangling in that file
      filesAndDanglingTranslations.forEach(
        ([filename, danglingTranslations]) => {
          if (danglingTranslations.length > 0) {
            danglingCount += danglingTranslations.length;
            const projectFilename = path.relative(IMPORT_ROOT, filename);
            LogColor.print(
              `\nDangling translation ids found in ${projectFilename}:`,
              LogColor.YELLOW,
            );
            danglingTranslations.forEach(([localeCode, danglingId]) =>
              LogColor.print(`${localeCode}: ${danglingId}`, LogColor.WHITE),
            );
          }
        },
      );
      if (danglingCount > 0) {
        LogColor.print(
          `\nTotal dangling translation ids: ${danglingCount}`,
          LogColor.GREEN,
        );
      } else {
        LogColor.print(
          'No dangling ids found in translations.',
          LogColor.GREEN,
        );
      }
    });
}

module.exports = listDanglingTranslations;
