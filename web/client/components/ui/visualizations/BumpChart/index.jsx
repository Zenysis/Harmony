// @flow
import * as React from 'react';
import { AxisLeft, AxisTop } from '@vx/axis';
import { GlyphDot } from '@vx/glyph';
import { Group } from '@vx/group';
import { LinePath } from '@vx/shape';
import { curveLinear } from '@vx/curve';
import { localPoint } from '@vx/event';

import * as BumpChartUtil from 'components/ui/visualizations/BumpChart/BumpChartUtil';
import BumpChartTheme, {
  DARK_THEME,
} from 'components/ui/visualizations/BumpChart/models/BumpChartTheme';
import BumpChartTooltip from 'components/ui/visualizations/BumpChart/BumpChartTooltip';
import ZenMap from 'util/ZenModel/ZenMap';
import { autobind, memoizeOne } from 'decorators';
import type {
  ChartSize,
  RawTimestamp,
} from 'components/visualizations/BumpChart/types';
import type {
  ColorScaleMap,
  DataPoint,
  HoverPoint,
  LineData,
  Margin,
} from 'components/ui/visualizations/BumpChart/types';

export type Props = ChartSize & {
  dateFormatter: string => string,
  dates: $ReadOnlyArray<RawTimestamp>,
  lines: $ReadOnlyArray<LineData>,
  margin: Margin,
  onLineSelected: string => void,
  selectedKeys: ZenMap<number>,
  theme: BumpChartTheme,
  valueFormatter: number => string | number,
};

type State = {
  hoverData: DataPoint | void,
  hoverPoint: HoverPoint | void,
};

type LineHoverEvent = SyntheticEvent<*>;
type Stroke = {
  stroke: string,
  strokeWidth: number,
};

const { DataPointView } = BumpChartUtil;

export default class BumpChartCore extends React.PureComponent<Props, State> {
  static defaultProps = {
    margin: {
      top: 80, // Slightly larger top margin so that x-axis labels can fit.
      left: 200, // Much higher left margin so that y-axis labels can fit.
      right: 60,
      bottom: 40,
    },

    selectedKeys: (ZenMap.create(): ZenMap<number>),
    theme: DARK_THEME,
  };

  state = {
    hoverData: undefined,
    hoverPoint: undefined,
  };

  // Memoize these costly processing functions based on the last params used.
  // This allows us to avoid storing these values in state, freeing us from
  // making convoluted prevProps/prevState comparisons in
  // getDerivedStateFromProps.
  @memoizeOne
  buildXScale = BumpChartUtil.buildXScale;

  @memoizeOne
  buildYScale = BumpChartUtil.buildYScale;

  @memoizeOne
  buildGlyphColorScales = BumpChartUtil.buildGlyphColorScales;

  @memoizeOne
  buildValueDomains = BumpChartUtil.buildValueDomains;

  getXScale() {
    const { dates, margin, width } = this.props;
    return this.buildXScale(
      dates,
      BumpChartUtil.calculateXMax(width, margin, dates.length),
    );
  }

  getYScale() {
    const { height, lines, margin } = this.props;
    return this.buildYScale(lines, BumpChartUtil.calculateYMax(height, margin));
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
    return xScale(DataPointView.getTimestamp(d));
  }

  // Compute the X coordinate value the data point should be drawn at on the
  // line. This is the scaled value within the chart's coordinate system.
  @autobind
  getLineYCoordinate(d: DataPoint): number {
    const yScale = this.getYScale();
    return yScale(DataPointView.getRank(d));
  }

  onHoverStart(d: DataPoint, event: LineHoverEvent) {
    this.setState({ hoverData: d, hoverPoint: localPoint(event) });
  }

  @autobind
  onHoverEnd() {
    this.setState({ hoverData: undefined, hoverPoint: undefined });
  }

  maybeRenderTooltip() {
    const { hoverData, hoverPoint } = this.state;
    if (!hoverData || !hoverPoint) {
      return null;
    }

    return (
      <BumpChartTooltip
        data={hoverData}
        point={hoverPoint}
        valueFormatter={this.props.valueFormatter}
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
      const timestamp = DataPointView.getTimestamp(d);
      return (
        <g
          key={`line-point-${key}-${timestamp}`}
          onClick={() => this.props.onLineSelected(d.key)}
          onMouseEnter={event => this.onHoverStart(d, event)}
          onMouseLeave={this.onHoverEnd}
        >
          <GlyphDot
            cx={xScale(timestamp)}
            cy={yScale(DataPointView.getRank(d))}
            fill={colorScales[timestamp](DataPointView.getValue(d))}
            r={8}
            {...stroke}
          />
        </g>
      );
    });
  }

  @autobind
  renderLine(line: LineData) {
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

  renderXAxis() {
    const { dateFormatter, margin, theme } = this.props;
    const axisTextColor = theme.axisTextColor();
    const xScale = this.getXScale();
    const bandWidth = xScale.bandwidth();

    // Offset the top axis by half the column size so that the labels are
    // properly centered over the columns.
    const leftOffset = bandWidth / 2;
    return (
      <AxisTop
        scale={xScale}
        hideAxisLine
        hideTicks
        top={margin.top - 20}
        left={margin.left - leftOffset}
        stroke={axisTextColor}
        tickFormat={dateFormatter}
        tickLabelProps={() => ({
          fill: axisTextColor,
          fontSize: 14,
          fontWeight: 700,
          textAnchor: 'middle',
          width: bandWidth - 8,
        })}
      />
    );
  }

  renderYAxis() {
    const { lines, margin, theme } = this.props;
    const axisTextColor = theme.axisTextColor();
    const yScale = this.getYScale();
    const { left, top } = margin;
    const tickWidth = left - 10;
    return (
      <AxisLeft
        scale={yScale}
        hideAxisLine
        hideTicks
        left={left - 5}
        top={top}
        numTicks={lines.length}
        stroke={axisTextColor}
        tickFormat={rank => BumpChartUtil.getLabel(lines[rank])}
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
            width: tickWidth,
          };
        }}
      />
    );
  }

  render() {
    const { lines, width, height, margin, theme } = this.props;
    if (!lines || !lines.length) {
      return null;
    }

    const { top, left } = margin;
    return (
      <div style={{ position: 'relative' }}>
        <svg width={width} height={height}>
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill={theme.backgroundColor()}
            rx={14}
          />
          <Group top={top} left={left}>
            {lines.map(this.renderLine)}
          </Group>
          {this.renderXAxis()}
          {this.renderYAxis()}
        </svg>
        {this.maybeRenderTooltip()}
      </div>
    );
  }
}
