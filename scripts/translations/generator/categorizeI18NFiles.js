const path = require('path');

/**
 * Given a list of i18n.js files, and a list of files that import the
 * I18N library (with an 'import I18N' statement), categorize the i18n.js
 * files into two lists: a list of i18n.js files to keep, and a list of
 * which ones need to be removed.
 *
 * An i18n.js file needs to be removed if there are no files in its directory
 * that import I18N.
 *
 * @param {Array<string>} i18nFiles A list of i18n.js file paths
 * @param {Array<string>} filesThatImportI18N A list of files that import the
 * I18N library
 * @returns {Object} An object with two lists of strings: `filesToKeep` andd
 * `filesToRemove`. Each string is a file path to an i18n.js file.
 */
function categorizeI18NFiles(i18nFiles, filesThatImportI18N) {
  const directoriesWithTranslations = new Set();
  filesThatImportI18N.forEach(filepath => {
    directoriesWithTranslations.add(path.dirname(filepath));
  });

  const i18nFilesToKeep = [];
  const i18nFilesToRemove = [];

  i18nFiles.forEach(i18nFilepath => {
    const dir = path.dirname(i18nFilepath);
    if (directoriesWithTranslations.has(dir)) {
      i18nFilesToKeep.push(i18nFilepath);
    } else {
      i18nFilesToRemove.push(i18nFilepath);
    }
  });

  return {
    filesToKeep: i18nFilesToKeep,
    filesToRemove: i18nFilesToRemove,
  };
}

module.exports = categorizeI18NFiles;
