// @flow
import * as React from 'react';
import {
  AxisLeft as AxisLeftOriginal,
  AxisRight as AxisRightOriginal,
} from '@vx/axis';
import { localPoint } from '@vx/event';

import GoalLinePath from 'components/ui/visualizations/common/GoalLine/GoalLinePath';
import GoalLineTag from 'components/ui/visualizations/common/GoalLine/GoalLineTag';
import { autobind, memoizeOne } from 'decorators';
import { noop } from 'util/util';
import type {
  GoalLineData,
  GoalLineTheme,
} from 'components/ui/visualizations/common/MetricAxis/types';

// TODO(stephen): FIX THIS.
type LinearScale = $FlowTODO;

type DefaultProps = {
  axisOrientation: 'left' | 'right',
  formatValue: (number | null) => string | number,
  goalLineThemes: {
    hover: GoalLineTheme,
    placed: GoalLineTheme,
  },
  goalLines: $ReadOnlyArray<GoalLineData>,
  hoverLine: GoalLineData | void,

  /**
   * Optional prop that is useful when using this component in conjunction with
   * Responsive container. The dimensions of the ref element is used as the size
   * to allocate to the axis.
   */
  innerRef: (React.ElementRef<'g'> | null) => void,
  onGoalLineClick: (goalLineID: string, roundValue: boolean) => void,
  onHoverMove: (value: number) => void,
  onHoverEnd: () => void,
  stroke: string,
  tickColor: string,
  title: string,
  titleLabelProps: { +[string]: mixed, ... },
  titleOffset: number,
};

type Props = {
  ...DefaultProps,
  chartWidth: number,
  height: number,
  tickLabelProps: { ... }, // TODO(stephen): FIX THIS.
  yScale: LinearScale,
};

// Convert the functional Axis components to PureComponents so that we don't
// needlessly rerender all the Text nodes (which are quite nonperformant).
const AxisLeft = React.memo(AxisLeftOriginal);
const AxisRight = React.memo(AxisRightOriginal);

