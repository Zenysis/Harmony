// @flow
import * as React from 'react';
import { AxisLeft, AxisTop } from '@vx/axis';
import { GlyphDot } from '@vx/glyph';
import { LinePath } from '@vx/shape';
import { curveLinear } from '@vx/curve';
import { localPoint } from '@vx/event';
import { scaleLinear, scalePoint } from '@vx/scale';

import * as Zen from 'lib/Zen';
import BumpChartTheme, {
  DARK_THEME,
} from 'components/ui/visualizations/BumpChart/models/BumpChartTheme';
import BumpChartTooltip from 'components/ui/visualizations/BumpChart/internal/BumpChartTooltip';
import ResponsiveContainer from 'components/ui/visualizations/common/ResponsiveContainer';
import { autobind, memoizeOne } from 'decorators';
import type { ChartSize } from 'components/ui/visualizations/types';
import type {
  ColorScaleMap,
  DataPoint,
  HoverPoint,
  LineData,
  ValueDomainMap,
} from 'components/ui/visualizations/BumpChart/types';
// TODO(pablo): move these imports to somewhere else.
import type { RawTimestamp } from 'models/visualizations/BumpChart/types';

type DefaultProps = {
  axisMargins: $PropertyType<
    React.ElementProps<typeof ResponsiveContainer>,
    'axisMargins',
  >,
  selectedKeys: Zen.Map<number>,
  theme: BumpChartTheme,
};

export type Props = {
  ...DefaultProps,
  dateFormatter: string => string,
  dates: $ReadOnlyArray<RawTimestamp>,
  height: number,
  lines: $ReadOnlyArray<LineData>,
  onLineSelected: string => void,
  valueFormatter: number => string | number,
  width: number,
};

type State = {
  hoverData: DataPoint | void,
  hoverPoint: HoverPoint | void,
  innerChartSize: ChartSize,
};

type LineHoverEvent = SyntheticEvent<*>;
type Stroke = {
  stroke: string,
  strokeWidth: number,
};

// TODO(stephen): FIX THIS EVERYWHERE.
type LinearScale = $FlowTODO;
type PointScale = $FlowTODO;

const BUMP_RADIUS = 8;
const PADDING = {
  bottom: 10,
  left: 10,
  right: 10,
  top: 10,
};

export default class BumpChartCore extends React.PureComponent<Props, State> {
  static defaultProps: DefaultProps = {
    axisMargins: {
      axisTop: { bottom: 20 },
      axisLeft: { right: 10 + BUMP_RADIUS },
    },
    selectedKeys: Zen.Map.create<number>(),
    theme: DARK_THEME,
  };

  state: State = {
    hoverData: undefined,
    hoverPoint: undefined,
    innerChartSize: {
      height: 10,
      width: 10,
    },
  };

  /**
   * Build the x-axis scale that can convert a given line's date value (bucket)
   * into the appropriate x-axis positioning.
   */
  @memoizeOne
  buildXScale(dates: $ReadOnlyArray<RawTimestamp>, width: number): PointScale {
    return scalePoint({
      domain: dates,
      range: [0, width],
    });
  }

  /**
   * Build the y-axis scale that can convert a given line's value (rank) into
   * the appropriate y-axis positioning.
   */
  @memoizeOne
  buildYScale(data: $ReadOnlyArray<LineData>, height: number): LinearScale {
    return scaleLinear({
      domain: [0, data.length - 1],
      range: [0, height],
    });
  }

  /**
   * For each timestamp's value domain ([min, max] value of each column),
   * generate a color scaling function that can produce a color for a given
   * value in that column.
   */
  @memoizeOne
  buildGlyphColorScales(
    valueDomains: ValueDomainMap,
    theme: BumpChartTheme,
  ): ColorScaleMap {
    const output: ColorScaleMap = {};
    const heatTilesColorRange = theme.heatTilesColorRange();
    const range = [heatTilesColorRange.get(0), heatTilesColorRange.get(1)];
    Object.entries(valueDomains).forEach(([dateVal, domain]) => {
      output[dateVal] = scaleLinear({ range, domain });
    });
    return output;
  }

