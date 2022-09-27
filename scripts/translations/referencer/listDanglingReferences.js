const { exec } = require('child_process');
const collectTranslationsFromI18NFile = require('../exporter/collectTranslationsFromI18NFile');
const collectReferencesFromFile = require('./collectReferencesFromFile');
const LogColor = require('../util/LogColor');
const { getInvalidI18NFilepaths, readFile } = require('../util/io');
const { I18N_FILENAME } = require('../util/config');
/**
 * Find all files that import the I18N library, *except* for files named i18n.js.
 * Store all files in the FILES_THAT_IMPORT_I18N cache.
 * @returns {Promise<Array<string>>} Array of cached filepaths
 */
function _findFilesThatImportI18N() {
  const filesThatImportI18N = [];
  return new Promise(resolve => {
    exec(
      `grep -rlw --include '*.js' --include '*.jsx' --exclude '${I18N_FILENAME}' -e 'import I18N' '${process.cwd()}/web/client'`,
      (err, stdout) => {
        if (err) {
          resolve([]);
        }

        const lines = stdout.split('\n').filter(line => line !== '');
        lines.forEach(absFilePath => {
          filesThatImportI18N.push(absFilePath);
        });
        resolve(filesThatImportI18N);
      },
    );
  });
}

/**
 * Collects a list of all translation references in the platform (as string IDs).
 *
 * @returns {Promise<Array<[string, Array<string>]>>} List of filenames and
 * I18N references inside that file.
 */
function _collectAllReferences() {
  return _findFilesThatImportI18N().then(filesThatImportI18N => {
    const referenceListPromise = filename =>
      readFile(filename).then(contents => [
        filename,
        collectReferencesFromFile(filename, contents),
      ]);
    return Promise.all(
      filesThatImportI18N.map(filepath => referenceListPromise(filepath)),
    );
  });
}

/**
 * Confirm that a translation id matches to a translation in one of provided
 * translation groups
 *
 * @param {string} translationId Id for which we need to find a ref match
 * @param {Array<TranslationGroup>} translationGroups
 * @returns {boolean}
 */
// TODO(isabel): build set of all ids for faster lookup
function _checkForReferenceMatch(translationId, translationGroups) {
  return translationGroups.some(translationGroup =>
    translationGroup
      .getTranslations()
      .some(translationRecord => translationRecord.getId() === translationId),
  );
}

/**
 * This file generates a list of I18N translations and a list of all I18N
 * references. It then checks to ensure that every reference links to an
 * actual translation.
 *
 * @param {Array<string>} filepaths Array of file paths to use to build list
 * of I18N translations (all i18n.js filepaths)
 * @returns {void}
 */
function listDanglingReferences(filepaths) {
  const referencesByFile = _collectAllReferences();

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
    .then(() => {
      // Collect list of dangling ids in each I18N file
      const translationGroupPromise = filename =>
        readFile(filename).then(contents =>
          collectTranslationsFromI18NFile(filename, contents, 'en'),
        );

      return Promise.all([
        Promise.all(filepaths.map(translationGroupPromise)),
        referencesByFile,
      ]);
    })
    .then(([translationGroups, references]) => {
      const errorList = [];
      references.forEach(([filename, translationReferences]) => {
        const unmatchedTranslations = translationReferences.filter(
          translationId =>
            !_checkForReferenceMatch(translationId, translationGroups),
        );
        if (unmatchedTranslations.length > 0) {
          errorList.push([filename, unmatchedTranslations]);
        }
      });

      if (errorList.length > 0) {
        const errorMsg = errorList
          .map(([filename, idList]) =>
            LogColor.text(
              `${filename} contains dangling ids: ${idList.map(
                id => ` "${id}"`,
              )}`,
              LogColor.RED,
            ),
          )
          .join('\n');
        throw new Error(LogColor.text(errorMsg));
      } else {
        LogColor.print('No dangling references found.', LogColor.GREEN);
      }
    });
}

module.exports = listDanglingReferences;
