/**
 * This file tests functions in the `TranslationGroup` class.
 */
const TranslationGroup = require('../TranslationGroup');
const TranslationRecord = require('../TranslationRecord');

const TEST_FILENAME = 'i18n.js';

describe('i18n util: TranslationGroup class', () => {
  test('`hasTranslations` detects group with translations', () => {
    const group = TranslationGroup.create({
      filename: TEST_FILENAME,
      translations: [
        TranslationRecord.create({
          id: 'test-id',
          value: 'This is a test',
        }),
      ],
    });
    expect(group.hasTranslations()).toBe(true);
  });

  test('`hasTranslations` detects group with empty translations', () => {
    const emptyGroup = TranslationGroup.create({
      filename: TEST_FILENAME,
      translations: [],
    });
    expect(emptyGroup.hasTranslations()).toBe(false);
  });
});
