// @flow
import * as React from 'react';
import { AxisBottom, AxisLeft } from '@vx/axis';
import { BoxPlot, ViolinPlot } from '@vx/stats';
import { Group } from '@vx/group';
import { PatternLines } from '@vx/pattern';

import * as BoxPlotUtil from 'components/ui/visualizations/BoxPlot/BoxPlotUtil';
import BoxPlotTheme from 'components/ui/visualizations/BoxPlot/models/BoxPlotTheme';
import BoxPlotTooltip from 'components/ui/visualizations/BoxPlot/BoxPlotTooltip';
import { autobind, memoizeOne } from 'decorators';
import type {
  Margin,
  BoxPlotData,
  TooltipData,
  BoxPlotSummary,
  ViolinPatternsNames,
} from 'components/ui/visualizations/BoxPlot/types';

const BOX_TO_VIOLIN_RATIO: number = 0.8;

const { BoxPlotDataAccessors, VIOLIN_PATTERNS } = BoxPlotUtil;

export type TooltipPosition = {
  /** The left position of the tooltip */
  tooltipLeft: number,

  /** The top position of the tooltip */
  tooltipTop: number,
};

type MedianTooltipData = { median: number, label: string };

type Props = {
  /**
   * This horizontal and vertical space to leave at the top, left, bottom
   * and right of the graph
   */
  margin: Margin,

  /** An array of Data points required to draw the box plots */
  groups: $ReadOnlyArray<BoxPlotData>,

  /** The vertical axis label of the box plot */
  yAxisLabel: string,

  /** The horizontal axis label of the box plot */
  xAxisLabel: string,

  /** The vertical length of the graph including the top and bottom margins */
  height: number,

  /** The horizontal length of the graph including the left and right margins */
  width: number,

  /**
   * A boolean value to determine whether to include or exclude outliers.
   * Defaults to true
   */
  showOutliers: boolean,

  /** A boolean value to determine whether to include or exclude violin plot */
  showViolinPlot: boolean,

  /** Determines whether to show the violin plot pattern lines or not */
  showViolinPatternLines: boolean,

  /** The name of the violin patterns to draw */
  violinPatternName: ViolinPatternsNames,

  /**
   * The theme visualization display theme. Defaults to BoxPlotTheme.DARK_THEME
   */
  theme: BoxPlotTheme,

  /** A function to format values displayed by the tooltip */
  tooltipValueFormatter: number => number | string,

  /** A function to format bottom axis tick labels */
  bottomAxisTickLabelFormatter?: (number | string) => number | string,

  /** A function to format left axis tick labels */
  leftAxisTickLabelFormatter?: (number | string) => number | string,
};

type State = {
  /** The data to show in the tooltip */
  tooltipData: TooltipData | void,

  /** The tooltip left coordinate */
  tooltipLeft: number,

  /** The tooltip top coordinate */
  tooltipTop: number,
};

/**
 * This component is built on top of vx's BoxPlot component see
 * https://github.com/hshoff/vx/blob/master/packages/vx-stats/Readme.md#boxplot-
 * for the vx BoxPlot documentation
 * @visibleName BoxPlot
 */
class BoxPlotCore extends React.PureComponent<Props, State> {
  static defaultProps = {
    margin: {
      top: 10,
      left: 60,
      right: 0,
      bottom: 60,
    },
    showOutliers: true,
    showViolinPatternLines: true,
    violinPatternName: 'horizontal',
    theme: BoxPlotTheme.DarkTheme,
    showViolinPlot: true,
    tooltipValueFormatter: (value: number) => value,
    bottomAxisTickLabelFormatter: undefined,
    leftAxisTickLabelFormatter: undefined,
  };

  state = {
    tooltipData: undefined,
    tooltipLeft: 0,
    tooltipTop: 0,
  };

  @memoizeOne
  computeGraphHeight = BoxPlotUtil.computeGraphHeight;

  @memoizeOne
  computeGraphWidth = BoxPlotUtil.computeGraphWidth;

  @memoizeOne
  computeYScale = BoxPlotUtil.computeYScale;

  @memoizeOne
  computeXScale = BoxPlotUtil.computeXScale;

  @memoizeOne
  computeTooltipPosition = BoxPlotUtil.computeTooltipPosition;

  @autobind
  getBottomAxisTickLabelProps() {
    const { theme } = this.props;
    return {
      fill: theme.axisLabelColor(),

      // default styles from vx docs
      dy: '0.25em',
      fontFamily: 'Arial',
      fontSize: 10,
      textAnchor: 'middle',
    };
  }

  @autobind
  getLeftAxisTickLabelProps() {
    const { theme } = this.props;
    return {
      fill: theme.axisLabelColor(),

      // default styles from vx docs
      dx: '-0.25em',
      dy: '0.25em',
      fontFamily: 'Arial',
      fontSize: 10,
      textAnchor: 'end',
    };
  }