export function getNiceTickCount(axisHeight: number): number {
  if (axisHeight <= 35) {
    return 1;
  }
  if (axisHeight <= 100) {
    return 3;
  }

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
  static defaultProps: DefaultProps = {
    axisOrientation: 'left',
    formatValue: (value: number | null) => (value === null ? 'Null' : value),
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
    titleOffset: 72,
  };

  @memoizeOne
  buildTickValues(height: number, scale: LinearScale): $ReadOnlyArray<number> {
    return scale.ticks(getNiceTickCount(height));
  }

  @autobind
  getTickLabelProps(): { ... } {
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

  // Calculate the y-offset that the MetricAxis has from its owner SVG.
  // HACK(stephen): Memoize this calculation so that we can keep hover events
  // responsive. We can cache the CTM matrix call when the user first starts
  // hovering since it is unlikely for it to change while the user is
  // interacting with the MetricAxis.
  @memoizeOne
  calculateHoverOffset(elt: Element | void): number {
    if (!(elt instanceof SVGGraphicsElement)) {
      return 0;
    }

    const matrix = elt.getCTM();
    return matrix !== null ? matrix.f : 0;
  }

  @autobind
  onHoverMove(event: SyntheticMouseEvent<SVGRectElement>) {
    const { height, onHoverMove, yScale } = this.props;

    // Determine how much the MetricAxis is offset from its parent SVG. This
    // value is needed since we want to take the event's y-coordinate in SVG
    // space and convert it into a y-coordinate in our scale's space. After
    // getting the SVG coordinate (using `localPoint`) we can apply the hover
    // offset to end in the scale's space.
    const hoverOffset = this.calculateHoverOffset(event.currentTarget);
    const y = localPoint(event).y - hoverOffset;

    // Cancel the hover event if the value is outside the y-axis.
    if (y < 0 || y > height) {
      this.onHoverEnd();
      return;
    }

    onHoverMove(yScale.invert(y));
  }

  @autobind
  onHoverEnd() {
    // HACK(stephen): Performance hack. Reset the memoization of the hover
    // offset calculation so that we can recalculate it again the next time the
    // user starts hovering.
    this.calculateHoverOffset(undefined);
    this.props.onHoverEnd();
  }

  @autobind
  onGoalLineClick(goalLineID: string) {
    const { hoverLine, onGoalLineClick, yScale } = this.props;
    const roundValue =
      hoverLine !== undefined &&
      goalLineID === hoverLine.id &&
      this.shouldRoundHoverValue(yScale);
    onGoalLineClick(goalLineID, roundValue);
  }

  maybeRenderGoalLinePieces(
    { id, label, value }: GoalLineData,
    { backgroundColor, lineColor, textStyle }: GoalLineTheme,
  ):
    | [React.Element<typeof GoalLineTag>, React.Element<typeof GoalLinePath>]
    | null {
    const {
      axisOrientation,
      chartWidth,
      formatValue,
      height,
      yScale,
    } = this.props;

    const y = yScale(value);
    if (y < 0 || y > height) {
      return null;
    }

    const niceValue = this.shouldRoundHoverValue(yScale)
      ? Math.floor(value)
      : value;
    return [
      <GoalLineTag
        axisOrientation={axisOrientation}
        backgroundColor={backgroundColor}
        goalLineID={id}
        key={id}
        onClick={this.onGoalLineClick}
        textStyle={textStyle}
        valueText={formatValue(niceValue)}
        y={y}
      />,
      <GoalLinePath
        axisOrientation={axisOrientation}
        chartWidth={chartWidth}
        key={id}
        label={label}
        lineColor={lineColor}
        y={y}
      />,
    ];
  }

  renderGoalLines(): [
    $ReadOnlyArray<React.Element<typeof GoalLineTag>>,
    $ReadOnlyArray<React.Element<typeof GoalLinePath>>,
  ] {
    const { goalLineThemes, goalLines, hoverLine } = this.props;
    const tags = [];
    const lines = [];

    const addGoalLinePieces = (data: GoalLineData, theme: GoalLineTheme) => {
      const goalLinePieces = this.maybeRenderGoalLinePieces(data, theme);
      if (goalLinePieces !== null) {
        tags.push(goalLinePieces[0]);
        lines.push(goalLinePieces[1]);
      }
    };

    // Render hover line first if it exists so that it will display at the
    // bottom of the stack.
    if (hoverLine !== undefined) {
      addGoalLinePieces(hoverLine, goalLineThemes.hover);
    }

    goalLines.forEach(data => addGoalLinePieces(data, goalLineThemes.placed));
    return [tags, lines];
  }

  render(): React.Element<'g'> | null {
    const {
      axisOrientation,
      formatValue,
      height,
      innerRef,
      stroke,
      tickColor,
      title,
      titleOffset,
      titleLabelProps,
      yScale,
    } = this.props;

    if (height <= 0) {
      return null;
    }

    // NOTE(stephen): Need to render the goal line tags and paths separately
    // since we want the tags to affect the Axis size but not the paths. This
    // only matters when MetricAxis is used inside a ResponsiveContainer.
    const [goalLineTags, goalLinePaths] = this.renderGoalLines();
    const AxisComponent = axisOrientation === 'left' ? AxisLeft : AxisRight;
    return (
      <g className="ui-metric-axis">
        <g
          className="ui-metric-axis__axis-container"
          onMouseLeave={this.onHoverEnd}
          onMouseMove={this.onHoverMove}
        >
          <rect
            fill="transparent"
            height={height}
            width={HOVER_AREA_WIDTH}
            x={axisOrientation === 'left' ? -HOVER_AREA_WIDTH : 0}
            y={0}
          />
          {/* Apply inner ref so as to exclude goal lines from axis size
          measurements */}
          <g ref={innerRef}>
            <AxisComponent
              label={title}
              labelOffset={titleOffset}
              labelProps={titleLabelProps}
              scale={yScale}
              stroke={stroke}
              tickFormat={formatValue}
              tickLabelProps={this.getTickLabelProps}
              tickStroke={tickColor}
              tickValues={this.buildTickValues(height, yScale)}
            />
            {goalLineTags}
          </g>
        </g>
        {goalLinePaths}
      </g>
    );
  }
}
