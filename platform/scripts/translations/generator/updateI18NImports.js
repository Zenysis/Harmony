const invariant = require('invariant');
const path = require('path');
const prettier = require('prettier');

const { fileExistsSync, readFile, writeFile } = require('../util/io');
const {
  I18N_FILENAME,
  IMPORT_ROOT,
  PRETTIER_CONFIG,
} = require('../util/config');

const I18N_LIBRARY_IMPORT = "import I18N from 'lib/I18N';";
const TRANSLATION_DICTIONARY_TYPE_IMPORT = `import type { TranslationDictionary } from 'lib/I18N';`;

const I18N_BASE_NAME = path.basename(I18N_FILENAME, '.js');

/**
 * Generate a list of import names from a list of import paths.
 * An import name is of the form `i18n${Component}` where the Component
 * name is taken from the import path. If this will result in a duplicate
 * name then we keep appending parts of the file path until the name is unique.
 *
 * For clarity on the distinction between import name and import path:
 * In the line `import i18n_a_b_Table from 'a/b/Table';`, the import name
 * is 'i18n_a_b_Table' and the import path is 'a/b/Table'.
 *
 * @param {string} filepath The file path of the i18n.js file we are currently
 * writing to.
 * @param {Array<string>} allImportPaths All the import paths to include in
 * the file. These files are exactly as they'd appear in an import statement
 * (e.g. 'a/b/c/i18n').
 * @returns {Array<{ importName: string, importPath: string }>} An array of tuple objects
 * containing `importName` and `importPath`
 */
function _generateImportNames(filepath, allImportPaths) {
  const importEntries = [];
  allImportPaths.forEach(importPath => {
    const pathParts = importPath.split('/');
    const lastFilename = pathParts[pathParts.length - 1];
    invariant(
      lastFilename === I18N_BASE_NAME,
      `Error generating import names for ${filepath}: all import paths must end in ${I18N_BASE_NAME}`,
    );

    importEntries.push({
      importPath,

      // get all the path parts, but ignore the last part which is just `/i18n`
      importName: `i18n_${pathParts.slice(0, -1).join('_')}`,
    });
  });

  return importEntries.sort((import1, import2) => {
    if (import1.importName < import2.importName) {
      return -1;
    }
    return import1.importName > import2.importName ? 1 : 0;
  });
}

/**
 * Compare two lists of strings and check if they are different.
 * The order matters in this case.
 */
function _areStringListsDifferent(stringList1, stringList2) {
  const set1 = new Set(stringList1);
  const set2 = new Set(stringList2);
  if (set1.size !== set2.size) {
    return true;
  }

  set2.forEach(str => set1.delete(str));
  return set1.size > 0;
}

/**
 * This splits the code-processing logic away from the IO logic that is in
 * `updateI18NImports`. This allows this function to be more easily testable.
 *
 * @param {string} filepath The file path of the i18n.js file we are currently
 * writing to.
 * @param {string} code The source code for an i18n.js file
 * @param {Array<string>} filesToImport Array of filepaths to import.
 * @returns {[string, boolean]} A tuple of the new modified source code, and a
 * boolean telling us if any imports changed.
 */
function _buildNewI18NCodeWithImports(filepath, code, filesToImport) {
  const oldImportLines = [];
  const newImportLines = filesToImport.length > 0 ? [I18N_LIBRARY_IMPORT] : [];
  const importPaths = filesToImport.map(
    absPath => path.relative(IMPORT_ROOT, absPath).split('.js')[0],
  );

  const importEntries = _generateImportNames(filepath, importPaths);

  importEntries.forEach(({ importName, importPath }) => {
    newImportLines.push(`import ${importName} from '${importPath}';`);
  });
  newImportLines.push(TRANSLATION_DICTIONARY_TYPE_IMPORT);

  const lines = code.split('\n');
  const newLines = [];

  let insideMergeCallBlock = false;
  let foundFirstImportLine = false;
  lines.forEach(line => {
    const isImportLine = line.startsWith('import ');
    if (isImportLine) {
      oldImportLines.push(line);
    }

    if (line.startsWith('I18N.mergeSupplementalTranslations')) {
      insideMergeCallBlock = true;
    }

    if (!foundFirstImportLine && isImportLine) {
      // we found the first import line. Ignore this line and insert all of
      // our newly computed `importLines` here
      newLines.push(...newImportLines);
      foundFirstImportLine = true;
    } else if (line.startsWith('export default') && importPaths.length > 0) {
      // if we're on the `export default` line and there are i18n imports,
      // then add back the I18N.mergeSupplementalTranslations call with the
      // new imports
      const i18nString = importEntries.map(imp => imp.importName).join(', ');
      newLines.push('');
      newLines.push(
        `I18N.mergeSupplementalTranslations(translations, [${i18nString}]);`,
      );
      newLines.push(line);
    } else if (!insideMergeCallBlock && !isImportLine) {
      newLines.push(line);
    }

    if (insideMergeCallBlock && line.endsWith(');')) {
      insideMergeCallBlock = false;
    }
  });

  const newCode = newLines.join('\n');
  return [newCode, _areStringListsDifferent(newImportLines, oldImportLines)];
}

/**
 * Update an i18n.js file's imports. This will update:
 * 1. The import statements
 * 2. Merging any new i18n objects by calling `I18N.mergeSupplementalTranslations`
 *
 * @param {string} filepath The file path to this i18n.js file
 * @param {Array<string>} filesToImport Array of absolute filepaths to import
 * @returns {Promise<boolean>} True if the file has changed, false otherwise
 */
function updateI18NImports(filepath, filesToImport) {
  invariant(
    fileExistsSync(filepath),
    `Error processing imports in ${filepath}: the file must exist before calling 'updateI18NImports'`,
  );

  // we parse the file by hand in this function, rather than parsing with an
  // AST, because at this point there is a guaranteed template we are
  // receiving in an i18n.js file. This is a lot simpler and more performant
  // than AST manipulation.
  return readFile(filepath)
    .then(code => _buildNewI18NCodeWithImports(filepath, code, filesToImport))
    .then(([newCode, hasFileChanged]) => {
      if (hasFileChanged) {
        // write the updated AST Back to the file
        writeFile(filepath, prettier.format(newCode, PRETTIER_CONFIG)).then(
          () => true,
        );
      }

      return false;
    });
}

module.exports = {
  _buildNewI18NCodeWithImports,
  _generateImportNames,
  updateI18NImports,
};
