// @flow
import * as React from 'react';
import invariant from 'invariant';

import BarGroup from 'components/ui/visualizations/BarGraph/internal/BarGroup';
import { noop } from 'util/util';
import type {
  DataPoint,
  Metric,
  ScaleMap,
} from 'components/ui/visualizations/BarGraph/types';

type Props = {
  barGroupOpacity: DataPoint => number,
  dataPointKeyMap: Map<DataPoint, string>,
  dataPoints: $ReadOnlyArray<DataPoint>,
  height: number,
  metricOrder: $ReadOnlyArray<Metric>,
  scales: ScaleMap,
  width: number,

  hideOverflowing: boolean,
  onHoverEnd: $Prop<BarGroup, 'onHoverEnd'>,
  onHoverStart: $Prop<BarGroup, 'onHoverStart'>,
  stack: boolean,
};

export default class BarSeries extends React.PureComponent<Props> {
  static defaultProps = {
    hideOverflowing: true,
    onHoverEnd: noop,
    onHoverStart: noop,
    stack: false,
  };

  shouldRenderBarGroup(left: number): boolean {
    const { hideOverflowing, scales, width } = this.props;
    if (!hideOverflowing) {
      return true;
    }

    // If any part of the bar group is inside the chart window then we should
    // render it.
    return left + scales.barGroupScale.bandwidth() >= 0 && left <= width;
  }

  renderBarGroups() {
    const {
      barGroupOpacity,
      dataPointKeyMap,
      dataPoints,
      metricOrder,
      onHoverEnd,
      onHoverStart,
      scales,
      stack,
    } = this.props;

    const groups = [];
    dataPoints.forEach(dataPoint => {
      const key = dataPointKeyMap.get(dataPoint);
      invariant(key !== undefined, 'DataPoint key cannot be missing');

      const left = scales.barGroupScale(key);
      if (!this.shouldRenderBarGroup(left)) {
        return;
      }

      const opacity = barGroupOpacity(dataPoint);
      const style = opacity === 1 ? undefined : { opacity };
      groups.push(
        <g key={key} transform={`translate(${left}, 0)`} style={style}>
          <BarGroup
            dataPoint={dataPoint}
            metricOrder={metricOrder}
            onHoverEnd={onHoverEnd}
            onHoverStart={onHoverStart}
            scales={scales}
            stack={stack}
          />
        </g>,
      );
    });

    return groups;
  }

  render() {
    const { height } = this.props;
    if (height <= 0) {
      return null;
    }

    return <g>{this.renderBarGroups()}</g>;
  }
}
