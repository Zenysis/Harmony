// @flow
import * as React from 'react';

import memoizeOne from 'decorators/memoizeOne';
import type {
  DataPoint,
  DimensionID,
  Metric,
} from 'components/ui/visualizations/BarGraph/types';
import type { HoverPoint } from 'components/ui/visualizations/types';
import type { StyleObject } from 'types/jsCore';

type Props = {
  dataPoint: DataPoint,
  dimensionFormatter: (dimensionID: DimensionID) => string,
  dimensionValueFormatter: (
    dimensionID: DimensionID,
    value: string | null,
  ) => string,
  metric: Metric,
  point: HoverPoint,
};

export default class BarGraphTooltip extends React.PureComponent<Props> {
  _ref: $RefObject<'div'> = React.createRef();

  @memoizeOne
  calculateStyle(
    x: number,
    y: number,
    width: number,
    windowWidth: number,
  ): StyleObject {
    let xPos = x;
    const yPos = y;
    if (x + width >= windowWidth) {
      xPos -= width;
    }

    return {
      left: xPos,
      position: 'absolute',
      top: yPos,
    };
  }

  renderRow(
    label: string,
    value: string | number | null,
  ): React.Element<'div'> {
    return (
      <div className="bar-graph-tooltip__row" key={`${label}--${value || ''}`}>
        <div className="bar-graph-tooltip__row-label">{label}</div>
        <div className="bar-graph-tooltip__row-value">{value}</div>
      </div>
    );
  }

  renderDimensionValues(): $ReadOnlyArray<React.Element<'div'>> {
    const {
      dataPoint,
      dimensionFormatter,
      dimensionValueFormatter,
    } = this.props;
    const { dimensions } = dataPoint;
    return Object.keys(dimensions).map((dimensionID: DimensionID) =>
      this.renderRow(
        dimensionFormatter(dimensionID),
        dimensionValueFormatter(dimensionID, dimensions[dimensionID]),
      ),
    );
  }

  renderMetricValue() {
    const { dataPoint, metric } = this.props;
    return this.renderRow(
      metric.displayName,
      metric.formatValue(dataPoint.metrics[metric.id]),
    );
  }

  render() {
    const { x, y } = this.props.point;
    const width = this._ref.current ? this._ref.current.offsetWidth : 0;
    const style = this.calculateStyle(x, y, width, window.innerWidth);
    return (
      <div className="bar-graph-tooltip" ref={this._ref} style={style}>
        {this.renderDimensionValues()}
        {this.renderMetricValue()}
      </div>
    );
  }
}
