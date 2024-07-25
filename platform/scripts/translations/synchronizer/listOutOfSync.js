const path = require('path');

const { collectLocaleCodes } = require('../util/localeCodes');
const collectOutOfSyncFromFile = require('./collectOutOfSyncFromFile');
const LogColor = require('../util/LogColor');
const { getInvalidI18NFilepaths, readFile } = require('../util/io');
const { IMPORT_ROOT } = require('../util/config');

/**
 * This file inspects all directory-level i18n.js files and prints
 * prints out translations that contain the outOfSync tag.
 *
 * @param {Array<string>} filepaths Array of file paths to inspect for
 * outOfSync tags
 * @returns {void}
 */
function listOutOfSync(filepaths) {
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
      // Check if each file contains any outOfSync tags
      const perFileOutOfSync = filename =>
        readFile(filename).then(contents => [
          filename,
          // Naively check if file has outOfSync tag before traversal
          contents.includes('// @outOfSync')
            ? collectOutOfSyncFromFile(contents, localeCodes)
            : [],
        ]);

      return Promise.all(filepaths.map(perFileOutOfSync));
    })
    .then(searchedFiles => {
      let outOfSyncCount = 0;
      // Print filename, all (locale, id, value) pairs that have been tagged outOfSync
      searchedFiles.forEach(([filename, outOfSyncTranslations]) => {
        if (outOfSyncTranslations.length > 0) {
          outOfSyncCount += outOfSyncTranslations.length;
          const projectFilename = path.relative(IMPORT_ROOT, filename);
          LogColor.print(
            `\nOut-of-sync translation ids found in ${projectFilename}:`,
            LogColor.YELLOW,
          );
          outOfSyncTranslations.forEach(
            ([localeCode, translationId, translatedValue]) => {
              LogColor.print(
                `${localeCode}: [${translationId}: ${translatedValue}]`,
                LogColor.WHITE,
              );
            },
          );
        }
      });
      if (outOfSyncCount > 0) {
        LogColor.print(
          `\nTotal outOfSync tags: ${outOfSyncCount}`,
          LogColor.GREEN,
        );
      } else {
        LogColor.print(`\nNo @outOfSync translations found.`, LogColor.GREEN);
      }
    });
}

module.exports = listOutOfSync;
