const glob = require('glob');
const invariant = require('invariant');
const path = require('path');

const fs = require('fs');
const { I18N_FILENAME, I18N_ROOT } = require('./config');

/**
 * Check if a file exists. This function is synchronous.
 * @param {string} filename The file to check if exists
 * @returns boolean
 */
function fileExistsSync(filename) {
  return fs.existsSync(filename);
}

/**
 * Check if a file exists. This function is asynchronous.
 * @param {string} filename The file to check if exists
 * @returns {Promise<boolean>}
 */
function fileExists(filename) {
  return new Promise(resolve => {
    fs.exists(filename, exists => {
      resolve(exists);
    });
  });
}

/**
 * Read a file given a filename.
 *
 * @param {string} filename The file to read
 * @returns {Promise<string>} A promise holding the file contents
 */
function readFile(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

/**
 * Write a file given a filename and its contents.
 *
 * @param {string} filename The file to write
 * @param {string} contents The contents to write
 * @returns {Promise<void>}
 */
function writeFile(filename, contents) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, contents, 'utf8', err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

const I18N_ROOT_FILENAME = `${I18N_ROOT}/${I18N_FILENAME}`;

/**
 * Delete an i18n.js file. This raises an error if the function is called on a non
 * i18n.js file, or on the root i18n.js file which should never be deleted.
 *
 * @param {string} filename The file to delete (must be named i18n.js)
 * @returns {Promise<void>}
 */
function deleteI18NFile(filename) {
  const basename = path.basename(filename);
  invariant(
    basename === I18N_FILENAME,
    `Internal error deleting a file: only files named '${I18N_FILENAME}' can be deleted`,
  );
  invariant(
    !filename.endsWith(I18N_ROOT_FILENAME),
    `Internal error deleting a file: you are not allowed to delete the root i18n.js file at ${I18N_ROOT_FILENAME}`,
  );

  return new Promise((resolve, reject) => {
    fs.unlink(filename, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Find all files matching a glob pattern.
 * @param {string} globStr The glob pattern to search for
 * @param {object} globOptions The glob options to pass, described here:
 * https://www.npmjs.com/package/glob#options
 * @returns {Promise<Array<string>>} Array of filepaths
 */
function findFiles(globStr, globOptions = {}) {
  return new Promise((resolve, reject) => {
    glob(globStr, globOptions, (err, filenames) => {
      if (err) {
        reject(err);
      } else {
        resolve(filenames);
      }
    });
  });
}

/**
 * Get all files in a directory path.
 * @param {string} dirname The directory path to look at
 * @returns {Array<string>} Array of all file names (not paths) in `dirname`
 */
function getFilenamesInDirectory(dirname) {
  return fs.readdirSync(dirname);
}

/**
 * Check that a filepath is valid for processing as an I18N.js file.
 * The conditions are:
 * 1. file name is i18n.js (I18N_FILENAME)
 * 2. file path starts with `<src_root>/${I18N_ROOT}`
 * 3. file exists
 *
 * @param {string} filepath The file path to test
 * @returns {Promise<boolean>}
 */
function isI18NFilepathValid(filepath) {
  if (
    path.basename(filepath) === I18N_FILENAME &&
    filepath.startsWith(`${process.cwd()}/${I18N_ROOT}`)
  ) {
    return fileExists(filepath);
  }
  return Promise.resolve(false);
}

/**
 * Get an array of the invalid I18N.js filepaths from an array of filepaths.
 *
 * @param {Array<string>} filepaths File paths to test
 * @returns {Promise<Array<string>>} Invalid I18N.js file paths
 */
function getInvalidI18NFilepaths(filepaths) {
  if (filepaths.length === 0) {
    return Promise.resolve([]);
  }

  const filepathTests = filepaths.map(filepath =>
    Promise.all([filepath, isI18NFilepathValid(filepath)]),
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

module.exports = {
  deleteI18NFile,
  fileExists,
  fileExistsSync,
  findFiles,
  getFilenamesInDirectory,
  getInvalidI18NFilepaths,
  isI18NFilepathValid,
  readFile,
  writeFile,
};
