// @flow
import * as React from 'react';

import autobind from 'decorators/autobind';
import type {
  DataPoint,
  Metric,
} from 'components/ui/visualizations/BarGraph/types';

type DefaultProps = {
  dx?: number,
  dy?: number,
  enableValueDisplay: boolean,
  radius: number,
  showFixedDot?: boolean,
};

type Props = {
  ...DefaultProps,
  dataPoint: DataPoint,
  metric: Metric,
  onHoverEnd: (SyntheticMouseEvent<SVGElement>) => void,
  onHoverStart: (DataPoint, Metric, SyntheticMouseEvent<SVGElement>) => void,
  x: number,
  y: number,
};

type State = {
  hovering: boolean,
};

export default class LineDot extends React.PureComponent<Props, State> {
  static defaultProps: DefaultProps = {
    dx: undefined,
    dy: undefined,
    radius: 8,
    enableValueDisplay: true,
    showFixedDot: false,
  };

  state: State = {
    hovering: false,
  };

  @autobind
  onHoverStart(e: SyntheticMouseEvent<SVGElement>) {
    const { dataPoint, metric, onHoverStart } = this.props;
    this.setState({ hovering: true });
    onHoverStart(dataPoint, metric, e);
  }

  @autobind
  onHoverEnd(e: SyntheticMouseEvent<SVGElement>) {
    const { onHoverEnd } = this.props;
    this.setState({ hovering: false });
    onHoverEnd(e);
  }

  maybeRenderValue(): React.Node {
    const { dataPoint, dx, dy, enableValueDisplay, metric, x, y } = this.props;
    if (!enableValueDisplay || !metric.showValue) {
      return null;
    }
    const metricValue = dataPoint.metrics[metric.id];
    const metricIsNegative = metricValue !== null && metricValue < 0;

    // Angle the text based on the metric settings.
    // TODO(stephen, yitian): Implement `auto` text angle calculation that works
    // in a way that makes sense for a line path (likely different from the Bar
    // implementation).
    const baseAngle =
      metric.valueTextAngle !== 'auto' ? metric.valueTextAngle : 0;

    // Flip the angle if the metric is negative so that the text still looks
    // good.
    const angle = !metricIsNegative ? -baseAngle : baseAngle;

    const textProps = {
      dx: dx === undefined ? 2 : dx,
      dy: dy === undefined ? -2 : dy,
      fontSize: metric.valueFontSize,
      textAnchor: 'start',
      transform: `translate(${x}, ${y}) rotate(${angle})`,
    };

    // TODO(yitian): update these to handle bar chart line label adjustments.
    if (metricIsNegative) {
      textProps.dy = 8;
    }

    if (x < 10 || baseAngle === 90) {
      textProps.dy = 4;
    }

    // TODO(stephen): Sometimes, the metric value being displayed will still
    // fall outside the actual SVG bounds and won't be rendered. This still
    // should be handled.
    return <text {...textProps}>{metric.formatValue(metricValue)}</text>;
  }

  renderInnerCircle(): React.Node {
    const { metric, showFixedDot, x, y } = this.props;
    return (
      <circle
        cx={x}
        cy={y}
        fill={
          !this.state.hovering && !showFixedDot ? 'transparent' : metric.color
        }
        r="4"
      />
    );
  }

  render(): React.Node {
    const { radius, x, y } = this.props;
    return (
      <React.Fragment>
        {this.maybeRenderValue()}
        {this.renderInnerCircle()}
        <circle
          cx={x}
          cy={y}
          fill="transparent"
          onMouseEnter={this.onHoverStart}
          onMouseLeave={this.onHoverEnd}
          r={radius}
        />
      </React.Fragment>
    );
  }
}
