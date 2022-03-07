// @flow
import * as React from 'react';

import SingleFieldSelectionControl from 'components/visualizations/common/controls/SingleFieldSelectionControl';
import type { ControlsBlockProps } from 'components/visualizations/common/types/controlsBlockProps';

type Props = ControlsBlockProps<'EXPANDOTREE'>;

export default class ExpandoTreeControlsBlock extends React.PureComponent<Props> {
  render(): React.Node {
    return (
      <SingleFieldSelectionControl
        controlKey="selectedField"
        value={this.props.controls.selectedField()}
        onValueChange={this.props.onControlsSettingsChange}
        fields={this.props.fields}
      />
    );
  }
}
