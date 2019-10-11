// @flow
import * as React from 'react';
import { Bar as BarOriginal } from '@vx/shape';

import autobind from 'decorators/autobind';
import type {
  DataPoint,
  Metric,
} from 'components/ui/visualizations/BarGraph/types';

type Props = {
  dataPoint: DataPoint,
  metric: Metric,
  onHoverEnd: (SyntheticMouseEvent<window.SVGRectElement>) => void,
  onHoverStart: (
    DataPoint,
    Metric,
    SyntheticMouseEvent<window.SVGRectElement>,
  ) => void,
};

const MemoBar = React.memo<any>(BarOriginal);

export default class Bar extends React.PureComponent<Props> {
  @autobind
  onHoverStart(e: SyntheticMouseEvent<window.SVGRectElement>) {
    const { dataPoint, metric, onHoverStart } = this.props;
    onHoverStart(dataPoint, metric, e);
  }

  render() {
    const {
      dataPoint,
      metric,
      onHoverEnd,
      onHoverStart,
      ...passThroughProps
    } = this.props;
    return (
      <MemoBar
        onMouseEnter={this.onHoverStart}
        onMouseMove={this.onHoverStart}
        onMouseLeave={onHoverEnd}
        {...passThroughProps}
      />
    );
  }
}
