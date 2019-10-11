// @flow
import * as React from 'react';

import CheckboxControl from 'components/visualizations/common/controls/CheckboxControl';
import ControlsGroup from 'components/visualizations/common/controls/ControlsGroup';
import DropdownControl, {
  Option,
} from 'components/visualizations/common/controls/DropdownControl';
import ResultLimitControl from 'components/visualizations/common/controls/ResultLimitControl';
import SingleFieldSelectionControl from 'components/visualizations/common/controls/SingleFieldSelectionControl';
import SortOrderControl from 'components/visualizations/common/controls/SortOrderControl';
import {
  DARK_THEME,
  THEMES,
} from 'components/ui/visualizations/BumpChart/models/BumpChartTheme';
import { SORT_DESCENDING } from 'components/QueryResult/graphUtil';
import type { ControlsBlockProps } from 'components/visualizations/common/commonTypes';
import type { ViewTypeConfig } from 'models/core/QueryResultSpec/VisualizationSettings';

const ALLOW_ET_DATES = window.__JSON_FROM_BACKEND.timeseriesUseEtDates;
const DEFAULT_RESULT_LIMIT = 25;
const MAX_RESULTS = 50;
const RESULT_LIMIT_OPTIONS = [5, 10, 25, 50].filter(a => a <= MAX_RESULTS);
const CONTROLS_TEXT = t('query_result.controls');
const TEXT = t('visualizations.BumpChart.BumpChartControlsBlock');

// TODO(stephen): I would love to pass around the full theme model here, but
// that breaks dashboards.
const THEME_OPTIONS = Object.keys(THEMES).map(themeId => (
  <Option value={themeId} key={themeId}>
    {THEMES[themeId].name()}
  </Option>
));

type Props = ControlsBlockProps<'BUMP_CHART'>;

type Controls = $PropertyType<Props, 'controls'>;

export default class BumpChartControlsBlock extends React.PureComponent<Props> {
  static getDefaultControls(viewTypeConfig: ViewTypeConfig): Controls {
    const { fields } = viewTypeConfig;
    return {
      resultLimit: DEFAULT_RESULT_LIMIT,
      selectedField: fields[0],
      sortOrder: SORT_DESCENDING,
      theme: DARK_THEME.id(),
      useEthiopianDates: ALLOW_ET_DATES,

      // TODO(stephen): This control is set directly based on user interaction
      // with the chart. We need a default control value to be set, and it
      // feels weird doing that here since the control is managed elsewhere.
      // TODO(stephen, pablo): Support ZenMaps in dashboard serialization of
      // visualization controls since this is supposed to be a ZenMap.
      selectedKeys: {},
    };
  }

  maybeRenderEthiopianDatesControl() {
    if (!ALLOW_ET_DATES) {
      return null;
    }

    return (
      <CheckboxControl
        controlKey="useEthiopianDates"
        value={this.props.controls.useEthiopianDates}
        onValueChange={this.props.onControlsSettingsChange}
        label={CONTROLS_TEXT.et_checkbox}
        colsWrapper={12}
        colsLabel={2}
        colsControl={10}
      />
    );
  }

  renderResultLimitDropdown() {
    return (
      <ResultLimitControl
        controlKey="resultLimit"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.resultLimit}
        maxResults={MAX_RESULTS}
        resultLimitOptions={RESULT_LIMIT_OPTIONS}
        showAllOption={false}
      />
    );
  }

  renderSortOrderControl() {
    return (
      <SortOrderControl
        controlKey="sortOrder"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.sortOrder}
        includeAlphabetical={false}
      />
    );
  }

  renderFieldSelectionControl() {
    return (
      <SingleFieldSelectionControl
        controlKey="selectedField"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.selectedField}
        fields={this.props.fields}
      />
    );
  }

  renderThemeSelectionControl() {
    return (
      <DropdownControl
        controlKey="theme"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.theme}
        label={TEXT.theme}
      >
        {THEME_OPTIONS}
      </DropdownControl>
    );
  }

  render() {
    return (
      <ControlsGroup>
        {this.renderFieldSelectionControl()}
        {this.renderThemeSelectionControl()}
        {this.renderResultLimitDropdown()}
        {this.renderSortOrderControl()}
        {this.maybeRenderEthiopianDatesControl()}
      </ControlsGroup>
    );
  }
}
