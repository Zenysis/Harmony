// @flow
import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import SettingsModalWrapper from 'components/visualizations/common/SettingsModal/__mocks__/SettingsModalWrapper';

/**
 * Test the Table-specific settings changes
 */
describe('Settings Modal: Table', () => {
  test('Switching between Table to Scorecard changes the Display Options', () => {
    // when we click on Scorecard, 'Paginate results' should switch to
    // 'Invert coloration'
    render(<SettingsModalWrapper />);

    // click on 'Scorecard'
    fireEvent.click(screen.getByRole('radio', { name: /scorecard/i }));
    expect(screen.getByText(/invert coloration/i)).toBeInTheDocument();

    // now switch back: click on 'Table'
    fireEvent.click(screen.getByRole('radio', { name: /table/i }));
    expect(screen.getByText(/paginate results/i)).toBeInTheDocument();
  });
});
