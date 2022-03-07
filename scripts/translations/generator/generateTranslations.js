const generate = require('@babel/generator').default;
const path = require('path');
const parser = require('@babel/parser');
const prettier = require('prettier');

const { exec } = require('child_process');
const I18NFileTree = require('./I18NFileTree');
const LogColor = require('../util/LogColor');
const categorizeI18NFiles = require('./categorizeI18NFiles');
const checkTranslationsForDuplicates = require('./checkTranslationsForDuplicates');
const { collectLocaleCodesFromTemplate } = require('../util/localeCodes');
const collectTranslationsFromFile = require('./collectTranslationsFromFile');
const { writeTranslationsIntoAST } = require('./writeTranslationsIntoAST');
const {
  BABEL_OPTIONS,
  I18N_FILENAME,
  I18N_ROOT,
  I18N_TEMPLATE_FILEPATH,
  PRETTIER_CONFIG,
} = require('../util/config');
const {
  deleteI18NFile,
  fileExists,
  fileExistsSync,
  findFiles,
  getFilenamesInDirectory,
  readFile,
  writeFile,
} = require('../util/io');

// an array of all filepaths that import I18N (EXCEPT files named i18n.js)
let FILES_THAT_IMPORT_I18N = [];
function _resetFileCache() {
  FILES_THAT_IMPORT_I18N = [];
}

/**
 * Find all files that import the I18N library, *except* for files named i18n.js.
 * Store all files in the FILES_THAT_IMPORT_I18N cache.
 * @returns {Promise<Array<string>>} Array of cached filepaths
 */
function _findFilesThatImportI18N() {
  if (FILES_THAT_IMPORT_I18N.length === 0) {
    return new Promise(resolve => {
      // TODO(pablo): switch this to use ripgrep `rg` once it becomes a standard
      // installation in our eng tooolset. The command to run would be:
      // `rg -l -t js '^import I18N' '${process.cwd()}/web/client'`
      exec(
        `grep -rlw --include '*.js' --include '*.jsx' --exclude '${I18N_FILENAME}' -e 'import I18N' '${process.cwd()}/web/client'`,
        (err, stdout) => {
          if (err) {
            resolve([]);
          }

          const lines = stdout.split('\n').filter(line => line !== '');
          lines.forEach(absFilePath => {
            FILES_THAT_IMPORT_I18N.push(absFilePath);
          });
          resolve(FILES_THAT_IMPORT_I18N);
        },
      );
    });
  }

  return Promise.resolve(FILES_THAT_IMPORT_I18N);
}

/**
 * Check that a filename is valid for processing. The conditions are:
 * 1. file is not named i18n.js (`I18N_FILENAME`)
 * 2. file is a .js or .jsx file
 *
 * @param {string} filename The file name to path (this should *not* be a path)
 * @returns {boolean}
 */
function _isFilenameValid(filename) {
  const isJSFile = filename.endsWith('.js') || filename.endsWith('.jsx');
  return isJSFile && filename !== I18N_FILENAME;
}

/**
 * Check that a filepath is valid for processing. The conditions are:
 * 1. file name is valid
 * 2. file path starts with `<src_root>/${I18N_ROOT}`
 * 3. file exists
 *
 * @param {string} filepath The file path to test
 * @returns {Promise<boolean>}
 */
function _isFilepathValid(filepath) {
  if (
    _isFilenameValid(path.basename(filepath)) &&
    filepath.startsWith(`${process.cwd()}/${I18N_ROOT}`)
  ) {
    return fileExists(filepath);
  }

  return Promise.resolve(false);
}

/**
 * Get an array of the invalid filepaths from an array of filepaths.
 *
 * @param {Array<string>} filepaths All file paths to test
 * @returns {Promise<Array<string>>} The invalid file paths
 */
function _getInvalidFilepaths(filepaths) {
  if (filepaths.length === 0) {
    return Promise.resolve([]);
  }

  const filepathTests = filepaths.map(filepath =>
    Promise.all([filepath, _isFilepathValid(filepath)]),
  );

  return Promise.all(filepathTests).then(results => {
    const invalidFiles = [];
    results.forEach(([filepath, isValid]) => {
      if (!isValid) {
        invalidFiles.push(filepath);
      }
    });
    return invalidFiles;
  });
}

