// @flow
import * as React from 'react';

import ControlsGroup from 'components/visualizations/common/controls/ControlsGroup';
import DropdownControl, {
  Option,
} from 'components/visualizations/common/controls/DropdownControl';
import SingleFieldSelectionControl from 'components/visualizations/common/controls/SingleFieldSelectionControl';
import type { ControlsBlockProps } from 'components/visualizations/common/commonTypes';
import type { ViewTypeConfig } from 'models/core/QueryResultSpec/VisualizationSettings';

type Props = ControlsBlockProps<'HEATMAP'>;
type Controls = $PropertyType<Props, 'controls'>;

export default class HeatMapControlsBlock extends React.PureComponent<Props> {
  static getDefaultControls(viewTypeConfig: ViewTypeConfig): Controls {
    const { fields } = viewTypeConfig;
    return {
      selectedField: fields[0],
      baseLayer: 'Streets',
    };
  }

  renderLayerOptions() {
    const layerOptions = ['Satellite', 'Streets', 'Light', 'Blank'].map(
      layer => (
        <Option value={layer} key={layer}>
          {t(`query_result.map.layers.${layer}`)}
        </Option>
      ),
    );

    return (
      <DropdownControl
        controlKey="baseLayer"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.baseLayer}
        label="Layer Options"
      >
        {layerOptions}
      </DropdownControl>
    );
  }

  render() {
    return (
      <ControlsGroup>
        <SingleFieldSelectionControl
          controlKey="selectedField"
          onValueChange={this.props.onControlsSettingsChange}
          value={this.props.controls.selectedField}
          fields={this.props.fields}
        />
        {this.renderLayerOptions()}
      </ControlsGroup>
    );
  }
}
