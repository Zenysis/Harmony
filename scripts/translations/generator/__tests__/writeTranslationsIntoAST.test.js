/**
 * This file tests the `writeTranslationsIntoAST` function.
 * This is where we add translations to an i18n.js AST to generate a new
 * AST and list of transltaions.
 */
const generate = require('@babel/generator').default;
const parser = require('@babel/parser');
const prettier = require('prettier');

const TranslationRecord = require('../../util/TranslationRecord');
const { writeTranslationsIntoAST } = require('../writeTranslationsIntoAST');
const { BABEL_OPTIONS, PRETTIER_CONFIG } = require('../../util/config');

const FILENAME = 'testFile.js';

function makeTranslation(id, value) {
  return TranslationRecord.create({ id, value });
}

function makeI18NCode(translationObjStr) {
  // remove all newlines from code to make this easy to compare
  return prettier.format(
    `
    // @flow
    /* eslint-disable */
    import type { TranslationDictionary } from 'lib/I18N';
    /**
     * Block comment...
     */
    const translations: TranslationDictionary = ${translationObjStr};
    export default translations;
    `,
    PRETTIER_CONFIG,
  );
}

// i18n code with no translations
const DEFAULT_I18N_CODE = makeI18NCode(`{
  en: {},
  fr: {},
}`);

const availableLocales = new Set(['en', 'fr']);

function codeToAST(code) {
  return parser.parse(code, BABEL_OPTIONS);
}

function astToCode(ast) {
  // remove all newlines from code to make this easy to compare
  return prettier
    .format(generate(ast).code, PRETTIER_CONFIG)
    .replace(/^\s*$(?:\r\n?|\n)/gm, '');
}

