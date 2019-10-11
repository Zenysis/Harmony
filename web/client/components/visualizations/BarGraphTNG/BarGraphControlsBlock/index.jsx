// @flow
import * as React from 'react';

import CheckboxControl from 'components/visualizations/common/controls/CheckboxControl';
import ControlsGroup from 'components/visualizations/common/controls/ControlsGroup';
import ResultLimitControl from 'components/visualizations/common/controls/ResultLimitControl';
import SingleFieldSelectionControl from 'components/visualizations/common/controls/SingleFieldSelectionControl';
import SortOrderControl from 'components/visualizations/common/controls/SortOrderControl';
import { DEFAULT_SORT_ORDER } from 'components/QueryResult/graphUtil';
import type { ControlsBlockProps } from 'components/visualizations/common/commonTypes';
import type { ViewTypeConfig } from 'models/core/QueryResultSpec/VisualizationSettings';

type Props = ControlsBlockProps<'BAR_GRAPH'>;
type Controls = $PropertyType<Props, 'controls'>;

const TXT_STACK_BARS = t('query_result.controls.stack_bars');
const TXT_SORT_ON = t('query_result.controls.sort_on');
const RESULT_LIMIT_OPTIONS = [20, 50, 100, 250, 500];

export default class BarGraphControlsBlock extends React.PureComponent<Props> {
  static getDefaultControls(viewTypeConfig: ViewTypeConfig): Controls {
    const { fields } = viewTypeConfig;
    return {
      resultLimit: 50,
      sortOn: fields[0],
      sortOrder: DEFAULT_SORT_ORDER,
      stackBars: false,
    };
  }

  maybeRenderResultLimitDropdown() {
    const { controls, onControlsSettingsChange, queryResult } = this.props;
    const resultCount = queryResult.data().length;
    if (resultCount === 1) {
      return null;
    }

    // NOTE(stephen): Disable showing the "all" option on the new bar graph
    // since the current implementation specifies the exact number of bars, not
    // a special value (like -1) to indicate "show all bars". This is
    // frustrating since the control persists through multiple query changes
    // (like on AQT) but would store the original number of bars.
    // TODO(stephen): Enable `resultCount + showAll` to allow a negative number.
    return (
      <ResultLimitControl
        buttonMinWidth={115}
        colsControl={6}
        colsLabel={6}
        colsWrapper={6}
        controlKey="resultLimit"
        maxResults={resultCount}
        onValueChange={onControlsSettingsChange}
        resultLimitOptions={RESULT_LIMIT_OPTIONS}
        showAllOption={false}
        value={controls.resultLimit}
      />
    );
  }

  maybeRenderSortOn() {
    const {
      controls,
      fields,
      onControlsSettingsChange,
      queryResult,
    } = this.props;
    if (fields.length < 2) {
      return null;
    }

    // Cannot sort on a new field when there are multiple dimensions being
    // grouped on for the new bar graph.
    if (queryResult.dimensions().length > 1) {
      return null;
    }

    return (
      <SingleFieldSelectionControl
        buttonMinWidth={115}
        controlKey="sortOn"
        fields={fields}
        label={TXT_SORT_ON}
        onValueChange={onControlsSettingsChange}
        value={controls.sortOn}
      />
    );
  }

  maybeRenderStackBarsControl() {
    const {
      controls,
      fields,
      onControlsSettingsChange,
      queryResult,
    } = this.props;
    // Only show the stack bar control if more than one field
    // was requested during querying.
    if (queryResult.isEmpty() || fields.length < 2) {
      return null;
    }

    return (
      <CheckboxControl
        colsControl={6}
        colsLabel={6}
        colsWrapper={6}
        controlKey="stackBars"
        label={TXT_STACK_BARS}
        onValueChange={onControlsSettingsChange}
        value={controls.stackBars}
      />
    );
  }

  renderSortOrder() {
    const { controls, onControlsSettingsChange } = this.props;
    return (
      <SortOrderControl
        buttonMinWidth={115}
        controlKey="sortOrder"
        onValueChange={onControlsSettingsChange}
        value={controls.sortOrder}
      />
    );
  }

  render() {
    return (
      <div>
        <ControlsGroup>{this.maybeRenderResultLimitDropdown()}</ControlsGroup>
        <ControlsGroup>{this.maybeRenderStackBarsControl()}</ControlsGroup>
        <ControlsGroup>{this.maybeRenderSortOn()}</ControlsGroup>
        <ControlsGroup>{this.renderSortOrder()}</ControlsGroup>
      </div>
    );
  }
}
