const prettier = require('prettier');

const { PRETTIER_CONFIG } = require('../../util/config');
const TranslationGroup = require('../../util/TranslationGroup');
const TranslationRecord = require('../../util/TranslationRecord');
const collectTranslationsFromI18NFile = require('../collectTranslationsFromI18NFile');

/**
 * This file tests the `collectTranslationsFromI18NFile` function. We check
 * that the TranslationGroup generated for an i18n.js file is correct.
 */
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

const TEST_FILENAME = 'test/i18n.js';

describe('i18n exporter: collectTranslationsFromI18NFile', () => {
  test("Empty i18n 'en' object", () => {
    const initialCode = makeI18NCode(`{
      en: {},
      fr: {},
    }`);
    const group = collectTranslationsFromI18NFile(
      TEST_FILENAME,
      initialCode,
      'en',
    );
    expect(group).toEqual(
      TranslationGroup.create({
        filename: TEST_FILENAME,
        translations: [],
      }),
    );
  });

  test('Empty i18n non-en object', () => {
    const initialCode = makeI18NCode(`{
      en: {},
      fr: {},
    }`);
    const group = collectTranslationsFromI18NFile(
      TEST_FILENAME,
      initialCode,
      'fr',
    );
    expect(group).toEqual(
      TranslationGroup.create({
        filename: TEST_FILENAME,
        translations: [],
      }),
    );
  });

  test("Collect 'en' translations", () => {
    const initialCode = makeI18NCode(`{
      en: {
        hello1: 'test1',
        hello2: 'test2',
        plural: {
          zero: 'Nothing',
          one: 'One thing',
          other: 'Multiple things'
        }
      },
      fr: {},
    }`);
    const group = collectTranslationsFromI18NFile(
      TEST_FILENAME,
      initialCode,
      'en',
    );
    expect(group).toEqual(
      TranslationGroup.create({
        filename: TEST_FILENAME,
        translations: [
          TranslationRecord.create({
            id: 'hello1',
            outOfSync: false,
            value: 'test1',
          }),
          TranslationRecord.create({
            id: 'hello2',
            outOfSync: false,
            value: 'test2',
          }),
          TranslationRecord.create({
            id: 'plural',
            outOfSync: false,
            value: {
              one: 'One thing',
              other: 'Multiple things',
              zero: 'Nothing',
            },
          }),
        ],
      }),
    );
  });

  test('Collect non-en translations', () => {
    const initialCode = makeI18NCode(`{
      en: {
        ignoreThis: 'ignore',
        ignoreThisOneToo: 'also ignore',
      },
      fr: {
        hello1: 'test1',
        hello2: 'test2',
        plural: {
          zero: 'Nothing',
          one: 'One thing',
          other: 'Multiple things'
        }
      },
    }`);
    const group = collectTranslationsFromI18NFile(
      TEST_FILENAME,
      initialCode,
      'fr',
    );
    expect(group).toEqual(
      TranslationGroup.create({
        filename: TEST_FILENAME,
        translations: [
          TranslationRecord.create({
            id: 'hello1',
            outOfSync: false,
            value: 'test1',
          }),
          TranslationRecord.create({
            id: 'hello2',
            outOfSync: false,
            value: 'test2',
          }),
          TranslationRecord.create({
            id: 'plural',
            outOfSync: false,
            value: {
              one: 'One thing',
              other: 'Multiple things',
              zero: 'Nothing',
            },
          }),
        ],
      }),
    );
  });

  test('Collect out of sync translations', () => {
    const initialCode = makeI18NCode(`{
      en: {
        ignoreThis: 'ignore',
        ignoreThisOneToo: 'also ignore',
      },
      fr: {
        hello1: 'test1',
        // outOfSync
        hello2: 'test2',
      },
    }`);
    const group = collectTranslationsFromI18NFile(
      TEST_FILENAME,
      initialCode,
      'fr',
    );
    expect(group).toEqual(
      TranslationGroup.create({
        filename: TEST_FILENAME,
        translations: [
          TranslationRecord.create({
            id: 'hello1',
            outOfSync: false,
            value: 'test1',
          }),
          TranslationRecord.create({
            id: 'hello2',
            outOfSync: false,
            value: 'test2',
          }),
        ],
      }),
    );
  });
});
