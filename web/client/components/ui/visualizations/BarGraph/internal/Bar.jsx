// @flow
import * as React from 'react';

import type {
  DataPoint,
  Metric,
} from 'components/ui/visualizations/BarGraph/types';

type DefaultProps = {
  enableValueDisplay: boolean,
};

type Props = {
  ...DefaultProps,
  barDirection: 'horizontal' | 'vertical',
  dataPoint: DataPoint,
  fill: string,
  height: number,
  metric: Metric,
  onHoverEnd: (SyntheticMouseEvent<SVGElement>) => void,
  onHoverStart: (DataPoint, Metric, SyntheticMouseEvent<SVGElement>) => void,
  rx: number,
  stroke: string,
  strokeWidth: number,
  width: number,
  x: number,
  y: number,
};

export default class Bar extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    enableValueDisplay: true,
  };

  // NOTE(stephen): Preferring a class property over an `autobind` wrapped
  // method since there were are performance issues related to the attachment
  // and access to the autobound method when there are a very large number of
  // bars.
  onHoverStart: (e: SyntheticMouseEvent<SVGElement>) => void = e => {
    const { dataPoint, metric, onHoverStart } = this.props;
    onHoverStart(dataPoint, metric, e);
  };

  maybeRenderValue(): React.Node {
    const {
      barDirection,
      dataPoint,
      enableValueDisplay,
      height,
      metric,
      width,
      x,
      y,
    } = this.props;
    if (!enableValueDisplay || !metric.showValue) {
      return null;
    }
    const metricValue = dataPoint.metrics[metric.id];
    const metricIsNegative = metricValue !== null && metricValue < 0;
    const yPos = !metricIsNegative ? y : y + height + 5;

    // Calculate the label position specified in the series settings.
    const { barLabelPosition } = metric;
    let adjustedYPos = yPos;
    if (barLabelPosition === 'center') {
      adjustedYPos = yPos + height / 2;
    } else if (barLabelPosition === 'bottom') {
      adjustedYPos = yPos + height;
    }

    // Angle the text based on the metric settings. If the angle should be
    // automatically calculated, rotate the text diagonally pointing up and to
    // the right. If the bar width is < 10 pixels, we will rotate the text to be
    // vertical.
    let baseAngle;
    if (metric.valueTextAngle === 'auto') {
      baseAngle = width >= 10 ? 45 : 90;
    } else {
      baseAngle = metric.valueTextAngle;
    }

    // Flip the angle if the metric is negative so that the text still looks
    // good.
    const angle =
      !metricIsNegative || barDirection === 'horizontal'
        ? -baseAngle
        : baseAngle;

    // Position the text so that the first character starts directly over the
    // middle of the bar.
    const xPos = x + width / 2;
    const translate = `translate(${xPos}, ${adjustedYPos})`;
    const rotate = `rotate(${angle}, ${xPos}, ${adjustedYPos})`;
    const textProps = {
      dx: 2,
      dy: 0,
      fillOpacity: 1,
      fontSize: metric.valueFontSize,
      textAnchor:
        barDirection === 'horizontal' && metricIsNegative ? 'end' : 'start',
      transform: `${rotate} ${translate}`,
    };

    if (metricIsNegative) {
      textProps.dy = 8;
    }

    if (width < 10 || baseAngle === 90) {
      textProps.dy = 4;
    }

    // TODO(stephen): Sometimes, the metric value being displayed will still
    // fall outside the actual SVG bounds and won't be rendered. This still
    // should be handled.
    return <text {...textProps}>{metric.formatValue(metricValue)}</text>;
  }

  render(): React.Node {
    const {
      fill,
      height,
      onHoverEnd,
      rx,
      stroke,
      strokeWidth,
      width,
      x,
      y,
    } = this.props;
    return (
      <React.Fragment>
        <rect
          fill={fill}
          height={height}
          onMouseEnter={this.onHoverStart}
          onMouseMove={this.onHoverStart}
          onMouseLeave={onHoverEnd}
          rx={rx}
          stroke={stroke}
          strokeWidth={strokeWidth}
          width={width}
          x={x}
          y={y}
        />
        {this.maybeRenderValue()}
      </React.Fragment>
    );
  }
}