  /**
   * Find the minimum and maximum values for each timestamp column in the data.
   * These values are used for producing the heat tiles gradient for each
   * timestamp column.
   */
  @memoizeOne
  buildValueDomains(data: $ReadOnlyArray<LineData>): ValueDomainMap {
    const output: ValueDomainMap = {};
    data.forEach(line => {
      line.forEach(({ timestamp, val }) => {
        if (!output[timestamp]) {
          output[timestamp] = [Infinity, -Infinity];
        }

        const minMax = output[timestamp];
        minMax[0] = Math.min(minMax[0], val);
        minMax[1] = Math.max(minMax[1], val);
      });
    });

    return output;
  }

  @memoizeOne
  buildBackgroundProps(theme: BumpChartTheme): { fill: string, rx: number } {
    return {
      fill: theme.backgroundColor(),
      rx: 14,
    };
  }

  getXScale(): PointScale {
    return this.buildXScale(this.props.dates, this.state.innerChartSize.width);
  }

  getYScale(): LinearScale {
    return this.buildYScale(this.props.lines, this.state.innerChartSize.height);
  }

  getGlyphColorScales(): ColorScaleMap {
    const { lines, theme } = this.props;
    return this.buildGlyphColorScales(this.buildValueDomains(lines), theme);
  }

  isHovered(line: LineData): boolean {
    const { hoverData } = this.state;
    return line && hoverData !== undefined && hoverData.key === line[0].key;
  }

  getHoveredLineStroke(line: LineData): Stroke | void {
    if (!this.isHovered(line)) {
      return undefined;
    }

    return {
      stroke: this.props.theme.hoverColor(),
      strokeWidth: 3,
    };
  }

  getSelectedLineStroke(line: LineData): Stroke | void {
    const { key } = line[0];
    const { selectedKeys, theme } = this.props;
    if (!selectedKeys.has(key)) {
      return undefined;
    }

    const selectedColorIdx = selectedKeys.forceGet(key);
    const selectedLineColors = theme.selectedLineColors();

    // Handle if the selected line color options changes and there are fewer
    // colors available than before.
    // TODO(stephen): Trigger a call to the parent to remove this value from
    // the selectedKeys.
    if (selectedColorIdx >= selectedLineColors.size()) {
      return undefined;
    }

    return {
      stroke: selectedLineColors.get(selectedColorIdx),
      strokeWidth: 3,
    };
  }

  // Return the stroke values for this line if it is receiving special treatment
  // (like if it is hovered or selected).
  getHighlightedStroke(line: LineData): Stroke | void {
    const selectedLineStroke = this.getSelectedLineStroke(line);
    if (selectedLineStroke) {
      return selectedLineStroke;
    }

    const hoveredStroke = this.getHoveredLineStroke(line);
    if (hoveredStroke) {
      return hoveredStroke;
    }

    return undefined;
  }

  getDefaultStroke(): Stroke {
    return {
      stroke: this.props.theme.strokeColor(),
      strokeWidth: 0.5,
    };
  }

  // Compute the X coordinate value the data point should be drawn at on the
  // line. This is the scaled value within the chart's coordinate system.
  @autobind
  getLineXCoordinate(d: DataPoint): number {
    const xScale = this.getXScale();
    return xScale(d.timestamp);
  }

  // Compute the X coordinate value the data point should be drawn at on the
  // line. This is the scaled value within the chart's coordinate system.
  @autobind
  getLineYCoordinate(d: DataPoint): number {
    const yScale = this.getYScale();
    return yScale(d.rank);
  }

  @autobind
  onInnerChartResize(height: number, width: number) {
    this.setState(prevState => {
      const prevWidth = prevState.innerChartSize.width;
      const prevHeight = prevState.innerChartSize.height;
      if (prevWidth === width && prevHeight === height) {
        return prevState;
      }

      return {
        ...prevState,
        innerChartSize: {
          // Subtract the bump radius from the dimensions since the bump will
          // render outside the chart area. This is because the radius extends
          // outward from the center point of the bump. The bump is positioned
          // based on its center point and not from the top/left like the lines.
          // NOTE(stephen): Using a Math.max to ensure we never render a
          // negative dimension.
          height: Math.max(height - 2 * BUMP_RADIUS, 10),
          width: Math.max(width - 2 * BUMP_RADIUS, 10),
        },
      };
    });
  }

  onHoverStart(d: DataPoint, event: LineHoverEvent) {
    this.setState({ hoverData: d, hoverPoint: localPoint(event) });
  }

