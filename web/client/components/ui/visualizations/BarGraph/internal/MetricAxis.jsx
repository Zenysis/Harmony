// @flow
import * as React from 'react';
import {
  AxisLeft as AxisLeftOriginal,
  AxisRight as AxisRightOriginal,
} from '@vx/axis';
import { Bar as BarOriginal } from '@vx/shape';
import { localPoint } from '@vx/event';

import GoalLine from 'components/ui/visualizations/BarGraph/internal/GoalLine';
import { autobind, memoizeOne } from 'decorators';
import { noop } from 'util/util';
import type {
  GoalLineData,
  GoalLineTheme,
  Metric,
} from 'components/ui/visualizations/BarGraph/types';

// TODO(stephen): FIX THIS.
type LinearScale = any;

type Props = {
  chartWidth: number,
  goalLineThemes: {
    hover: GoalLineTheme,
    placed: GoalLineTheme,
  },
  height: number,
  metric: Metric,
  yScale: LinearScale,

  axisOrientation: 'left' | 'right',
  goalLines: $ReadOnlyArray<GoalLineData>,
  hoverLine: GoalLineData | void,
  innerRef: (React.ElementRef<'g'> | null) => void,
  onGoalLineClick: (goalLineID: string) => void,
  onHoverMove: (metric: Metric, value: number) => void,
  onHoverEnd: () => void,
  stroke: string,
  tickColor: string,
  tickLabelProps: {}, // TODO(stephen): FIX THIS.
  title: string,
  titleLabelProps: {}, // TODO(stephen): FIX THIS.
};

// Convert the functional Axis components to PureComponents so that we don't
// needlessly rerender all the Text nodes (which are quite nonperformant).
const AxisLeft = React.memo(AxisLeftOriginal);
const AxisRight = React.memo(AxisRightOriginal);
const Bar = React.memo(BarOriginal);

export function getNiceTickCount(axisHeight: number): number {
  if (axisHeight <= 300) {
    return 5;
  }

  if (axisHeight <= 600) {
    return 7;
  }

  return 10;
}

const HOVER_AREA_WIDTH = 80;

export default class MetricAxis extends React.PureComponent<Props> {
  static defaultProps = {
    axisOrientation: 'left',
    goalLineThemes: {
      hover: {
        backgroundColor: '#e3e7f1',
        lineColor: 'black',
        textStyle: {
          fill: '#293742',
          fontSize: 12,
          fontWeight: 500,
        },
      },
      placed: {
        backgroundColor: '#c6cbef',
        lineColor: 'black',
        textStyle: {
          fill: '#293742',
          fontSize: 12,
          fontWeight: 700,
        },
      },
    },
    goalLines: [],
    hoverLine: undefined,
    innerRef: noop,
    onGoalLineClick: noop,
    onHoverMove: noop,
    onHoverEnd: noop,
    stroke: 'black',
    tickColor: 'black',
    title: '',
    titleLabelProps: {
      fill: 'black',
      fontSize: 12,
      textAnchor: 'middle',
    },
  };

  @memoizeOne
  buildTickValues(height: number, scale: LinearScale): $ReadOnlyArray<number> {
    return scale.ticks(getNiceTickCount(height));
  }

  @autobind
  getTickLabelProps() {
    return this.props.tickLabelProps;
  }

  // HACK(stephen): We want to display a useful goal line value when a user
  // hovers. However, the default value formatter in the bar graph settings
  // includes decimal values. When we convert from an axis coordinate to the
  // display value, we often end up with a decimal value that looks ugly.
  // Perform a quick heuristic to determine if the axis tick marks are all
  // integers. If they are, round the hover value.
  @memoizeOne
  shouldRoundHoverValue(yScale: LinearScale): boolean {
    return yScale.ticks().every(value => Number.isInteger(value));
  }

  @autobind
  onHoverMove(event: SyntheticMouseEvent<window.SVGRectElement>) {
    const { height, metric, onHoverMove, yScale } = this.props;

    // We want the goal line label to be centered over the mouse cursor. This
    // offset is a rough way to do that. Without the offset, the goal line
    // label top will be at the same point as the mouse cursor and will mostly
    // be covered up by the cursor.
    const y = localPoint(event).y - 8;

    // Cancel the hover event if the value is outside the y-axis.
    if (y < 0 || y > height) {
      this.onHoverEnd();
      return;
    }

    onHoverMove(metric, yScale.invert(y));
  }

  @autobind
  onHoverEnd() {
    this.props.onHoverEnd();
  }

  maybeRenderGoalLine(
    { id, value }: GoalLineData,
    { backgroundColor, lineColor, textStyle }: GoalLineTheme,
  ): React.Element<typeof GoalLine> | null {
    const {
      axisOrientation,
      chartWidth,
      height,
      metric,
      onGoalLineClick,
      yScale,
    } = this.props;
    const y = yScale(value);
    if (y < 0 || y > height) {
      return null;
    }

    const niceValue = this.shouldRoundHoverValue(yScale)
      ? Math.floor(value)
      : value;
    return (
      <GoalLine
        key={id}
        axisOrientation={axisOrientation}
        backgroundColor={backgroundColor}
        chartWidth={chartWidth}
        goalLineID={id}
        lineColor={lineColor}
        onClick={onGoalLineClick}
        text={metric.formatValue(niceValue)}
        textStyle={textStyle}
        y={y}
      />
    );
  }

  renderGoalLines() {
    const { goalLineThemes, goalLines, hoverLine } = this.props;
    const output: Array<React.Element<typeof GoalLine>> = [];

    // Render hover line first if it exists so that it will display at the
    // bottom of the stack.
    if (hoverLine !== undefined) {
      const line = this.maybeRenderGoalLine(hoverLine, goalLineThemes.hover);
      if (line !== null) {
        output.push(line);
      }
    }

    goalLines.forEach(data => {
      const line = this.maybeRenderGoalLine(data, goalLineThemes.placed);
      if (line !== null) {
        output.push(line);
      }
    });

    return output;
  }

  render() {
    const {
      axisOrientation,
      height,
      innerRef,
      metric,
      stroke,
      tickColor,
      title,
      titleLabelProps,
      yScale,
    } = this.props;
    if (height <= 0) {
      return null;
    }

    const AxisComponent = axisOrientation === 'left' ? AxisLeft : AxisRight;
    return (
      <g>
        <g ref={innerRef}>
          <AxisComponent
            label={title}
            labelOffset={72}
            labelProps={titleLabelProps}
            scale={yScale}
            stroke={stroke}
            tickFormat={metric.formatValue}
            tickLabelProps={this.getTickLabelProps}
            tickStroke={tickColor}
            tickValues={this.buildTickValues(height, yScale)}
          />
        </g>
        <g onMouseLeave={this.onHoverEnd} onMouseMove={this.onHoverMove}>
          <Bar
            fill="transparent"
            height={height}
            width={HOVER_AREA_WIDTH}
            x={axisOrientation === 'left' ? -HOVER_AREA_WIDTH : 0}
            y={0}
          />
          {this.renderGoalLines()}
        </g>
      </g>
    );
  }
}
