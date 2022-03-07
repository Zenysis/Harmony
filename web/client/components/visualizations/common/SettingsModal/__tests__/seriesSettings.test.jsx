// @flow
import * as React from 'react';
import crypto from 'crypto';
import { act, fireEvent, render, screen, within } from '@testing-library/react';

import * as Zen from 'lib/Zen';
import AboveValueRule from 'models/core/QueryResultSpec/ValueRule/AboveValueRule';
import BelowValueRule from 'models/core/QueryResultSpec/ValueRule/BelowValueRule';
import DataAction from 'models/core/QueryResultSpec/DataAction';
import DataActionRule from 'models/core/QueryResultSpec/DataActionRule';
import InValueRangeRule from 'models/core/QueryResultSpec/ValueRule/InValueRangeRule';
import QueryResultSpec from 'models/core/QueryResultSpec';
import SettingsModalWrapper, {
  INITIAL_QUERY_SELECTIONS,
  TWO_FIELD_QUERY_SELECTIONS,
} from 'components/visualizations/common/SettingsModal/__mocks__/SettingsModalWrapper';
import { range } from 'util/arrayUtil';
import { uuid } from 'util/util';
import type Field from 'models/core/wip/Field';
import type QuerySelections from 'models/core/wip/QuerySelections';

beforeAll(() => {
  jest.useFakeTimers();
  Object.defineProperty(global.self, 'crypto', {
    value: {
      getRandomValues: arr => crypto.randomBytes(arr.length),
    },
  });
  window.HTMLElement.prototype.scrollIntoView = () => {};
});

afterAll(() => {
  jest.useRealTimers();
});

function renderSeriesSettings(
  initialSelections?: QuerySelections = INITIAL_QUERY_SELECTIONS,
  initialQueryResultSpec?: QueryResultSpec,
) {
  if (initialQueryResultSpec) {
    render(
      <SettingsModalWrapper
        initialSelections={initialSelections}
        initialQueryResultSpec={initialQueryResultSpec}
      />,
    );
  } else {
    render(<SettingsModalWrapper initialSelections={initialSelections} />);
  }
  fireEvent.click(screen.getByRole('button', { name: 'series' }));
}

// clicks the add rule button
function addColorRule() {
  fireEvent.click(
    screen.getAllByRole('button', {
      name: /create rule/i,
    })[0],
  );
}

// change the color of a ColorBlock UI component
function changeColor(colorBlock: HTMLElement, hexColor: string) {
  fireEvent.click(colorBlock);
  fireEvent.change(screen.getByRole('textbox', { name: 'hex color' }), {
    target: { value: hexColor },
  });
  fireEvent.click(screen.getByTestId('zen-popover-overlay'));

  // color block input is debounced so lets advance a timer
  act(() => jest.advanceTimersByTime(1000));
}

// assert that a given color block has the expected rgb background
function assertColorBlockBackground(colorBlock: HTMLElement, rgb: string) {
  expect(within(colorBlock).getByTestId('zen-inner-color-block')).toHaveStyle({
    background: rgb,
  });
}

// assert that all the series labels match the given fields in the correct
// order
function assertSeriesLabelsMatchFields(fields: Zen.Array<Field>) {
  const seriesNames = screen.getAllByRole('textbox', {
    name: 'series label',
  });
  expect(seriesNames.length).toBe(fields.size());
  seriesNames.forEach((inputElt, i) => {
    expect(inputElt).toHaveValue(fields.get(i).label());
  });
}

/**
 * Test Series Settings tab. For color rule tests, go to the next `describe`
 * block.
 */
describe('Settings Modal: Series Settings', () => {
  test('Multiple series rows render with the correct labels', () => {
    renderSeriesSettings(TWO_FIELD_QUERY_SELECTIONS);
    assertSeriesLabelsMatchFields(TWO_FIELD_QUERY_SELECTIONS.fields());
  });

  test('Series can be hidden, but not if there is only one left that is visible', () => {
    // set up variables
    const getHideButtons = () =>
      screen.getAllByRole('checkbox', { name: 'hide series' });
    const getShowButtons = () =>
      screen.getAllByRole('checkbox', { name: 'show series' });

    renderSeriesSettings(TWO_FIELD_QUERY_SELECTIONS);

    // hide the first series
    fireEvent.click(getHideButtons()[0]);

    // there should now be one hide and one show button
    expect(getHideButtons().length).toBe(1);
    expect(getShowButtons().length).toBe(1);

    // the remaining hide button should not be clickable, so firing a click
    // event shouldn't change anything
    fireEvent.click(getHideButtons()[0]);

    // there should STILL Be one hide and one show button
    expect(getHideButtons().length).toBe(1);
    expect(getShowButtons().length).toBe(1);
  });
});