  @autobind
  onHoverEnd() {
    this.setState({ hoverData: undefined, hoverPoint: undefined });
  }

  maybeRenderTooltip(): React.Node {
    const { hoverData, hoverPoint } = this.state;
    if (!hoverData || !hoverPoint) {
      return null;
    }

    const { dateFormatter, valueFormatter } = this.props;
    return (
      <BumpChartTooltip
        data={hoverData}
        dateFormatter={dateFormatter}
        point={hoverPoint}
        valueFormatter={valueFormatter}
      />
    );
  }

  renderBumps(
    line: LineData,
    stroke: Stroke,
  ): React.ChildrenArray<React.Element<'g'>> {
    const { key } = line[0];
    const xScale = this.getXScale();
    const yScale = this.getYScale();
    const colorScales = this.getGlyphColorScales();
    return line.map(d => {
      const { rank, timestamp, val } = d;
      return (
        <g
          key={`line-point-${key}-${timestamp}`}
          onClick={() => this.props.onLineSelected(d.key)}
          onMouseEnter={event => this.onHoverStart(d, event)}
          onMouseLeave={this.onHoverEnd}
        >
          <GlyphDot
            cx={xScale(timestamp)}
            cy={yScale(rank)}
            fill={colorScales[timestamp](val)}
            r={BUMP_RADIUS}
            {...stroke}
          />
        </g>
      );
    });
  }

  @autobind
  renderLine(line: LineData): React.Node {
    const { key } = line[0];
    const stroke = this.getHighlightedStroke(line) || this.getDefaultStroke();
    return (
      <g key={key}>
        <LinePath
          data={line}
          x={this.getLineXCoordinate}
          y={this.getLineYCoordinate}
          fill="none"
          curve={curveLinear}
          {...stroke}
        />
        <g>{this.renderBumps(line, stroke)}</g>
      </g>
    );
  }

  @autobind
  renderXAxis(): React.Element<typeof AxisTop> {
    const { dateFormatter, theme } = this.props;
    const axisTextColor = theme.axisTextColor();
    const xScale = this.getXScale();
    return (
      <AxisTop
        scale={xScale}
        hideAxisLine
        hideTicks
        stroke={axisTextColor}
        tickFormat={dateFormatter}
        tickLabelProps={() => ({
          fill: axisTextColor,
          fontSize: 14,
          fontWeight: 700,
          textAnchor: 'middle',
          verticalAnchor: 'start',
          width: xScale.step() - 8,
        })}
        tickLength={0}
      />
    );
  }

  renderYAxis(): React.Element<typeof AxisLeft> {
    const { lines, theme } = this.props;
    const axisTextColor = theme.axisTextColor();
    const yScale = this.getYScale();
    return (
      <AxisLeft
        scale={yScale}
        hideAxisLine
        hideTicks
        numTicks={lines.length}
        stroke={axisTextColor}
        tickFormat={rank => (lines[rank] ? lines[rank][0].label : '')}
        tickStroke={axisTextColor}
        tickLabelProps={rank => {
          const line = lines[rank];
          const point = line ? line[0] : undefined;
          if (!point) {
            return {};
          }

          const highlightedStroke = this.getHighlightedStroke(line) || {};
          return {
            dy: '4px',
            fill: highlightedStroke.stroke || axisTextColor,
            fontSize: 14,
            fontWeight: highlightedStroke.stroke ? 600 : 400,
            textAnchor: 'end',
            onMouseEnter: event => this.onHoverStart(point, event),
            onMouseLeave: this.onHoverEnd,
          };
        }}
        tickLength={0}
      />
    );
  }

  renderInnerChart(): React.Element<'g'> {
    return <g>{this.props.lines.map(this.renderLine)}</g>;
  }

  render(): React.Element<'div'> | null {
    const { axisMargins, height, lines, theme, width } = this.props;
    if (!lines || !lines.length) {
      return null;
    }

    return (
      <div style={{ position: 'relative' }}>
        <ResponsiveContainer
          axisLeft={this.renderYAxis()}
          axisMargins={axisMargins}
          axisTop={this.renderXAxis()}
          backgroundProps={this.buildBackgroundProps(theme)}
          chart={this.renderInnerChart()}
          height={height}
          onChartResize={this.onInnerChartResize}
          padding={PADDING}
          width={width}
        />
        {this.maybeRenderTooltip()}
      </div>
    );
  }
}
