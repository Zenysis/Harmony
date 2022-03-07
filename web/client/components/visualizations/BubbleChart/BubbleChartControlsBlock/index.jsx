// @flow
import * as React from 'react';

import CheckboxControl from 'components/visualizations/common/controls/CheckboxControl';
import DropdownControl, {
  Option,
} from 'components/visualizations/common/controls/DropdownControl';
import Group from 'components/ui/Group';
import ResultLimitControl from 'components/visualizations/common/controls/ResultLimitControl';
import type { ControlsBlockProps } from 'components/visualizations/common/types/controlsBlockProps';

type Props = ControlsBlockProps<'BUBBLE_CHART'>;

const RESULT_LIMIT_OPTIONS = [20, 50, 100, 250, 500];
const TXT_BUBBLECHART = t('query_result.bubblechart');
const TXT_BEST_FIT_LINE = t('query_result.controls.best_fit_line_label');
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
        value={controls.resultLimit()}
        resultLimitOptions={RESULT_LIMIT_OPTIONS}
      />
    );
  }

  renderBestFitLineOption(): React.Node {
    const { controls, onControlsSettingsChange } = this.props;
    return (
      <CheckboxControl
        controlKey="linearFit"
        value={controls.linearFit()}
        onValueChange={onControlsSettingsChange}
        label={TXT_BEST_FIT_LINE}
      />
    );
  }

  // TODO(pablo): Sync these controls with the axes settings. Right now this
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

    return ['xAxis', 'yAxis', 'zAxis'].map(axis => {
      const options =
        axis !== 'zAxis'
          ? axesOptions
          : axesOptions.concat(
              <Option key={Z_AXIS_NONE} value={Z_AXIS_NONE}>
                {TXT_BUBBLECHART.none_option}
              </Option>,
            );
      return (
        <DropdownControl
          key={axis}
          controlKey={axis}
          value={controls.get(axis)}
          onValueChange={onControlsSettingsChange}
          label={t(`query_result.bubblechart.${axis}_title`)}
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
        value={controls.showLegend()}
        onValueChange={onControlsSettingsChange}
        label={TXT_BUBBLECHART.show_legend}
      />
    );
  }

  render(): React.Node {
    if (this.props.fields.length < 2) {
      // Not enough fields selected - display error message
      return <div>{TXT_BUBBLECHART.error_message}</div>;
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
