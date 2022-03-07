/**
 * This file tests the `collectTranslationsFromFile` function.
 * This is where we extract the translations for <I18N> and I18N.text() uses.
 */
const TranslationGroup = require('../../util/TranslationGroup');
const TranslationRecord = require('../../util/TranslationRecord');
const collectTranslationsFromFile = require('../collectTranslationsFromFile');

const FILENAME = 'testFile.js';

function makeTranslation(id, value) {
  return TranslationRecord.create({ id, value });
}

function makeTranslationGroup(filename, translations) {
  return TranslationGroup.create({ filename, translations });
}

describe('i18n generator: collectTranslationsFromFile', () => {
  test('File with no translations should return empty array', () => {
    const code = `
    import I18N from 'lib/I18N';
    // do nothing
    `;

    expect(collectTranslationsFromFile(FILENAME, code)).toEqual(
      makeTranslationGroup(FILENAME, []),
    );
  });

  test('Throw error when <I18N> has no children', () => {
    const code = `
    import I18N from 'lib/I18N';
    export default function MyComponent() {
      return <I18N />;
    }
    `;
    expect(() => collectTranslationsFromFile(FILENAME, code)).toThrow();
  });

  test('Throw error when <I18N> has more than 1 child', () => {
    const code = `
    import I18N from 'lib/I18N';
    export default function MyComponent({ foo, bar }) {
      return <I18N>{foo}{bar}</I18N>;
    }
    `;
    expect(() => collectTranslationsFromFile(FILENAME, code)).toThrow();
  });

  test('Throw error when <I18N> has non-JSXText child', () => {
    const code = `
    import I18N from 'lib/I18N';
    export default function MyComponent() {
      return <I18N><div>Hello</div></I18N>;
    }
    `;
    expect(() => collectTranslationsFromFile(FILENAME, code)).toThrow();
  });

  test('Throw error when <I18N> has a non-string-literal id', () => {
    const code = `
    import I18N from 'lib/I18N';
    export default function MyComponent({ foo }) {
      return <I18N id={foo}>Hello</I18N>;
    }
    `;
    expect(() => collectTranslationsFromFile(FILENAME, code)).toThrow();
  });

  test('Collect <I18N> translations', () => {
    const code = `
    import I18N from 'lib/I18N';
    export default function MyComponent() {
      return (
        <div>
          <I18N>Hello</I18N>
          <I18N>Hello this is a test</I18N>
          <I18N>
            Hello this is a
            multiline test
          </I18N>
        </div>
      );
    }
    `;

    expect(collectTranslationsFromFile(FILENAME, code)).toEqual(
      makeTranslationGroup(FILENAME, [
        makeTranslation('Hello', 'Hello'),
        makeTranslation('Hello this is a test', 'Hello this is a test'),
        makeTranslation(
          'Hello this is a multiline test',
          'Hello this is a multiline test',
        ),
      ]),
    );
  });

  test('Collect <I18N> translations with ids', () => {
    const code = `
    import I18N from 'lib/I18N';
    export default function MyComponent() {
      return (
        <div>
          <I18N id="hello">Hello</I18N>
          <I18N id="this_is_a_test">Hello this is a test</I18N>
          <I18N id="some id">
            Hello this is a
            multiline test
          </I18N>
        </div>
      );
    }
    `;

    expect(collectTranslationsFromFile(FILENAME, code)).toEqual(
      makeTranslationGroup(FILENAME, [
        makeTranslation('hello', 'Hello'),
        makeTranslation('this_is_a_test', 'Hello this is a test'),
        makeTranslation('some id', 'Hello this is a multiline test'),
      ]),
    );
  });

  test('Collect <I18N> translations, but ignore <I18N.Ref>', () => {
    const code = `
    import I18N from 'lib/I18N';
    export default function MyComponent() {
      return (
        <div>
          <I18N>First</I18N>
          <I18N id="hello">Hello</I18N>
          <I18N.Ref id="ignore this" />
        </div>
      );
    }
    `;

    expect(collectTranslationsFromFile(FILENAME, code)).toEqual(
      makeTranslationGroup(FILENAME, [
        makeTranslation('First', 'First'),
        makeTranslation('hello', 'Hello'),
      ]),
    );
  });

  test('Collect <I18N> translations, even if they have a config and interpolation', () => {
    const code = `
    import I18N from 'lib/I18N';
    export default function MyComponent({ name }) {
      return (
        <>
          <I18N name={name}>Hello, %(name)s</I18N>
          <I18N name={name} id="some-id">Hello, %(name)s</I18N>
        </>
      );
    }
    `;

    expect(collectTranslationsFromFile(FILENAME, code)).toEqual(
      makeTranslationGroup(FILENAME, [
        makeTranslation('Hello, %(name)s', 'Hello, %(name)s'),
        makeTranslation('some-id', 'Hello, %(name)s'),
      ]),
    );
  });

  test('Throw error when I18N.text() is called with no arguments', () => {
    const code = `
    import I18N from 'lib/I18N';
    export default function MyComponent() {
      return I18N.text();
    }
    `;
    expect(() => collectTranslationsFromFile(FILENAME, code)).toThrow();
  });

  test('Throw error when I18N.text() is called with an pluralization object but no id', () => {
    const code = `
    import I18N from 'lib/I18N';
    export default function MyComponent() {
      return I18N.text({
        zero: 'Text for count=0',
        one: 'Text for count=1',
        other: 'Text for count>1'
      });
    }
    `;
    expect(() => collectTranslationsFromFile(FILENAME, code)).toThrow();
  });

  test('Collect I18N.text() translations', () => {
    const code = `
    import I18N from 'lib/I18N';
    export const val1 = I18N.text('Hello');
    export const val2 = I18N.text('Hello this is a test');
    `;

    expect(collectTranslationsFromFile(FILENAME, code)).toEqual(
      makeTranslationGroup(FILENAME, [
        makeTranslation('Hello', 'Hello'),
        makeTranslation('Hello this is a test', 'Hello this is a test'),
      ]),
    );
  });

  test('Collect pluralized I18N.text() translations', () => {
    const code = `
    import I18N from 'lib/I18N';
    const countVal = 2;
    export const val1 = I18N.text({
        zero: 'Nothing',
        one: 'One thing',
        other: 'Multiple things'
      }, 'plural-id', {count: countVal});
    export const val2 = I18N.text({
        zero: '%(count) matches :(',
        one: '%(count) match',
        other: '%(count) matches'
      }, 'match-id', {count: countVal});
    `;
    expect(collectTranslationsFromFile(FILENAME, code)).toEqual(
      makeTranslationGroup(FILENAME, [
        makeTranslation('plural-id', {
          one: 'One thing',
          other: 'Multiple things',
          zero: 'Nothing',
        }),
        makeTranslation('match-id', {
          one: '%(count) match',
          other: '%(count) matches',
          zero: '%(count) matches :(',
        }),
      ]),
    );
  });

  test('Collect I18N.text() translations with ids', () => {
    const code = `
    import I18N from 'lib/I18N';
    export const val1 = I18N.text('Hello', 'hello');
    export const val2 = I18N.text('Hello this is a test', 'my_id');
    `;

    expect(collectTranslationsFromFile(FILENAME, code)).toEqual(
      makeTranslationGroup(FILENAME, [
        makeTranslation('hello', 'Hello'),
        makeTranslation('my_id', 'Hello this is a test'),
      ]),
    );
  });

  test('Collect I18N.text() translations, but ignore I18N.textById', () => {
    const code = `
    import I18N from 'lib/I18N';
    export const val1 = I18N.text('Hello', 'hello');
    export const val2 = I18N.textById('my_id');
    `;

    expect(collectTranslationsFromFile(FILENAME, code)).toEqual(
      makeTranslationGroup(FILENAME, [makeTranslation('hello', 'Hello')]),
    );
  });

  test('Collect I18N.text() translations, even if they have a config and interpolation', () => {
    const code = `
    import I18N from 'lib/I18N';
    const name = 'Pablo';
    const someName = 'Pablo';
    export const val1 = I18N.text('Hello, %(name)s', { name });
    export const val2 = I18N.text('Hello, %(name)s!', { name: someName });
    export const val3 = I18N.text('Hello, %(name)s', 'some-id', { name });
    export const val4 = I18N.text('Hello, %(name)s', 'some-id-2', { name: someName });
    `;
    expect(collectTranslationsFromFile(FILENAME, code)).toEqual(
      makeTranslationGroup(FILENAME, [
        makeTranslation('Hello, %(name)s', 'Hello, %(name)s'),
        makeTranslation('Hello, %(name)s!', 'Hello, %(name)s!'),
        makeTranslation('some-id', 'Hello, %(name)s'),
        makeTranslation('some-id-2', 'Hello, %(name)s'),
      ]),
    );
  });

  test('Collect both <I18N> and I18N.text() translations from the same file', () => {
    const code = `
    import I18N from 'lib/I18N';
    export const val1 = I18N.text('Hello');
    export default function MyComponent() {
      return (
        <div>
          <I18N>Hello this is a test</I18N>
        </div>
      );
    }
    `;
    expect(collectTranslationsFromFile(FILENAME, code)).toEqual(
      makeTranslationGroup(FILENAME, [
        makeTranslation('Hello', 'Hello'),
        makeTranslation('Hello this is a test', 'Hello this is a test'),
      ]),
    );
  });
});
