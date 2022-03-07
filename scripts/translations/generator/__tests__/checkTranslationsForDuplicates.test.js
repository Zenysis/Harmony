/**
 * This file tests the `checkTranslationsForDuplicates` function. We check
 * if any translation ids are duplicated in a file, or across multiple files.
 */
const TranslationGroup = require('../../util/TranslationGroup');
const TranslationRecord = require('../../util/TranslationRecord');
const checkTranslationsForDuplicates = require('../checkTranslationsForDuplicates');

function makeTranslation(id, value) {
  return TranslationRecord.create({ id, value });
}

describe('i18n generator: checkTranslationsForDuplicates', () => {
  test('Empty array input returns empty array output', () => {
    expect(checkTranslationsForDuplicates([])).toEqual([]);
  });

  test('Duplicates are flagged in the same file', () => {
    const input = [
      TranslationGroup.create({
        filename: 'file1',
        translations: [
          makeTranslation('badId', 'foo'),
          makeTranslation('badId', 'bar'),
        ],
      }),
      TranslationGroup.create({
        filename: 'file2',
        translations: [
          makeTranslation('unique1', 'foo'),
          makeTranslation('unique2', 'bar'),
        ],
      }),
    ];

    expect(checkTranslationsForDuplicates(input)).toEqual([
      {
        message: expect.stringMatching(/badId.*file1/s),
      },
    ]);
  });

  test('Duplicates are flagged in different files', () => {
    const input = [
      TranslationGroup.create({
        filename: 'file1',
        translations: [
          makeTranslation('badId', 'foo'),
          makeTranslation('unique1', 'foo'),
        ],
      }),
      TranslationGroup.create({
        filename: 'file2',
        translations: [
          makeTranslation('badId', 'bar'),
          makeTranslation('unique2', 'bar'),
        ],
      }),
    ];

    expect(checkTranslationsForDuplicates(input)).toEqual([
      {
        message: expect.stringMatching(/badId.*file1.*file2/s),
      },
    ]);
  });

  test('Translation groups with no duplicates flag no errors', () => {
    const input = [
      TranslationGroup.create({
        filename: 'file1',
        translations: [
          makeTranslation('unique1', 'a'),
          makeTranslation('unique2', 'b'),
        ],
      }),
      TranslationGroup.create({
        filename: 'file2',
        translations: [
          makeTranslation('unique3', 'c'),
          makeTranslation('unique4', 'd'),
        ],
      }),
    ];

    expect(checkTranslationsForDuplicates(input)).toEqual([]);
  });
});
