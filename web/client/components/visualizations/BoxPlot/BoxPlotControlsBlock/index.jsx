// @flow
import * as React from 'react';

import ControlsGroup from 'components/visualizations/common/controls/ControlsGroup';
import DropdownControl, {
  Option,
} from 'components/visualizations/common/controls/DropdownControl';
import { splitCamelCase } from 'util/stringUtil';
import type { ControlsBlockProps } from 'components/visualizations/common/commonTypes';
import type { ViewTypeConfig } from 'models/core/QueryResultSpec/VisualizationSettings';

type Props = ControlsBlockProps<'BOX'>;
type Controls = $PropertyType<Props, 'controls'>;

const TXT_CONTROLS = t('query_result.controls');

export default class BoxPlotControlsBlock extends React.PureComponent<Props> {
  static getDefaultControls(viewTypeConfig: ViewTypeConfig): Controls {
    const { groupingDimension } = viewTypeConfig;
    return {
      groupBy: groupingDimension,
    };
  }

  renderGroupByDropdownControl() {
    const options = this.props.queryResult.groupableKeys().map(key => (
      <Option key={key} value={key}>
        {splitCamelCase(key)}
      </Option>
    ));

    return (
      <DropdownControl
        controlKey="groupBy"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.groupBy}
        label={TXT_CONTROLS.group_by}
      >
        {options}
      </DropdownControl>
    );
  }

  render() {
    return (
      <div>
        <ControlsGroup>{this.renderGroupByDropdownControl()}</ControlsGroup>
      </div>
    );
  }
}
