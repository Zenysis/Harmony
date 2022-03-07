// @flow
import * as React from 'react';
import { render, screen } from '@testing-library/react';

// NOTE(pablo): intentionally not imported as `I18N` so we don't trigger our
// translation generation script on this file
import TestI18N from 'lib/I18N';

TestI18N.registerTranslations({
  en: {
    Hello: 'Hello',
    'Hello, %(name)s': 'Hello, %(name)s',
    interpolated: 'Hello, %(name)s',
    'interpolated-plural': {
      one: 'One %(item)s',
      other: 'Multiple %(item)s',
      zero: 'No %(item)s',
    },
    'plural-id': {
      one: 'One thing',
      other: 'Things',
      zero: 'Nothing',
    },
    'some-id': 'These are multiple words',
  },
});

describe('I18N React component', () => {
  test('<I18N>Text</I18N> renders text', () => {
    render(<TestI18N>Hello</TestI18N>);
    const txt = screen.getByText('Hello');
    expect(txt).toHaveTextContent('Hello');
  });

  test('<I18N id="some-id">Text</I18N> renders text', () => {
    render(<TestI18N id="some-id">These are multiple words</TestI18N>);
    const txt = screen.getByText('These are multiple words');
    expect(txt).toHaveTextContent('These are multiple words');
  });

  test('<I18N.Ref id="some-id" /> renders the text referenced by the id', () => {
    render(<TestI18N.Ref id="some-id" />);
    const txt = screen.getByText('These are multiple words');
    expect(txt).toHaveTextContent('These are multiple words');
  });
});

describe('I18N.text functions', () => {
  test('I18N.text(txt) renders text', () => {
    const txt = TestI18N.text('Hello');
    expect(txt).toBe('Hello');
  });

  test('I18N.text(txt, id) renders text', () => {
    const txt = TestI18N.text('These are multiple words', 'some-id');
    expect(txt).toBe('These are multiple words');
  });

  test('I18N.text(pluralObj, id, config) renders plural text (zero)', () => {
    const txt = TestI18N.text(
      { one: 'One thing', other: 'Things', zero: 'Nothing' },
      'plural-id',
      { count: 0 },
    );
    expect(txt).toBe('Nothing');
  });

  test('I18N.text(pluralObj, id, config) renders plural text (one)', () => {
    const txt = TestI18N.text(
      { one: 'One thing', other: 'Things', zero: 'Nothing' },
      'plural-id',
      { count: 1 },
    );
    expect(txt).toBe('One thing');
  });

  test('I18N.text(pluralObj, id, config) renders plural text (other)', () => {
    const txt = TestI18N.text(
      { one: 'One thing', other: 'Things', zero: 'Nothing' },
      'plural-id',
      { count: 708 },
    );
    expect(txt).toBe('Things');
  });

  test('I18N.textById(id) renders the text referenced by the id', () => {
    const txt = TestI18N.text('some-id');
    expect(txt).toBe('These are multiple words');
  });

  test('I18N.textById(id) renders the (plural) text referenced by the id', () => {
    const txt = TestI18N.textById('plural-id', { count: 0 });
    expect(txt).toBe('Nothing');
  });
});

describe('I18N interpolation', () => {
  test('<I18N> with an id interpolates a JS primitive value, such as a string', () => {
    render(
      <TestI18N id="interpolated" name="Pablo">
        Hello, %(name)s
      </TestI18N>,
    );
    const txt = screen.getByText(/Hello/);
    expect(txt).toHaveTextContent('Hello, Pablo');
  });

  test('<I18N> (without an id) interpolates a JS primitive value, such as a string', () => {
    render(<TestI18N name="Pablo">Hello, %(name)s</TestI18N>);
    const txt = screen.getByText(/Hello/);
    expect(txt).toHaveTextContent('Hello, Pablo');
  });

  test('<I18N.Ref id="interpolated" /> interpolates a JS primitive value', () => {
    render(<TestI18N.Ref id="interpolated" name="Pablo" />);
    const txt = screen.getByText(/Hello/);
    expect(txt).toHaveTextContent('Hello, Pablo');
  });

  test('I18N.text(txt, config) interpolates a JS primitive value, such as a string', () => {
    const txt = TestI18N.text('Hello, %(name)s', { name: 'Pablo' });
    expect(txt).toBe('Hello, Pablo');
  });

  test('I18N.text(txt, id, config) interpolates a JS primitive value, such as a string', () => {
    const txt = TestI18N.text('Hello, %(name)s', 'interpolated', {
      name: 'Pablo',
    });
    expect(txt).toBe('Hello, Pablo');
  });

  test('I18N.text(pluralObject, id, config) interpolates a JS primitive value, such as a string', () => {
    const txt = TestI18N.text(
      { one: 'One %(item)s', other: 'Multiple %(item)s', zero: 'No %(item)s' },
      'interpolated-plural',
      {
        count: 3,
        item: 'fish',
      },
    );
    expect(txt).toBe('Multiple fish');
  });

  test('I18N.textById(id, config) interpolates a JS primitive value', () => {
    const txt = TestI18N.textById('interpolated', {
      name: 'Pablo',
    });
    expect(txt).toBe('Hello, Pablo');
  });

  test('<I18N> interpolates with a React node', () => {
    render(<TestI18N name={<div>Pablo</div>}>Hello, %(name)s</TestI18N>);
    const txt = screen.getByText(/Hello/);
    expect(txt).toHaveTextContent('Hello, Pablo');
  });

  test('<I18N.Ref id="interpolated"> interpolates with a React node', () => {
    render(<TestI18N.Ref id="interpolated" name={<div>Pablo</div>} />);
    const txt = screen.getByText(/Hello/);
    expect(txt).toHaveTextContent('Hello, Pablo');
  });
});
