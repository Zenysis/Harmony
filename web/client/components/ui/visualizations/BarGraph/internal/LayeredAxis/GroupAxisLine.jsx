// @flow
import * as React from 'react';

import autobind from 'decorators/autobind';
import type { DimensionID } from 'components/ui/visualizations/BarGraph/types';
import type { LayerValue } from 'components/ui/visualizations/BarGraph/internal/LayeredAxis/types';

type DefaultProps = {
  tickColor: string,
  tickLength: number,
};

type Props = {
  ...DefaultProps,
  chartWidth: number,
  end: number,
  layerDimensions: $ReadOnlyArray<DimensionID>,
  layerValue: LayerValue,
  onClick: (
    layerValue: LayerValue,
    layerDimensions: $ReadOnlyArray<DimensionID>,
  ) => void,
  start: number,
};

/**
 * Render the axis line for a single group. The axis line will look like this:
 * |_______|
 */
export default class GroupAxisLine extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    tickColor: '#000000',
    tickLength: 8,
  };

  @autobind
  onClick() {
    const { layerDimensions, layerValue, onClick } = this.props;
    onClick(layerValue, layerDimensions);
  }

  maybeRenderTickStart(): React.Element<'line'> | null {
    const { start, tickColor, tickLength } = this.props;
    if (start < 0) {
      return null;
    }

    return (
      <line x1={start} y1={0} x2={start} y2={-tickLength} stroke={tickColor} />
    );
  }

  maybeRenderTickEnd(): React.Element<'line'> | null {
    const { chartWidth, end, tickColor, tickLength } = this.props;
    if (end > chartWidth) {
      return null;
    }

    return (
      <line x1={end} x2={end} y1={0} y2={-tickLength} stroke={tickColor} />
    );
  }

  renderAxisLine(): React.Element<'line'> {
    const { chartWidth, end, start, tickColor } = this.props;
    return (
      <line
        stroke={tickColor}
        x1={Math.max(start, 0)}
        x2={Math.min(end, chartWidth)}
        y1={0}
        y2={0}
      />
    );
  }

  render(): React.Element<'g'> | null {
    const { chartWidth, end, start } = this.props;
    if (end < 0 || start > chartWidth) {
      return null;
    }

    return (
      <g onClick={this.onClick}>
        {this.maybeRenderTickStart()}
        {this.renderAxisLine()}
        {this.maybeRenderTickEnd()}
      </g>
    );
  }
}