  getBoxPlotOffset(): number {
    const offsetFactor = Math.abs(1 - BOX_TO_VIOLIN_RATIO) / 2;
    return this.getViolinPlotWidth() * offsetFactor;
  }

  getBoxPlotWidth(): number {
    return this.getViolinPlotWidth() * BOX_TO_VIOLIN_RATIO;
  }

  getViolinPlotWidth(): number {
    const boxWidth = (this.getXScale(): any).bandwidth();
    return Math.min(50, boxWidth);
  }

  getGraphHeight(): number {
    const { margin, height } = this.props;
    return this.computeGraphHeight(height, margin);
  }

  getGraphWidth(): number {
    const { width, margin } = this.props;
    return this.computeGraphWidth(width, margin);
  }

  getTooltipPosition(xValue: string, yValue: number): TooltipPosition {
    return this.computeTooltipPosition(
      xValue,
      yValue,
      this.getXScale(),
      this.getYScale(),
      this.getBoxPlotWidth(),
    );
  }

  getViolinPlotFill() {
    let fill = this.props.theme.violinFillColor();

    if (this.props.showViolinPatternLines) {
      fill = 'url(#hViolinLines)';
    }
    return fill;
  }

  getXScale() {
    return this.computeXScale(this.props.groups, this.getGraphWidth());
  }

  getYScale() {
    return this.computeYScale(
      this.props.groups,
      this.getGraphHeight(),
      this.props.showOutliers,
    );
  }

  onBoxMouseOver(boxTooltipData: BoxPlotSummary & { label: string }): void {
    const { label: name, median, ...otherData } = boxTooltipData;
    this.setState({
      ...this.getTooltipPosition(name, median),
      tooltipData: {
        name,
        ...otherData,
      },
    });
  }

  onMaxMouseOver(minTooltipData: { max: number, label: string }): void {
    const { max, label } = minTooltipData;
    this.setState({
      ...this.getTooltipPosition(label, max),
      tooltipData: {
        max,
        name: label,
      },
    });
  }

  onMedianMouseOver(medianTooltipData: MedianTooltipData): void {
    const { median, label } = medianTooltipData;
    this.setState({
      ...this.getTooltipPosition(label, median),
      tooltipData: {
        median,
        name: label,
      },
    });
  }

  onMinMouseOver(minTooltipData: { min: number, label: string }): void {
    const { min, label } = minTooltipData;
    this.setState({
      ...this.getTooltipPosition(label, min),
      tooltipData: {
        min,
        name: label,
      },
    });
  }

  @autobind
  onBoxPlotPointsMouseLeave() {
    this.setState({
      tooltipData: undefined,
      tooltipLeft: 0,
      tooltipTop: 0,
    });
  }

  maybeRenderTooltip() {
    const { tooltipValueFormatter } = this.props;
    const { tooltipLeft, tooltipTop, tooltipData } = this.state;

    if (!tooltipData) {
      return null;
    }

    return (
      <BoxPlotTooltip
        tooltipLeft={tooltipLeft}
        tooltipTop={tooltipTop}
        tooltipData={tooltipData}
        tooltipValueFormatter={tooltipValueFormatter}
      />
    );
  }

  maybeRenderViolinPlot(group: BoxPlotData) {
    if (!this.props.showViolinPlot) {
      return null;
    }

    const data = BoxPlotDataAccessors.getBinData(group);
    const label = BoxPlotDataAccessors.getGroupName(group);
    const xScale = this.getXScale();
    return (
      <ViolinPlot
        data={data}
        stroke={this.props.theme.violinPlotStrokeColor()}
        left={xScale(label)}
        width={this.getViolinPlotWidth()}
        valueScale={this.getYScale()}
        fill={this.getViolinPlotFill()}
      />
    );
  }

  maybeRenderViolinPlotPatterns() {
    const { theme, showViolinPlot, showViolinPatternLines } = this.props;

    if (!showViolinPlot || !showViolinPatternLines) {
      return null;
    }

    const violinPattern = VIOLIN_PATTERNS[this.props.violinPatternName];

    return (
      <PatternLines
        id="hViolinLines"
        height={3}
        width={3}
        stroke={theme.violinPatternsStrokeColor()}
        strokeWidth={0.5}
        fill={theme.violinPatternsFillColor()}
        orientation={violinPattern}
      />
    );
  }

  renderBackground() {
    const { width, height, theme } = this.props;
    return (
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={theme.backgroundColor()}
        rx={14}
      />
    );
  }

