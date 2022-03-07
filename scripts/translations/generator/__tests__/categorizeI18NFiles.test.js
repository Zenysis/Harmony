/**
 * This file tests the `categorizeI18NFiles` function.
 * This is where we decide what i18n.js files to keep or delete, depending on
 * which files are importing the I18N library.
 */
const categorizeI18NFiles = require('../categorizeI18NFiles');

function makeFullFilePath(path) {
  return `${process.cwd()}/web/client/${path}`;
}

describe('i18n generator: categorizeI18NFiles', () => {
  test('All i18n.js files are kept, none are deleted', () => {
    const i18nFiles = ['a/b/c/i18n.js', 'a/b/i18n.js'].map(makeFullFilePath);
    const filesThatImportI18N = [
      'a/b/c/File1.js',
      'a/b/File2.js',
      'a/b/File3.js',
    ].map(makeFullFilePath);
    const { filesToKeep, filesToRemove } = categorizeI18NFiles(
      i18nFiles,
      filesThatImportI18N,
    );

    expect(filesToKeep).toEqual(i18nFiles);
    expect(filesToRemove).toEqual([]);
  });

  test('All i18n.js are removed, none are kept', () => {
    const i18nFiles = ['a/b/c/i18n.js', 'a/b/i18n.js'].map(makeFullFilePath);
    const { filesToKeep, filesToRemove } = categorizeI18NFiles(i18nFiles, []);
    expect(filesToKeep).toEqual([]);
    expect(filesToRemove).toEqual(i18nFiles);
  });

  test('i18n.js files are removed only when necessary', () => {
    const i18nFiles = ['a/b/c/i18n.js', 'a/b/i18n.js'].map(makeFullFilePath);
    const filesThatImportI18N = [
      makeFullFilePath('a/b/File2.js', 'a/b/c/d/File3.js'),
    ];
    const { filesToKeep, filesToRemove } = categorizeI18NFiles(
      i18nFiles,
      filesThatImportI18N,
    );

    expect(filesToKeep).toEqual([makeFullFilePath('a/b/i18n.js')]);
    expect(filesToRemove).toEqual([makeFullFilePath('a/b/c/i18n.js')]);
  });
});