/**
 * Get all filepaths to extract translations from. For every file path we
 * receive, we need to get all other adjacent JS files in its same directory
 * that also import I18N.
 *
 * The reason for this is because we generate an i18n.js file *per directory*.
 * So to correctly refresh an i18n.js file we need to process *all* files in
 * its same directory, in order to make sure we aren't dropping any
 * translations.
 *
 * @param {Array<string>} filepaths The array of initial filepaths we received
 * @returns {Promise<Array<string>>} The final array of filepaths to process, which
 * includes all adjacent files in each directory we are looking at.
 */
function _getFilepathsToProcess(filepaths) {
  const processedDirectories = new Set();
  const allFilepathsToProcess = [];
  filepaths.forEach(filepath => {
    const dirname = path.dirname(filepath);
    if (!processedDirectories.has(dirname)) {
      processedDirectories.add(dirname);
      getFilenamesInDirectory(dirname).forEach(filename => {
        if (_isFilenameValid(filename)) {
          allFilepathsToProcess.push(`${dirname}/${filename}`);
        }
      });
    }
  });

  return _findFilesThatImportI18N().then(filesThatImportI18N => {
    const filesThatImportI18NSet = new Set(filesThatImportI18N);
    return allFilepathsToProcess.filter(filepath =>
      filesThatImportI18NSet.has(filepath),
    );
  });
}

/**
 * Prints a string to the console. Helper function to use a `shouldPrint`
 * variable rather than having to wrap every log statement in an `if` every
 * time.
 * @param {string} str The string to print
 * @param {string} color The color to use. Must be an enum from `LogColor`
 * @param {boolean} shouldPrint Whether or not to actually print to console.
 */
function print(str, color, shouldPrint) {
  if (shouldPrint) {
    LogColor.print(str, color);
  }
}

/**
 * This file generates and modifies all translation files (i18n.js files) in
 * our codebase.
 *
 * @param {Array<string>} filepaths Array of file paths to inspect for
 * translations. File paths must be absolute.
 * @param {boolean} verbose Print logging information to console
 * @returns {void}
 */
