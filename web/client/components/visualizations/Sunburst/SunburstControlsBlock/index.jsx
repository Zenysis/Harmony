// @flow
import * as React from 'react';

import ControlsGroup from 'components/visualizations/common/controls/ControlsGroup';
import SingleFieldSelectionControl from 'components/visualizations/common/controls/SingleFieldSelectionControl';
import type { ControlsBlockProps } from 'components/visualizations/common/commonTypes';
import type { ViewTypeConfig } from 'models/core/QueryResultSpec/VisualizationSettings';

type Props = ControlsBlockProps<'SUNBURST'>;
type Controls = $PropertyType<Props, 'controls'>;

export default class SunburstControlsBlock extends React.PureComponent<Props> {
  static getDefaultControls(viewTypeConfig: ViewTypeConfig): Controls {
    const { fields } = viewTypeConfig;
    return {
      selectedField: fields[0],
    };
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
      </ControlsGroup>
    );
  }
}
