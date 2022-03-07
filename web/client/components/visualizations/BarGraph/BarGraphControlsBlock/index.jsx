// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import CheckboxControl from 'components/visualizations/common/controls/CheckboxControl';
import DropdownControl, {
  Option,
} from 'components/visualizations/common/controls/DropdownControl';
import GoalLineControlsBlock from 'components/visualizations/BarGraph/BarGraphControlsBlock/GoalLineControlsBlock';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import RadioControl from 'components/visualizations/common/controls/RadioControl';
import RadioGroup from 'components/ui/RadioGroup';
import ResultLimitControl from 'components/visualizations/common/controls/ResultLimitControl';
import SortOrderControl from 'components/visualizations/common/controls/SortOrderControl';
import { ALPHABETICAL_SORT } from 'components/visualizations/BarGraph/constants';
import { autobind } from 'decorators';
import type { ControlsBlockProps } from 'components/visualizations/common/types/controlsBlockProps';
import type { GoalLineData } from 'components/ui/visualizations/common/MetricAxis/types';

type Props = ControlsBlockProps<'BAR_GRAPH'>;

const TEXT = t('visualizations.BarGraph.BarGraphControlsBlock');
const TXT_SORT_ON = t('query_result.controls.sort_on');
const RESULT_LIMIT_OPTIONS = [20, 50, 100, 250, 500];

export default class BarGraphControlsBlock extends React.PureComponent<Props> {
  @autobind
  onGoalLinesChange(goalLines: Zen.Array<GoalLineData>) {
    this.props.onControlsSettingsChange('goalLines', goalLines);
  }

  maybeRenderResultLimitDropdown(): React.Node {
    const { controls, onControlsSettingsChange } = this.props;
    return (
      <ResultLimitControl
        buttonMinWidth={115}
        controlKey="resultLimit"
        onValueChange={onControlsSettingsChange}
        resultLimitOptions={RESULT_LIMIT_OPTIONS}
        showAllOption
        value={controls.resultLimit()}
      />
    );
  }

  maybeRenderSortOn(): React.Node {
    const {
      controls,
      groupBySettings,
      fields,
      onControlsSettingsChange,
    } = this.props;
    // Cannot sort on a new field when there are multiple dimensions being
    // grouped on for the new bar graph.
    if (groupBySettings.groupings().size() > 1) {
      return null;
    }

    const fieldOptions = fields.map(field => (
      <Option key={field.get('id')} value={field.get('id')}>
        {field.get('label')}
      </Option>
    ));

    return (
      <DropdownControl
        showButtonContentsOnHover
        buttonMinWidth={115}
        controlKey="sortOn"
        value={controls.sortOn()}
        onValueChange={onControlsSettingsChange}
        label={TXT_SORT_ON}
        labelClassName="wrap-label-text"
      >
        {fieldOptions}
        <Option value={ALPHABETICAL_SORT}>{TEXT.alphaSort}</Option>
      </DropdownControl>
    );
  }

  maybeRenderRotateInnerGroupLabelControl(): React.Node {
    const { controls, groupBySettings, onControlsSettingsChange } = this.props;

    // Only show the inner group text rotation control if there will actually
    // be more than one grouping layer shown on the x-axis.
    if (groupBySettings.groupings().size() < 2) {
      return null;
    }

    return (
      <CheckboxControl
        controlKey="rotateInnerGroupLabels"
        label={TEXT.rotateInnerGroupLabels}
        labelClassName="wrap-label-text"
        onValueChange={onControlsSettingsChange}
        value={controls.rotateInnerGroupLabels()}
      />
    );
  }

  maybeRenderBarTreatmentControl(): React.Node {
    const { controls, fields, onControlsSettingsChange } = this.props;
    // Only show the  control if more than one field was requested during
    // querying.
    if (fields.length < 2) {
      return null;
    }

    return (
      <RadioControl
        controlKey="barTreatment"
        label={TEXT.barTreatmentLabel}
        onValueChange={onControlsSettingsChange}
        value={controls.barTreatment()}
      >
        <RadioGroup.Item value="sequential">
          {TEXT.sequentialBar}
        </RadioGroup.Item>
        <RadioGroup.Item value="stacked">{TEXT.stackedBar}</RadioGroup.Item>
        <RadioGroup.Item value="overlapping">
          {TEXT.overlappingBar}
        </RadioGroup.Item>
        <RadioGroup.Item value="overlaid">{TEXT.overlaidBar}</RadioGroup.Item>
      </RadioControl>
    );
  }

  maybeRenderValueTextAngleControl(): React.Node {
    const { controls, onControlsSettingsChange } = this.props;
    if (controls.barDirection() !== 'vertical') {
      return null;
    }

    return (
      <RadioControl
        controlKey="valueTextAngle"
        label={I18N.text('Value label rotation')}
        onValueChange={onControlsSettingsChange}
        value={controls.valueTextAngle()}
      >
        <RadioGroup.Item value="auto">
          <I18N>Auto</I18N>
        </RadioGroup.Item>
        <RadioGroup.Item value="vertical">
          <I18N>Vertical</I18N>
        </RadioGroup.Item>
      </RadioControl>
    );
  }

  renderAlwaysShowFocusWindow(): React.Node {
    const { controls, onControlsSettingsChange } = this.props;
    return (
      <CheckboxControl
        controlKey="alwaysShowFocusWindow"
        onValueChange={onControlsSettingsChange}
        value={controls.alwaysShowFocusWindow()}
        label={I18N.text('Always show focus window')}
        labelClassName="wrap-label-text"
      />
    );
  }

  renderBarDirectionControl(): React.Node {
    const { controls, onControlsSettingsChange } = this.props;
    return (
      <RadioControl
        controlKey="barDirection"
        label={TEXT.barDirectionLabel}
        onValueChange={onControlsSettingsChange}
        value={controls.barDirection()}
      >
        <RadioGroup.Item value="vertical">{TEXT.verticalBar}</RadioGroup.Item>
        <RadioGroup.Item value="horizontal">
          {TEXT.horizontalBar}
        </RadioGroup.Item>
      </RadioControl>
    );
  }

  renderGoalLinesSection(): React.Node {
    return (
      <GoalLineControlsBlock
        goalLines={this.props.controls.goalLines()}
        onGoalLinesChange={this.onGoalLinesChange}
      />
    );
  }

  renderSortOrder(): React.Node {
    const { controls, onControlsSettingsChange } = this.props;
    return (
      <SortOrderControl
        buttonMinWidth={115}
        controlKey="sortOrder"
        onValueChange={onControlsSettingsChange}
        value={controls.sortOrder()}
      />
    );
  }

  renderApplyMinimumBarHeight(): React.Node {
    const { controls, onControlsSettingsChange } = this.props;
    return (
      <CheckboxControl
        controlKey="applyMinimumBarHeight"
        onValueChange={onControlsSettingsChange}
        value={controls.applyMinimumBarHeight()}
        label={TEXT.applyMinimumBarHeight}
        labelClassName="wrap-label-text"
      />
    );
  }

  render(): React.Node {
    return (
      <Group.Vertical spacing="l">
        {this.maybeRenderResultLimitDropdown()}
        {this.renderAlwaysShowFocusWindow()}
        {this.maybeRenderBarTreatmentControl()}
        {this.renderBarDirectionControl()}
        {this.maybeRenderSortOn()}
        {this.maybeRenderRotateInnerGroupLabelControl()}
        {this.renderSortOrder()}
        {this.renderApplyMinimumBarHeight()}
        {this.maybeRenderValueTextAngleControl()}
        {this.renderGoalLinesSection()}
      </Group.Vertical>
    );
  }
}