function generateTranslations(filepaths, verbose = false) {
  _resetFileCache();
  const cwd = process.cwd();

  _getInvalidFilepaths(filepaths)
    .then(invalidFilepaths => {
      if (invalidFilepaths.length !== 0) {
        throw new Error(
          LogColor.text(
            `Received invalid file names:\n${invalidFilepaths.join('\n')}`,
            LogColor.RED,
          ),
        );
      }

      print('Collecting all translations...', LogColor.YELLOW, verbose);

      // collect all filepaths to process. For every file we received, we might
      // also have to process adjacent files in this same directory, so we need
      // to collect those.
      return _getFilepathsToProcess(filepaths);
    })
    .then(allFilepathsToProcess => {
      // Now we can finally start collecting all translations from each file
      const filenameToTranslationGroup = filename =>
        readFile(filename).then(contents =>
          collectTranslationsFromFile(filename, contents),
        );

      const allTranslationGroupsPromise = Promise.all(
        allFilepathsToProcess.map(filenameToTranslationGroup),
      );

      return Promise.all([
        allTranslationGroupsPromise,

        // read in the template file
        readFile(I18N_TEMPLATE_FILEPATH),
      ]);
    })
    .then(([allTranslationGroups, templateContents]) => {
      // all translations have been collected, so check for duplicate ids now
      // We will throw an error if there are errors in our translations.
      print('Validating translations...', LogColor.YELLOW, verbose);
      const errors = checkTranslationsForDuplicates(allTranslationGroups);
      if (errors.length > 0) {
        const errorMsg = errors
          .map(e => LogColor.text(e.message, LogColor.RED))
          .join('\n');
        throw new Error(LogColor.text(errorMsg));
      }

      // map directory paths to array of translations
      const translationsByDir = new Map();
      allTranslationGroups.forEach(group => {
        const dirname = path.dirname(group.filename);
        const translations = translationsByDir.get(dirname);
        if (translations) {
          translations.push(...group.translations);
        } else {
          translationsByDir.set(dirname, [...group.translations]);
        }
      });

      // we passed validation! so now let's merge in all translations into the
      // i18n.js ASTs
      print('Updating i18n.js files...', LogColor.YELLOW, verbose);

      const availableLocales = collectLocaleCodesFromTemplate(templateContents);

      const i18nASTPromises = [...translationsByDir].map(
        ([dirname, translations]) => {
          const i18nFilename = `${dirname}/${I18N_FILENAME}`;

          if (translations.length === 0 && fileExistsSync(i18nFilename)) {
            // delete the i18n.js file if there are no translations in this
            // directory
            return deleteI18NFile(i18nFilename).then(() => 'DELETED');
          }

          if (translations.length > 0) {
            // get the initial AST. If an i18n.js file already exists, we parse it,
            // otherwise we start from the template file
            const i18nASTPromise = fileExistsSync(i18nFilename)
              ? readFile(i18nFilename).then(code =>
                  parser.parse(code, BABEL_OPTIONS),
                )
              : Promise.resolve(parser.parse(templateContents, BABEL_OPTIONS));

            return i18nASTPromise.then(i18nAST => {
              const [updatedAST, hasChanged] = writeTranslationsIntoAST(
                i18nAST,
                'en',
                translations,
                i18nFilename,
                availableLocales,
              );

              if (!hasChanged) {
                // there were no changes to the AST, so do not waste time
                // writing the file back
                return 'NO CHANGE';
              }

              const code = prettier.format(
                generate(updatedAST).code,
                PRETTIER_CONFIG,
              );

              return writeFile(i18nFilename, code).then(() => 'CHANGED');
            });
          }

          // this should never happen
          return undefined;
        },
      );

      // count how many ASTs have changed so that we can print a useful message
      return Promise.all(i18nASTPromises).then(results => {
        const numChanged = results.filter(
          r => r === 'CHANGED' || r === 'DELETED',
        ).length;

        if (numChanged === 0) {
          print(
            'No files have translations to change.',
            LogColor.WHITE,
            verbose,
          );
        } else {
          const fileStr = numChanged === 1 ? 'file has' : 'files have';
          print(
            `${numChanged} ${fileStr} updated translations`,
            LogColor.WHITE,
            verbose,
          );
        }
        return numChanged > 0;
      });
    })
    .then(haveTranslationsChanged => {
      // Find all files that import I18N library, and all i18n.js files.
      // We will use these to determine which i18n.js files should not
      // exist anymore.
      return Promise.all([
        _findFilesThatImportI18N(),
        findFiles(`${cwd}/${I18N_ROOT}/**/${I18N_FILENAME}`, {
          ignore: `${cwd}/${I18N_ROOT}/${I18N_FILENAME}`,
        }),
      ]).then(([filesThatImportI18N, i18nFiles]) => {
        // determine if there are any unnecessary i18n.js files to delete
        const { filesToKeep, filesToRemove } = categorizeI18NFiles(
          i18nFiles,
          filesThatImportI18N,
        );
        const numFilesToRemove = filesToRemove.length;
        if (numFilesToRemove !== 0) {
          print(
            'Deleting unnecessary i18n.js files...',
            LogColor.YELLOW,
            verbose,
          );
          Promise.allSettled(
            filesToRemove.map(i18nFilepath => deleteI18NFile(i18nFilepath)),
          ).then(results => {
            const numRemoved = results.filter(res => res.status === 'fulfilled')
              .length;
            if (numRemoved > 0) {
              print(
                `Number of files deleted: ${numRemoved}`,
                LogColor.WHITE,
                verbose,
              );
            }
          });
        }

        return [haveTranslationsChanged || numFilesToRemove > 0, filesToKeep];
      });
    })
    .then(([haveTranslationsChanged, i18nFilenames]) => {
      // at this stage all translations have been written, and any unnecessary
      // i18n.js files have been cleaned up. So now we have to make sure that
      // all i18n.js files are correctly importing each other.
      print('Resolving i18n imports...', LogColor.YELLOW, verbose);

      const updateResults = [];
      const tree = I18NFileTree.fromFiles(i18nFilenames);
      tree.traverse(node => {
        if (node.isRoot()) {
          updateResults.push(tree.writeRoot());
        } else {
          updateResults.push(node.updateImportsInFile());
        }
      });

      return Promise.all(updateResults).then(
        results => haveTranslationsChanged || results.some(r => r === true),
      );
    })
    .then(haveTranslationsChanged => {
      if (haveTranslationsChanged) {
        print(
          'Successfully updated all translation files',
          LogColor.GREEN,
          true, // always print a success result
        );
      } else {
        print('No translation files needed updating.', LogColor.GREEN, verbose);
      }
    });
}

module.exports = generateTranslations;