  renderBoxPlot(group: BoxPlotData) {
    const xScale = this.getXScale();
    const { theme } = this.props;
    const summary = BoxPlotDataAccessors.getBoxPlotSummary(group);
    const label = BoxPlotDataAccessors.getGroupName(group);
    const data = BoxPlotDataAccessors.getBinData(group);
    const outliers = BoxPlotDataAccessors.getOutliers(group);
    const plotOutliers = this.props.showOutliers ? outliers : [];

    const minProps = {
      onMouseOver: () =>
        this.onMinMouseOver({
          min: summary.min,
          label,
        }),
      onMouseLeave: this.onBoxPlotPointsMouseLeave,
    };
    const maxProps = {
      onMouseOver: () =>
        this.onMaxMouseOver({
          max: summary.max,
          label,
        }),
      onMouseLeave: this.onBoxPlotPointsMouseLeave,
    };
    const medianProps = {
      onMouseOver: () =>
        this.onMedianMouseOver({
          median: summary.median,
          label,
        }),
      onMouseLeave: this.onBoxPlotPointsMouseLeave,
    };
    const boxProps = {
      onMouseOver: () =>
        this.onBoxMouseOver({
          ...summary,
          label,
        }),
      onMouseLeave: this.onBoxPlotPointsMouseLeave,
    };

    return (
      <BoxPlot
        data={data}
        firstQuartile={summary.firstQuartile}
        thirdQuartile={summary.thirdQuartile}
        min={summary.min}
        max={summary.max}
        outliers={plotOutliers}
        median={summary.median}
        valueScale={this.getYScale()}
        boxWidth={this.getBoxPlotWidth()}
        left={xScale(label) + this.getBoxPlotOffset()}
        fill={theme.boxPlotFillColor()}
        fillOpacity={0.4}
        stroke={theme.boxPlotLinesColor()}
        strokeWidth={2}
        minProps={minProps}
        maxProps={maxProps}
        medianProps={medianProps}
        boxProps={boxProps}
        outlierProps={{ strokeWidth: 0.8 }}
      />
    );
  }

  renderLeftAxis() {
    const {
      yAxisLabel,
      margin,
      theme,
      leftAxisTickLabelFormatter,
    } = this.props;
    return (
      <AxisLeft
        scale={this.getYScale()}
        left={margin.left - margin.right}
        bottom={margin.bottom}
        top={margin.top}
        label={yAxisLabel}
        labelProps={{
          fill: theme.axisLabelColor(),
          fontSize: 13,

          // default styles from vx docs
          textAnchor: 'middle',
          fontFamily: 'Arial',
        }}
        stroke={theme.axisLineColor()}
        tickLabelProps={this.getLeftAxisTickLabelProps}
        tickStroke={theme.axisLineColor()}
        tickFormat={leftAxisTickLabelFormatter}
      />
    );
  }

  renderBottomAxis() {
    const {
      xAxisLabel,
      margin,
      theme,
      bottomAxisTickLabelFormatter,
    } = this.props;
    const xScale = (this.getXScale(): any);
    const bandWidth = xScale.bandwidth();
    const xTickTransform = Math.ceil(
      (bandWidth - this.getViolinPlotWidth()) / 2,
    );
    return (
      <AxisBottom
        scale={xScale}
        top={this.getGraphHeight() + margin.top}
        left={margin.left - margin.right}
        tickTransform={`translate(${-xTickTransform}, 0)`}
        label={xAxisLabel}
        labelProps={{
          fontSize: 13,
          fill: theme.axisLabelColor(),

          // default styles from vx docs
          textAnchor: 'middle',
          fontFamily: 'Arial',
        }}
        stroke={theme.axisLineColor()}
        tickLabelProps={this.getBottomAxisTickLabelProps}
        tickStroke={theme.axisLineColor()}
        tickFormat={bottomAxisTickLabelFormatter}
      />
    );
  }

  renderAllBoxPlots(): React.Node {
    const { groups } = this.props;

    // The box plot is drawn on top of the violin plot because its interactive
    // while the violin plot is not
    return groups.map((group: BoxPlotData) => (
      <g key={BoxPlotDataAccessors.getGroupName(group)}>
        {this.maybeRenderViolinPlot(group)}
        {this.renderBoxPlot(group)}
      </g>
    ));
  }

  render() {
    const { height, width, margin } = this.props;
    return (
      <div className="box-plot__container">
        <svg width={width} height={height}>
          {this.renderBackground()}
          {this.maybeRenderViolinPlotPatterns()}
          <Group left={margin.left - margin.right} top={margin.top}>
            {this.renderAllBoxPlots()}
          </Group>
          {this.renderBottomAxis()}
          {this.renderLeftAxis()}
        </svg>
        {this.maybeRenderTooltip()}
      </div>
    );
  }
}

export default BoxPlotCore;