/**
 * Test the color rules for the Series Settings tab
 */
describe('Settings Modal: Series Settings - Color Rules', () => {
  test('Add multiple color rules, change all their colors, then delete them all', () => {
    const rules = ['above average', 'below average', 'equal to null'];
    const colors = [
      { hex: '#123abc', rgb: 'rgb(18, 58, 188)' },
      { hex: '#bdd4fb', rgb: 'rgb(189, 212, 251)' },
      { hex: '#aaa', rgb: 'rgb(170, 170, 170)' },

      // hex color intentionally capitalized on this next one
      { hex: '#E4B142', rgb: 'rgb(228, 177, 66)' },
    ];

    renderSeriesSettings();
    range(3).forEach(() => addColorRule());

    screen
      .getAllByRole('button', { name: 'choose option' })
      .forEach((dropdown, i) => {
        fireEvent.click(dropdown);
        fireEvent.click(screen.getByRole('option', { name: rules[i] }));
      });

    screen.getAllByTestId('color-rule-color-block').forEach((colorBlock, i) => {
      changeColor(colorBlock, colors[i].hex);
    });

    // verify all colors changed correctly
    screen.getAllByTestId('color-rule-color-block').forEach((colorBlock, i) => {
      assertColorBlockBackground(colorBlock, colors[i].rgb);
    });

    // now delete all rules
    range(2).forEach(() =>
      screen
        .getAllByRole('button', { name: 'delete color rule' })
        .forEach(btn => fireEvent.click(btn)),
    );

    // there should be no color rules anymore
    expect(screen.queryByTestId('color-rule-row')).not.toBeInTheDocument();
  });

  test('Preset ranges generate the correct number of options', () => {
    const quantiles = [
      { quantile: /medians/i, num: 2 },
      { quantile: /tertiles/i, num: 3 },
      { quantile: /quartiles/i, num: 4 },
      { quantile: /quintiles/i, num: 5 },
      { quantile: /deciles/i, num: 10 },
    ];

    const selectQuantile = (quantile: RegExp) => {
      fireEvent.click(screen.getByRole('button', { name: 'quantiles' }));
      fireEvent.click(screen.getByRole('option', { name: quantile }));
    };

    renderSeriesSettings();
    addColorRule();
    fireEvent.click(screen.getByRole('button', { name: 'choose option' }));
    fireEvent.click(screen.getByRole('option', { name: 'preset ranges' }));

    // toggle all quantiles and verify that they generate the correct number
    // of rows
    quantiles.forEach(q => {
      selectQuantile(q.quantile);
      expect(
        screen.getAllByRole('textbox', { name: 'range label' }).length,
      ).toBe(q.num);
    });
  });

  test('Add custom ranges, edit their colors, then delete one range', () => {
    const colors = [
      { hex: '#123abc', rgb: 'rgb(18, 58, 188)' },
      { hex: '#bdd4fb', rgb: 'rgb(189, 212, 251)' },
      { hex: '#AAA', rgb: 'rgb(170, 170, 170)' },
    ];

    renderSeriesSettings();
    addColorRule();
    fireEvent.click(screen.getByRole('button', { name: 'choose option' }));
    fireEvent.click(screen.getByRole('option', { name: 'custom ranges' }));

    // add 2 new ranges
    range(2).forEach(() => {
      const addBtns = screen.getAllByRole('button', { name: 'add new range' });

      // click the last plus button
      fireEvent.click(addBtns[addBtns.length - 1]);
    });

    // change all the colors
    screen.getAllByTestId('color-rule-color-block').forEach((colorBlock, i) => {
      changeColor(colorBlock, colors[i].hex);
    });

    // verify all colors changed correctly
    screen.getAllByTestId('color-rule-color-block').forEach((colorBlock, i) => {
      assertColorBlockBackground(colorBlock, colors[i].rgb);
    });

    // now delete ONE rule and make sure the other colors are still correct
    const removeBtns = screen.getAllByRole('button', { name: 'remove range' });
    fireEvent.click(removeBtns[0]);
    colors.shift(); // remove the first color

    // verify the remaining colors are still correct
    screen.getAllByTestId('color-rule-color-block').forEach((colorBlock, i) => {
      assertColorBlockBackground(colorBlock, colors[i].rgb);
    });
  });

  test('Cannot select the same color rule twice for the same series', () => {
    renderSeriesSettings();
    addColorRule();

    fireEvent.click(screen.getByRole('button', { name: 'choose option' }));
    fireEvent.click(screen.getByRole('option', { name: 'above average' }));

    addColorRule();
    fireEvent.click(
      screen.getAllByRole('button', { name: 'choose option' })[1],
    );
    fireEvent.click(screen.getByRole('option', { name: 'above average' }));

    // verify the second dropdown still says 'Choose option' and it did not
    // change to the clicked option
    expect(
      screen.getAllByRole('button', { name: 'choose option' })[1].textContent,
    ).toMatch(/choose option/i);
  });

  test('Color rule with a 0 value does NOT show up empty in the input box', () => {
    const initialQueryResultSpec = QueryResultSpec.fromQuerySelections(
      ['TABLE'],
      INITIAL_QUERY_SELECTIONS,
    );
    // set up a query result spec that has 2 color rules with values set to 0
    const dataActionRule1 = DataActionRule.create({
      id: uuid(),
      series: new Set(['FIELD_1']),
      dataActions: [
        DataAction.create({
          color: '#333333',
          rule: AboveValueRule.create({ value: 0 }),
          label: 'above label',
          transformedText: undefined,
        }),
      ],
    });

    const dataActionRule2 = DataActionRule.create({
      id: uuid(),
      series: new Set(['FIELD_1']),
      dataActions: [
        DataAction.create({
          color: '#333333',
          rule: BelowValueRule.create({ value: 0 }),
          label: 'below label',
          transformedText: undefined,
        }),
      ],
    });

    const dataActionRule3 = DataActionRule.create({
      id: uuid(),
      series: new Set(['FIELD_1']),
      dataActions: [
        DataAction.create({
          color: '#333333',
          label: 'test value range',
          transformedText: undefined,
          rule: InValueRangeRule.create({
            startValue: 0,
            endValue: 0,
          }),
        }),
      ],
    });

    const newSpec = initialQueryResultSpec.updateDataActionRules(
      'TABLE',
      Zen.Array.create([dataActionRule1, dataActionRule2, dataActionRule3]),
    );

    renderSeriesSettings(INITIAL_QUERY_SELECTIONS, newSpec);
    const ruleButtons = screen.getAllByRole('button', {
      name: 'choose option',
    });
    const valueTextboxes = screen.getAllByRole('textbox', {
      name: 'enter a value',
    });
    const rangeLabelTextboxes = screen.getAllByRole('textbox', {
      name: 'range label',
    });

    expect(ruleButtons.length).toBe(3);
    expect(valueTextboxes.length).toBe(2);
    expect(ruleButtons[0]).toHaveTextContent(/values above/i);
    expect(ruleButtons[1]).toHaveTextContent(/values below/i);
    expect(valueTextboxes[0]).toHaveValue(0);
    expect(valueTextboxes[1]).toHaveValue(0);
    expect(rangeLabelTextboxes[0]).toHaveValue('above label');
    expect(rangeLabelTextboxes[1]).toHaveValue('below label');

    // now test the min/max values for the InValueRangeRule
    const minTextbox = screen.getByRole('textbox', { name: 'min' });
    const maxTextbox = screen.getByRole('textbox', { name: 'max' });
    expect(rangeLabelTextboxes[2]).toHaveValue('test value range');
    expect(minTextbox).toHaveValue(0);
    expect(maxTextbox).toHaveValue(0);
  });

  test('Value range min/max values are populated correctly from a QueryResultSpec', () => {
    const initialQueryResultSpec = QueryResultSpec.fromQuerySelections(
      ['TABLE'],
      INITIAL_QUERY_SELECTIONS,
    );

    const dataActions = [
      DataAction.create({
        color: '#333333',
        label: 'test value range',
        transformedText: undefined,
        rule: InValueRangeRule.create({
          startValue: 10,
          endValue: 200,
        }),
      }),
    ];

    const actionRules = DataActionRule.create({
      id: uuid(),
      series: new Set(['FIELD_1']),
      dataActions,
    });

    const newSpec = initialQueryResultSpec.updateDataActionRules(
      'TABLE',
      Zen.Array.create([actionRules]),
    );

    renderSeriesSettings(INITIAL_QUERY_SELECTIONS, newSpec);
    const minTextbox = screen.getByRole('textbox', { name: 'min' });
    const maxTextbox = screen.getByRole('textbox', { name: 'max' });
    expect(minTextbox).toHaveValue(10);
    expect(maxTextbox).toHaveValue(200);
  });
});
