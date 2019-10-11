// @flow
import * as React from 'react';

import CheckboxControl from 'components/visualizations/common/controls/CheckboxControl';
import ControlsGroup from 'components/visualizations/common/controls/ControlsGroup';
import DropdownControl, {
  Option,
} from 'components/visualizations/common/controls/DropdownControl';
import ResultLimitControl from 'components/visualizations/common/controls/ResultLimitControl';
import type { ControlsBlockProps } from 'components/visualizations/common/commonTypes';
import type { ViewTypeConfig } from 'models/core/QueryResultSpec/VisualizationSettings';

type Props = ControlsBlockProps<'BUBBLE_CHART'>;
type Controls = $PropertyType<Props, 'controls'>;

// Number of results to display.
const DEFAULT_RESULT_LIMIT = 100;
const RESULT_LIMIT_OPTIONS = [20, 50, 100, 250, 500];
const TXT_BUBBLECHART = t('query_result.bubblechart');
const TXT_BEST_FIT_LINE = t('query_result.controls.best_fit_line_label');

export default class BubbleChartControlsBlock extends React.PureComponent<Props> {
  static getDefaultControls(viewTypeConfig: ViewTypeConfig): Controls {
    const { fields } = viewTypeConfig;
    return {
      linearFit: false,
      resultLimit: DEFAULT_RESULT_LIMIT,
      showLegend: false,
      xAxis: fields[0] || '',
      yAxis: fields[1] || '',
      zAxis: fields[2] || 'none',
    };
  }

  getLabelFromFieldId(fieldId: string) {
    const seriesObj = this.props.seriesSettings.seriesObjects()[fieldId];
    return seriesObj ? seriesObj.label() : undefined;
  }

  maybeRenderResultLimitDropdown() {
    const { controls, onControlsSettingsChange, queryResult } = this.props;
    const maxResults = queryResult.data().length;
    if (maxResults < 1) {
      return null;
    }

    return (
      <ResultLimitControl
        controlKey="resultLimit"
        onValueChange={onControlsSettingsChange}
        value={controls.resultLimit}
        maxResults={maxResults}
        resultLimitOptions={RESULT_LIMIT_OPTIONS}
        colsWrapper={6}
        colsLabel={6}
        colsControl={6}
      />
    );
  }

  renderBestFitLineOption() {
    const { controls, onControlsSettingsChange } = this.props;
    return (
      <CheckboxControl
        controlKey="linearFit"
        value={controls.linearFit}
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
      const fieldId = field.id();
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
              <Option key="none" value="none">
                {TXT_BUBBLECHART.none_option}
              </Option>,
            );
      return (
        <DropdownControl
          key={axis}
          controlKey={axis}
          value={controls[axis]}
          onValueChange={onControlsSettingsChange}
          label={t(`query_result.bubblechart.${axis}_title`)}
        >
          {options}
        </DropdownControl>
      );
    });
  }

  renderToggleLegendControl() {
    const { controls, onControlsSettingsChange } = this.props;
    return (
      <CheckboxControl
        controlKey="showLegend"
        value={controls.showLegend}
        onValueChange={onControlsSettingsChange}
        label={TXT_BUBBLECHART.show_legend}
      />
    );
  }

  render() {
    if (this.props.fields.length < 2) {
      // Not enough fields selected - display error message
      return <div>{TXT_BUBBLECHART.error_message}</div>;
    }

    return (
      <ControlsGroup>
        {this.maybeRenderResultLimitDropdown()}
        {this.renderBestFitLineOption()}
        {this.renderToggleLegendControl()}
        {this.renderAxesDropdowns()}
      </ControlsGroup>
    );
  }
}
