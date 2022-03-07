// @flow
import * as React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

import SettingsModalWrapper from 'components/visualizations/common/SettingsModal/__mocks__/SettingsModalWrapper';

beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

/**
 * Run tests for the General Settings tab (with the exception of viz-specific
 * settings which should be tested in separate files, such as in
 * `tableSettings.test.jsx`).
 */
describe('Settings Modal: General Settings', () => {
  test('Title and subtitle updates when input boxes update', () => {
    render(<SettingsModalWrapper />);

    const titleStr = 'Test title';
    const subtitleStr = 'Test subtitle';
    const title = screen.getByRole('textbox', { name: 'title' });
    const subtitle = screen.getByRole('textbox', { name: 'subtitle' });

    // change title and subtitle
    fireEvent.change(title, { target: { value: titleStr } });
    fireEvent.change(subtitle, { target: { value: subtitleStr } });

    // advance our timers, because the Title input texts are debounced, so that
    // we need to trigger the change event
    act(() => jest.advanceTimersByTime(1000));

    expect(title).toHaveValue(titleStr);
    expect(subtitle).toHaveValue(subtitleStr);
  });

  test('Title and subtitle font sizes update when dropdown changes', () => {
    render(<SettingsModalWrapper />);
    const newTitleSize = '14';
    const newSubtitleSize = '12';

    // change the title font size
    const titleFontSizeDropdown = screen.getByRole('button', {
      name: 'title font size',
    });
    fireEvent.click(titleFontSizeDropdown);
    fireEvent.click(screen.getByRole('option', { name: newTitleSize }));

    // change the subtitle font size
    const subtitleFontSizeDropdown = screen.getByRole('button', {
      name: 'subtitle font size',
    });
    fireEvent.click(subtitleFontSizeDropdown);
    fireEvent.click(screen.getByRole('option', { name: newSubtitleSize }));

    expect(titleFontSizeDropdown.textContent).toBe(newTitleSize);
    expect(subtitleFontSizeDropdown.textContent).toBe(newSubtitleSize);
  });

  test('Title font family updates when dropdown changes', () => {
    render(<SettingsModalWrapper />);
    const newFontFamily = 'courier new';

    // change the font family
    const fontDropdown = screen.getByRole('button', { name: 'title font' });
    fireEvent.click(fontDropdown);
    fireEvent.click(screen.getByRole('option', { name: newFontFamily }));
    expect(fontDropdown.textContent.toLowerCase()).toBe(newFontFamily);
  });
});
