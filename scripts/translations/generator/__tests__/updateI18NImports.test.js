/**
 * This file tests the `_buildNewI18NCodeWithImports` function from the
 * `updateI18NImports.js` file.
 * This is where we add imports to an i18n.js file, so tht it can import *other*
 * i18n.js files.
 */
const prettier = require('prettier');

const { PRETTIER_CONFIG } = require('../../util/config');
const {
  _buildNewI18NCodeWithImports,
  _generateImportNames,
} = require('../updateI18NImports');

const TEST_FILE_PATH = 'web/client/a/b/test.js';

function prettifyCode(code) {
  // run prettier and remove all newlines from code
  return prettier
    .format(code, PRETTIER_CONFIG)
    .replace(/^\s*$(?:\r\n?|\n)/gm, '');
}

function makeFullFilePath(path) {
  return `${process.cwd()}/web/client/${path}`;
}

function makeI18NCode(filesToImport = []) {
  // remove all newlines from code to make this easy to compare
  const mainImportLine =
    filesToImport.length > 0 ? "import I18N from 'lib/I18N'" : '';

  const importEntries = _generateImportNames(TEST_FILE_PATH, filesToImport);
  const importLines = importEntries
    .map(imp => `import ${imp.importName} from '${imp.importPath}';`)
    .join('\n');

  const i18nStrs = importEntries.map(imp => imp.importName).join(', ');
  const mergeTranslationsLine =
    filesToImport.length > 0
      ? `I18N.mergeSupplementalTranslations(translations, [${i18nStrs}]);`
      : '';

  return prettifyCode(
    `
    // @flow
    /* eslint-disable */
    ${mainImportLine}
    ${importLines}
    import type { TranslationDictionary } from 'lib/I18N';
    /**
     * Block comment...
     */
    const translations: TranslationDictionary = {
      en: {
        someId: 'Some string here',
      },
      fr: {
        someId: 'Some french translation here',
      },
    };
    ${mergeTranslationsLine}
    export default translations;
    `,
    PRETTIER_CONFIG,
  );
}

// i18n code with no imports, and a single translation
const DEFAULT_I18N_CODE = makeI18NCode();

describe('i18n generator: updateI18NImports', () => {
  test('Adding no imports does not change the code', () => {
    const [newCode, hasChanged] = _buildNewI18NCodeWithImports(
      TEST_FILE_PATH,
      DEFAULT_I18N_CODE,
      [],
    );
    expect(newCode).toBe(DEFAULT_I18N_CODE);
    expect(hasChanged).toBe(false);
  });

  test('Adding imports to i18n.js file with no imports', () => {
    const newImports = ['path/to/dir1/i18n', 'path/to/dir2/i18n'];
    const [newCode, hasChanged] = _buildNewI18NCodeWithImports(
      TEST_FILE_PATH,
      DEFAULT_I18N_CODE,
      newImports.map(makeFullFilePath),
    );
    expect(prettifyCode(newCode)).toBe(makeI18NCode(newImports));
    expect(hasChanged).toBe(true);
  });

  test('Adding imports to i18n.js file that already has imports', () => {
    // TODO(pablo): update imports to use i18n.js filenames
    const initialImports = [
      'path/to/dir1/i18n',
      'path/to/dir2/i18n',
      'path/to/dir3/i18n',
    ];
    const newImports = [
      'path/to/dir3/i18n',
      'path/to/newDir1/i18n',
      'path/to/newDir2/i18n',
    ];
    const [newCode, hasChanged] = _buildNewI18NCodeWithImports(
      TEST_FILE_PATH,
      makeI18NCode(initialImports),
      newImports.map(makeFullFilePath),
    );

    // `initialImport1` and `initialImport2` should get removed.
    expect(prettifyCode(newCode)).toBe(makeI18NCode(newImports));
    expect(hasChanged).toBe(true);
  });

  test('Removing all imports from an i18n.js file that already has imports', () => {
    const initialImports = [
      'path/to/dir1/i18n',
      'path/to/dir2/i18n',
      'path/to/dir3/i18n',
    ];
    const [newCode, hasChanged] = _buildNewI18NCodeWithImports(
      TEST_FILE_PATH,
      makeI18NCode(initialImports),
      [],
    );

    expect(prettifyCode(newCode)).toBe(DEFAULT_I18N_CODE);
    expect(hasChanged).toBe(true);
  });

  test('Writing a bunch of imports, but they are the same ones in the file, so nothing has changed.', () => {
    const imports = [
      'path/to/dir1/i18n',
      'path/to/dir2/i18n',
      'path/to/dir3/i18n',
    ];
    const initialCode = makeI18NCode(imports);
    const [newCode, hasChanged] = _buildNewI18NCodeWithImports(
      TEST_FILE_PATH,
      initialCode,
      imports.map(makeFullFilePath),
    );

    expect(prettifyCode(newCode)).toBe(initialCode);
    expect(hasChanged).toBe(false);
  });
});
