// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import BoxPlotTheme from 'components/ui/visualizations/BoxPlot/models/BoxPlotTheme';
import CheckboxControl from 'components/visualizations/common/controls/CheckboxControl';
import DropdownControl, {
  Option,
} from 'components/visualizations/common/controls/DropdownControl';
import Group from 'components/ui/Group';
import ResultLimitControl from 'components/visualizations/common/controls/ResultLimitControl';
import SingleFieldSelectionControl from 'components/visualizations/common/controls/SingleFieldSelectionControl';
import autobind from 'decorators/autobind';
import type QueryResultGrouping from 'models/core/QueryResultSpec/QueryResultGrouping';
import type { ControlsBlockProps } from 'components/visualizations/common/types/controlsBlockProps';

const MAX_RESULTS = 50;
const RESULT_LIMIT_OPTIONS = [1, 5, 10, 25, 50].filter(a => a <= MAX_RESULTS);
const CONTROLS_TEXT = t('query_result.controls');
const TEXT = t('visualizations.BoxPlot.BoxPlotControlsBlock');
const NO_DIMENSION = 'NO_DIMENSION';

const THEME_OPTIONS = Object.keys(BoxPlotTheme.Themes).map(themeId => (
  <Option value={themeId} key={themeId}>
    {BoxPlotTheme.Themes[themeId].name()}
  </Option>
));

type Props = ControlsBlockProps<'BOX_PLOT'>;

function getDisplayableGroupings(
  groupings: Zen.Array<QueryResultGrouping>,
): $ReadOnlyArray<QueryResultGrouping> {
  // HACK(stephen): Really annoying that I have to manually filter out Nation.
  return groupings.arrayView().filter(grouping => grouping.id() !== 'nation');
}

export default class BoxPlotControlsBlock extends React.PureComponent<Props> {
  @autobind
  onSelectedDimensionChanged(controlKey: string, selectedDimension: string) {
    let newSelectedDimension = selectedDimension;
    if (selectedDimension === NO_DIMENSION) {
      newSelectedDimension = undefined;
    }
    this.props.onControlsSettingsChange(controlKey, newSelectedDimension);
  }

  renderOutliersControl(): React.Node {
    const { controls, onControlsSettingsChange } = this.props;
    return (
      <CheckboxControl
        controlKey="showOutliers"
        label={TEXT.showOutliers}
        onValueChange={onControlsSettingsChange}
        value={controls.showOutliers()}
      />
    );
  }

  renderDistributionControl(): React.Node {
    const { controls, onControlsSettingsChange } = this.props;
    return (
      <CheckboxControl
        controlKey="showDistribution"
        label={TEXT.showDistribution}
        onValueChange={onControlsSettingsChange}
        value={controls.showDistribution()}
      />
    );
  }

  renderResultLimitDropdown(): React.Node {
    return (
      <ResultLimitControl
        controlKey="resultLimit"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.resultLimit()}
        resultLimitOptions={RESULT_LIMIT_OPTIONS}
        showAllOption={false}
      />
    );
  }

  renderFieldSelectionControl(): React.Node {
    const { controls, fields, onControlsSettingsChange } = this.props;
    return (
      <SingleFieldSelectionControl
        controlKey="selectedField"
        onValueChange={onControlsSettingsChange}
        value={controls.selectedField()}
        fields={fields}
      />
    );
  }

  renderThemeSelectionControl(): React.Node {
    const { controls, onControlsSettingsChange } = this.props;
    return (
      <DropdownControl
        controlKey="theme"
        onValueChange={onControlsSettingsChange}
        value={controls.theme()}
        label={CONTROLS_TEXT.theme}
      >
        {THEME_OPTIONS}
      </DropdownControl>
    );
  }

  renderDimensionSelectionControl(): React.Node {
    const { controls, groupBySettings } = this.props;
    // TODO(stephen): It is really annoying that ViewTypeConfig passes a
    // Zen.Array<QueryResultGrouping> but GroupBySettings stores a Zen.Map.
    const displayableGroupings = getDisplayableGroupings(
      groupBySettings.groupings().zenValues(),
    );
    const options = displayableGroupings.map(grouping => (
      <Option key={grouping.id()} value={grouping.id()}>
        {grouping.displayLabel()}
      </Option>
    ));

    // HACK(stephen): Need a way to keep selected dimension in sync.
    let selectedDimension = controls.selectedDimension();
    if (
      displayableGroupings.find(g => g.id() === selectedDimension) === undefined
    ) {
      selectedDimension = undefined;
    }

    return (
      <DropdownControl
        controlKey="selectedDimension"
        onValueChange={this.onSelectedDimensionChanged}
        value={controls.selectedDimension() || NO_DIMENSION}
        label={TEXT.dimensionLevel}
      >
        <Option value={NO_DIMENSION}>All</Option>
        {options}
      </DropdownControl>
    );
  }

  render(): React.Node {
    return (
      <Group.Vertical spacing="l">
        {this.renderFieldSelectionControl()}
        {this.renderResultLimitDropdown()}
        {this.renderThemeSelectionControl()}
        {this.renderDimensionSelectionControl()}
        {this.renderOutliersControl()}
        {this.renderDistributionControl()}
      </Group.Vertical>
    );
  }
}
