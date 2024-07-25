// @flow
import * as React from 'react';

import CheckboxControl from 'components/visualizations/common/controls/CheckboxControl';
import DropdownControl, {
  Option,
} from 'components/visualizations/common/controls/DropdownControl';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import ResultLimitControl from 'components/visualizations/common/controls/ResultLimitControl';
import type { ControlsBlockProps } from 'components/visualizations/common/types/controlsBlockProps';

type Props = ControlsBlockProps<'BUBBLE_CHART'>;

const RESULT_LIMIT_OPTIONS = [20, 50, 100, 250, 500];
const axesDropdowns = {
  xAxis: I18N.text('X-axis'),
  yAxis: I18N.text('Y-axis'),
  zAxis: I18N.text('Bubble size'),
};
export const Z_AXIS_NONE = 'none';

export default class BubbleChartControlsBlock extends React.PureComponent<Props> {
  getLabelFromFieldId(fieldId: string): string | void {
    const seriesObj = this.props.seriesSettings.seriesObjects()[fieldId];
    return seriesObj ? seriesObj.label() : undefined;
  }

  maybeRenderResultLimitDropdown(): React.Node {
    const { controls, onControlsSettingsChange } = this.props;
    return (
      <ResultLimitControl
        controlKey="resultLimit"
        onValueChange={onControlsSettingsChange}
        resultLimitOptions={RESULT_LIMIT_OPTIONS}
        value={controls.resultLimit()}
      />
    );
  }

  renderBestFitLineOption(): React.Node {
    const { controls, onControlsSettingsChange } = this.props;
    return (
      <CheckboxControl
        controlKey="linearFit"
        label={I18N.text('Line of best fit', 'lineOfBestFit')}
        onValueChange={onControlsSettingsChange}
        value={controls.linearFit()}
      />
    );
  }

  // TODO: Sync these controls with the axes settings. Right now this
  // responds correctly to the axes changes from the Display Options
  // controls, but if we change the axes title in the Axes tab, nothing
  // happens (T1720).
  renderAxesDropdowns(): $ReadOnlyArray<React.Element<typeof DropdownControl>> {
    const { controls, fields, onControlsSettingsChange } = this.props;
    const axesOptions = fields.map(field => {
      const fieldId = field.get('id');
      return (
        <Option key={fieldId} value={fieldId}>
          {this.getLabelFromFieldId(fieldId)}
        </Option>
      );
    });

    return Object.keys(axesDropdowns).map(axis => {
      const options =
        axis !== 'zAxis'
          ? axesOptions
          : axesOptions.concat(
              <Option key={Z_AXIS_NONE} value={Z_AXIS_NONE}>
                <I18N.Ref id="None" />
              </Option>,
            );
      return (
        <DropdownControl
          key={axis}
          controlKey={axis}
          label={axesDropdowns[axis]}
          onValueChange={onControlsSettingsChange}
          value={controls.get(axis)}
        >
          {options}
        </DropdownControl>
      );
    });
  }

  renderToggleLegendControl(): React.Node {
    const { controls, onControlsSettingsChange } = this.props;
    return (
      <CheckboxControl
        controlKey="showLegend"
        label={I18N.text('Show Legend')}
        onValueChange={onControlsSettingsChange}
        value={controls.showLegend()}
      />
    );
  }

  render(): React.Node {
    if (this.props.fields.length < 2) {
      // Not enough fields selected - display error message
      return (
        <div>
          <I18N.Ref id="bubbleChartErrorMessage" />
        </div>
      );
    }

    return (
      <Group.Vertical spacing="l">
        {this.maybeRenderResultLimitDropdown()}
        {this.renderBestFitLineOption()}
        {this.renderToggleLegendControl()}
        {this.renderAxesDropdowns()}
      </Group.Vertical>
    );
  }
}
