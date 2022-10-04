/**
 * This file tests the `collectReferencesFromFile` function.
 * This is where we extract the translations for <I18N.Ref> and I18N.textById() uses.
 */
const collectReferencesFromFile = require('../collectReferencesFromFile');

const FILENAME = 'testFile.js';

describe('i18n generator: collectReferencesFromFile', () => {
  test('File with no translations should return empty array', () => {
    const code = `
    import I18N from 'lib/I18N';
    // do nothing
    `;

    expect(collectReferencesFromFile(FILENAME, code)).toEqual([]);
  });

  test('Collect <I18N.Ref> reference ids', () => {
    const code = `
    import I18N from 'lib/I18N';
    export default function MyComponent() {
      return (
        <div>
          <I18N.Ref id="Hello"/>
          <I18N.Ref 
            id="Hello this is a
          multiline test"
          />
        </div>
      );
    }
    `;

    expect(collectReferencesFromFile(FILENAME, code)).toEqual([
      'Hello',
      'Hello this is a multiline test',
    ]);
  });

  test('Collect <I18N.Ref> reference id with periods', () => {
    const code = `
    import I18N from 'lib/I18N';
    export default function MyComponent() {
      return (
        <div>
          <I18N.Ref id="Period."/>
        </div>
      );
    }
    `;

    expect(collectReferencesFromFile(FILENAME, code)).toEqual(['Period_']);
  });

  test('Collect <I18N.Ref> references, but ignore <I18N>', () => {
    const code = `
    import I18N from 'lib/I18N';
    export default function MyComponent() {
      return (
        <div>
          <I18N>First</I18N>
          <I18N id="hello">Hello</I18N>
          <I18N.Ref id="Do not ignore this" />
        </div>
      );
    }
    `;

    expect(collectReferencesFromFile(FILENAME, code)).toEqual([
      'Do not ignore this',
    ]);
  });

  test('Collect <I18N.Ref> references, even if they have a config and interpolation', () => {
    const code = `
    import I18N from 'lib/I18N';
    export default function MyComponent({ name }) {
      return (
        <>
          <I18N.Ref id="greeting" name={name}/>
        </>
      );
    }
    `;

    expect(collectReferencesFromFile(FILENAME, code)).toEqual(['greeting']);
  });

  test('Throw error when I18N.textById() is called with no arguments', () => {
    const code = `
    import I18N from 'lib/I18N';
    export default function MyComponent() {
      return I18N.textById();
    }
    `;
    expect(() => collectReferencesFromFile(FILENAME, code)).toThrow();
  });

  test('Collect I18N.textById() reference ids', () => {
    const code = `
    import I18N from 'lib/I18N';
    export const val1 = I18N.textById('Test1');
    export const val2 = I18N.textById('Test2');
    `;

    expect(collectReferencesFromFile(FILENAME, code)).toEqual([
      'Test1',
      'Test2',
    ]);
  });

  test('Collect I18N.textById() reference ids with periods', () => {
    const code = `
    import I18N from 'lib/I18N';
    export const val1 = I18N.textById('Period.');
    `;

    expect(collectReferencesFromFile(FILENAME, code)).toEqual(['Period_']);
  });

  test('Collect pluralized I18N.textById() references', () => {
    const code = `
    import I18N from 'lib/I18N';
    export const val = I18N.textById('plural-id', {
        count: 2
      });
    `;
    expect(collectReferencesFromFile(FILENAME, code)).toEqual(['plural-id']);
  });

  test('Collect I18N.textById() references, but ignore I18N.text()', () => {
    const code = `
    import I18N from 'lib/I18N';
    export const val1 = I18N.text('Hello', 'hello');
    export const val2 = I18N.textById('my_id');
    `;

    expect(collectReferencesFromFile(FILENAME, code)).toEqual(['my_id']);
  });

  test('Collect I18N.textById() references, even if they have a config and interpolation', () => {
    const code = `
    import I18N from 'lib/I18N';
    export const val = I18N.textById('Hello, %(name)s', { name: 'Isabel' });
    `;
    expect(collectReferencesFromFile(FILENAME, code)).toEqual([
      'Hello, %(name)s',
    ]);
  });

  test('Collect both <I18N.Ref> and I18N.textById() references from the same file', () => {
    const code = `
    import I18N from 'lib/I18N';
    export const val = I18N.textById('Hello');
    export default function MyComponent() {
      return (
        <div>
          <I18N.Ref id="Hello this is a test"/>
        </div>
      );
    }
    `;
    expect(collectReferencesFromFile(FILENAME, code)).toEqual([
      'Hello',
      'Hello this is a test',
    ]);
  });
});