describe('i18n generator: writeTranslationsIntoAST', () => {
  test('Detect when no translations have changed, and leave the code unchanged', () => {
    const initialCode = makeI18NCode(`{
      en: {
        first: 'First translation',
        plural: {
          one: '1',
          other: '+',
          zero: '0',
        },
        second: 'Second translation',
      },
      fr: {
        first: 'Première traduction',
        second: 'Deuxième traduction',
      },
    }`);

    const translationsToWrite = [
      makeTranslation('first', 'First translation'),
      makeTranslation('second', 'Second translation'),
      makeTranslation('plural', { one: '1', other: '+', zero: '0' }),
    ];

    const [newAST, hasChanged] = writeTranslationsIntoAST(
      codeToAST(initialCode),
      'en',
      translationsToWrite,
      FILENAME,
      availableLocales,
    );

    expect(astToCode(newAST)).toBe(initialCode);
    expect(hasChanged).toBe(false);
  });

  test('Adding 0 translations does not change the i18n AST, and returns a false `hasChanged` boolean', () => {
    const translationsToWrite = [];
    const [newAST, hasChanged] = writeTranslationsIntoAST(
      codeToAST(DEFAULT_I18N_CODE),
      'en',
      translationsToWrite,
      FILENAME,
      availableLocales,
    );

    expect(astToCode(newAST)).toBe(DEFAULT_I18N_CODE);
    expect(hasChanged).toBe(false);
  });

  test('Adding translations to default i18n AST', () => {
    const translationsToWrite = [
      makeTranslation('hello', 'Hello this is a value'),
      makeTranslation('Id with spaces', 'Id with spaces'),
      makeTranslation('plural', { one: '1', other: '+', zero: '0' }),
    ];
    const [newAST, hasChanged] = writeTranslationsIntoAST(
      codeToAST(DEFAULT_I18N_CODE),
      'en',
      translationsToWrite,
      FILENAME,
      availableLocales,
    );

    expect(astToCode(newAST)).toBe(
      makeI18NCode(`{
        en: {
          hello: 'Hello this is a value',
          plural: {
            one: '1',
            other: '+',
            zero: '0',
          },
          'Id with spaces': 'Id with spaces',
        },
        fr: {},
      }`),
    );
    expect(hasChanged).toBe(true);
  });

  test('Adding translations to an already populated i18n AST, and `hasChanged` boolean should be true', () => {
    const initialCode = makeI18NCode(`{
      en: {
        first: 'First translation',
      },
      fr: {},
    }`);

    const translationsToWrite = [
      makeTranslation('first', 'First translation'),
      makeTranslation('hello', 'Hello this is a value'),
      makeTranslation('Id with spaces', 'Id with spaces'),
      makeTranslation('plural', { one: '1', other: '+', zero: '0' }),
    ];

    const [newAST, hasChanged] = writeTranslationsIntoAST(
      codeToAST(initialCode),
      'en',
      translationsToWrite,
      FILENAME,
      availableLocales,
    );

    // 'first' should have been kept unchanged.
    // 'hello', 'Id with spaces' and 'plural' should have been added.
    expect(astToCode(newAST)).toBe(
      makeI18NCode(`{
        en: {
          first: 'First translation',
          hello: 'Hello this is a value',
          plural: {
            one: '1',
            other: '+',
            zero: '0',
          },
          'Id with spaces': 'Id with spaces',
        },
        fr: {},
      }`),
    );
    expect(hasChanged).toBe(true);
  });

  test('Removing translations on an already populated i18n AST, and `hasChanged` boolean should be true', () => {
    const initialCode = makeI18NCode(`{
      en: {
        first: 'First translation',
        second: 'Second translation - this should be removed',
        plural: {
          one: '1',
          other: '+',
          zero: '0',
        },
      },
      fr: {
        first: 'Première traduction',
        second: 'Deuxième traduction',
      },
    }`);

    const translationsToWrite = [makeTranslation('first', 'First translation')];
    const [newAST, hasChanged] = writeTranslationsIntoAST(
      codeToAST(initialCode),
      'en',
      translationsToWrite,
      FILENAME,
      availableLocales,
    );

    // 'second' and 'plural' should have been removed.
    expect(astToCode(newAST)).toBe(
      makeI18NCode(`{
        en: {
          first: 'First translation',
        },
        fr: {
          first: 'Première traduction',
        },
      }`),
    );
    expect(hasChanged).toBe(true);
  });

  test('Changing a translation value, but keeping the id the same, and `hasChanged` boolean should be true', () => {
    const initialCode = makeI18NCode(`{
      en: {
        someId: 'This is the initial value',
      },
      fr: {},
    }`);

    const translationsToWrite = [
      makeTranslation('someId', 'This is a new value!'),
    ];

    const [newAST, hasChanged] = writeTranslationsIntoAST(
      codeToAST(initialCode),
      'en',
      translationsToWrite,
      FILENAME,
      availableLocales,
    );

    // 'someId' should be kept, but the value is changed
    expect(astToCode(newAST)).toBe(
      makeI18NCode(`{
        en: {
          someId: 'This is a new value!',
        },
        fr: {},
      }`),
    );
    expect(hasChanged).toBe(true);
  });

  test('Plural: changing a translation value, but keeping the id the same, and `hasChanged` boolean should be true', () => {
    const initialCode = makeI18NCode(`{
      en: {
        plural: {
          one: '1', 
          other: '+',
          zero: '0',
        },
      },
      fr: {},
    }`);

    const translationsToWrite = [
      makeTranslation('plural', { one: 'uno', other: 'otro', zero: 'cero' }),
    ];

    const [newAST, hasChanged] = writeTranslationsIntoAST(
      codeToAST(initialCode),
      'en',
      translationsToWrite,
      FILENAME,
      availableLocales,
    );

    // 'plural' should be kept, but the value is changed
    expect(astToCode(newAST)).toBe(
      makeI18NCode(`{
        en: {
          plural: {
            one: 'uno', 
            other: 'otro',
            zero: 'cero',
          },
        },
        fr: {},
      }`),
    );
    expect(hasChanged).toBe(true);
  });

  test('Changing a translation value, but keeping the id the same, means @outOfSync should be added', () => {
    const initialCode = makeI18NCode(`{
      en: {
        someId: 'This is the initial value',
      },
      fr: {
        someId: 'This is the initial value',
      },
    }`);

    const translationsToWrite = [
      makeTranslation('someId', 'This is a new value!'),
    ];

    const [newAST, hasChanged] = writeTranslationsIntoAST(
      codeToAST(initialCode),
      'en',
      translationsToWrite,
      FILENAME,
      availableLocales,
    );

    // 'someId' should be kept, but the value is changed
    expect(astToCode(newAST)).toBe(
      makeI18NCode(`{
        en: {
          someId: 'This is a new value!',
        },
        fr: {
          // @outOfSync
          someId: 'This is the initial value',
        },
      }`),
    );
    expect(hasChanged).toBe(true);
  });

  test('Changing a translation id, but keeping the value the same, means old ids should be updated', () => {
    const initialCode = makeI18NCode(`{
      en: {
        oldId: 'This is the value',
      },
      fr: {
        oldId: 'This is the value',
      },
    }`);

    const translationsToWrite = [makeTranslation('newId', 'This is the value')];

    const [newAST, hasChanged] = writeTranslationsIntoAST(
      codeToAST(initialCode),
      'en',
      translationsToWrite,
      FILENAME,
      availableLocales,
    );

    // The value should be the same, but its key is now 'newId'
    expect(astToCode(newAST)).toBe(
      makeI18NCode(`{
        en: {
          newId: 'This is the value',
        },
        fr: {
          newId: 'This is the value',
        },
      }`),
    );
    expect(hasChanged).toBe(true);
  });

  test('Plural: changing a translation id, but keeping the value the same, means old ids should be updated', () => {
    const initialCode = makeI18NCode(`{
      en: {
        plural: { 
          one: '1', 
          other: '+',
          zero: '0',
        },
      },
      fr: {
        plural: { 
          one: '1', 
          other: '+',
          zero: '0',
        },
      },
    }`);

    const translationsToWrite = [
      makeTranslation('valueCounts', { one: '1', other: '+', zero: '0' }),
    ];

    const [newAST, hasChanged] = writeTranslationsIntoAST(
      codeToAST(initialCode),
      'en',
      translationsToWrite,
      FILENAME,
      availableLocales,
    );

    // The value should be the same, but its key is now 'valueCounts'
    expect(astToCode(newAST)).toBe(
      makeI18NCode(`{
        en: {
          valueCounts: { 
            one: '1', 
            other: '+',
            zero: '0',
          },
        },
        fr: {
          valueCounts: { 
            one: '1', 
            other: '+',
            zero: '0' 
          },
        },
      }`),
    );
    expect(hasChanged).toBe(true);
  });

  test('Incoming value that matches multiple existing values treated as new translation', () => {
    const initialCode = makeI18NCode(`{
      en: {
        oldId: 'This is the value',
        oldId2: 'This is the value',
        oldPluralId1: { 
          one: '1', 
          other: '+',
          zero: '0',
        },
        oldPluralId2: { 
          one: '1', 
          other: '+',
          zero: '0',
        }
      },
      fr: {
        oldId: 'French value',
        oldId2: 'French value',
        oldPluralId1: { 
          one: '1', 
          other: '+', 
          zero: '0',
        },
        oldPluralId2: { 
          one: '1', 
          other: '+', 
          zero: '0',
        }
      }
    }`);

    const translationsToWrite = [
      makeTranslation('newId', 'This is the value'),
      makeTranslation('newPluralId', {
        one: '1',
        other: '+',
        zero: '0',
      }),
    ];

    const [newAST, hasChanged] = writeTranslationsIntoAST(
      codeToAST(initialCode),
      'en',
      translationsToWrite,
      FILENAME,
      availableLocales,
    );

    expect(astToCode(newAST)).toBe(
      makeI18NCode(`{
        en: {
          newId: 'This is the value',
          newPluralId: { 
            one: '1', 
            other: '+',
            zero: '0',
          }
        },
        fr: {},
      }`),
    );
    expect(hasChanged).toBe(true);
  });

  test('Multiple incoming values that match an existing value are treated as new translations', () => {
    const initialCode = makeI18NCode(`{
      en: {
        oldId: 'This is the value',
        pluralId: {
          one: '1',
          other: '+',
          zero: '0',
        }
      },
      fr: {
        oldId: 'French value',
        pluralId: {
          one: '1',
          other: '+',
          zero: '0',
        }
      }
    }`);

    const translationsToWrite = [
      makeTranslation('newId1', 'This is the value'),
      makeTranslation('newId2', 'This is the value'),
      makeTranslation('newPluralId1', {
        one: '1',
        other: '+',
        zero: '0',
      }),
      makeTranslation('newPluralId2', {
        one: '1',
        other: '+',
        zero: '0',
      }),
    ];

    const [newAST, hasChanged] = writeTranslationsIntoAST(
      codeToAST(initialCode),
      'en',
      translationsToWrite,
      FILENAME,
      availableLocales,
    );

    expect(astToCode(newAST)).toBe(
      makeI18NCode(`{
        en: {
          newId1: 'This is the value',
          newId2: 'This is the value',
          newPluralId1: {
            one: '1',
            other: '+',
            zero: '0',
          },
          newPluralId2: {
            one: '1',
            other: '+',
            zero: '0',
          }
        },
        fr: {},
      }`),
    );

    expect(hasChanged).toBe(true);
  });

  test('Changing a translation value/keeping the id the same does not add a second @outOfSync tag if one exists', () => {
    const initialCode = makeI18NCode(`{
      en: {
        someId: 'This is the initial value',
      },
      fr: {
        // @outOfSync
        someId: 'This is the initial value',
      },
    }`);

    const translationsToWrite = [
      makeTranslation('someId', 'This is a new value!'),
    ];

    const [newAST, hasChanged] = writeTranslationsIntoAST(
      codeToAST(initialCode),
      'en',
      translationsToWrite,
      FILENAME,
      availableLocales,
    );

    // 'someId' should be kept, but the value is changed
    expect(astToCode(newAST)).toBe(
      makeI18NCode(`{
        en: {
          someId: 'This is a new value!',
        },
        fr: {
          // @outOfSync
          someId: 'This is the initial value',
        },
      }`),
    );
    expect(hasChanged).toBe(true);
  });
});
