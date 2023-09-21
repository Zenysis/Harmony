// @flow
import * as React from 'react';

import CheckboxControl from 'components/visualizations/common/controls/CheckboxControl';
import DropdownControl, {
  Option,
} from 'components/visualizations/common/controls/DropdownControl';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import ResultLimitControl from 'components/visualizations/common/controls/ResultLimitControl';
import SingleFieldSelectionControl from 'components/visualizations/common/controls/SingleFieldSelectionControl';
import SortOrderControl from 'components/visualizations/common/controls/SortOrderControl';
import { THEMES } from 'components/ui/visualizations/BumpChart/models/BumpChartTheme';
import type { ControlsBlockProps } from 'components/visualizations/common/types/controlsBlockProps';

const ALLOW_ET_DATES = window.__JSON_FROM_BACKEND.timeseriesUseEtDates;
const MAX_RESULTS = 50;
const RESULT_LIMIT_OPTIONS = [5, 10, 25, 50].filter(a => a <= MAX_RESULTS);

// TODO: I would love to pass around the full theme model here, but
// that breaks dashboards.
const THEME_OPTIONS = Object.keys(THEMES).map(themeId => (
  <Option key={themeId} value={themeId}>
    {THEMES[themeId].name()}
  </Option>
));

type Props = ControlsBlockProps<'BUMP_CHART'>;

export default class BumpChartControlsBlock extends React.PureComponent<Props> {
  maybeRenderEthiopianDatesControl(): React.Node {
    if (!ALLOW_ET_DATES) {
      return null;
    }

    return (
      <CheckboxControl
        controlKey="useEthiopianDates"
        label={I18N.text('Show Ethiopian Dates', 'showEthiopianDates')}
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.useEthiopianDates()}
      />
    );
  }

  renderResultLimitDropdown(): React.Node {
    return (
      <ResultLimitControl
        controlKey="resultLimit"
        onValueChange={this.props.onControlsSettingsChange}
        resultLimitOptions={RESULT_LIMIT_OPTIONS}
        showAllOption={false}
        value={this.props.controls.resultLimit()}
      />
    );
  }

  renderSortOrderControl(): React.Node {
    return (
      <SortOrderControl
        controlKey="sortOrder"
        includeAlphabetical={false}
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.sortOrder()}
      />
    );
  }

  renderFieldSelectionControl(): React.Node {
    return (
      <SingleFieldSelectionControl
        controlKey="selectedField"
        fields={this.props.fields}
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.selectedField()}
      />
    );
  }

  renderThemeSelectionControl(): React.Node {
    return (
      <DropdownControl
        controlKey="theme"
        label={I18N.textById('Theme')}
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.theme()}
      >
        {THEME_OPTIONS}
      </DropdownControl>
    );
  }

  render(): React.Node {
    return (
      <Group.Vertical spacing="l">
        {this.renderFieldSelectionControl()}
        {this.renderThemeSelectionControl()}
        {this.renderResultLimitDropdown()}
        {this.renderSortOrderControl()}
        {this.maybeRenderEthiopianDatesControl()}
      </Group.Vertical>
    );
  }
}
