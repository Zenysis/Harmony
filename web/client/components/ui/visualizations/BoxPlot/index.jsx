// @flow
import * as React from 'react';
import { AxisLeft as AxisLeftOriginal } from '@vx/axis';
import { scaleLinear, scaleBand } from '@vx/scale';

import Box from 'components/ui/visualizations/BoxPlot/internal/Box';
import BoxPlotTheme from 'components/ui/visualizations/BoxPlot/models/BoxPlotTheme';
import BoxTooltip from 'components/ui/visualizations/BoxPlot/internal/BoxTooltip';
import LayeredAxis from 'components/ui/visualizations/BarGraph/internal/LayeredAxis';
import OutlierTooltip from 'components/ui/visualizations/BoxPlot/internal/OutlierTooltip';
import ResponsiveContainer from 'components/ui/visualizations/common/ResponsiveContainer';
import { autobind, memoizeOne } from 'decorators';
import { getNiceTickCount } from 'components/ui/visualizations/common/MetricAxis';
import { noop } from 'util/util';
import type {
  BoxPlotBoxData,
  BoxPlotDataPoint,
  BoxTooltipData,
  OutlierTooltipData,
  ViolinPatternsNames,
} from 'components/ui/visualizations/BoxPlot/types';
import type { LayerData } from 'components/ui/visualizations/BarGraph/internal/LayeredAxis/types';

const BOX_TO_VIOLIN_RATIO: number = 0.8;
const BOTTOM_AXIS_LABEL_PROPS = () => ({ fontWeight: 'bold' });

export type TooltipPosition = {
  /** The left position of the tooltip */
  tooltipLeft: number,

  /** The top position of the tooltip */
  tooltipTop: number,
};

type Props = {
  /** An array of BoxPlotBoxData, one per box to be drawn */
  groups: $ReadOnlyArray<BoxPlotBoxData>,

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

  /** Patterns are defined and get referenced with their IDs, so when multiple
   * BoxPlots are displayed at the same time, they need unique IDs for unique
   * patterns. See
   * https://github.com/hshoff/vx/tree/master/packages/vx-pattern#the-definition-caveat
   */
  violinPatternId: string,

  /**
   * The theme visualization display theme. Defaults to BoxPlotTheme.DARK_THEME
   */
  theme: BoxPlotTheme,

  /** A function to format dimension values (x-axis labels) */
  dimensionValueFormatter: string => string,

  /** A function to format metric values (y-axis labels and datapoint values) */
  metricValueFormatter: number => string,

  /** An optional callback for when an outlier datapoint is clicked */
  onOutlierClick?: BoxPlotDataPoint => void,

  /** An optional class name for outlier data points */
  outlierClassName?: string,

  /**
   * A function to render a custom tooltip for outlier data points instead of
   * the default
   */
  renderOutlierTooltip?: OutlierTooltipData => React.Node,
};

type State = {
  innerChartSize: {
    height: number,
    width: number,
  },

  boxTooltipData: BoxTooltipData | void,
  outlierTooltipData: OutlierTooltipData | void,
};

// TODO(stephen): FIX THIS.
type BandScale = $FlowTODO;
type LinearScale = $FlowTODO;

type ViolinPatterns = {
  [ViolinPatternsNames]: $ReadOnlyArray<'horizontal' | 'diagonal' | 'vertical'>,
  ...,
};

type AxisTextProps = {
  labelProps: { ... },
  tickLabelProps: mixed => { ... },
};

const LABEL_FONT_SIZE = 13;
const LABEL_FONT = 'Lato, sans-serif';

export const VIOLIN_PATTERNS: ViolinPatterns = {
  horizontal: ['horizontal'],
  vertical: ['vertical'],
  diagonal: ['diagonal'],
  horizontalAndVertical: ['horizontal', 'vertical'],
  horizontalAndDiagonal: ['horizontal', 'diagonal'],
  verticalAndDiagonal: ['vertical', 'diagonal'],
  all: ['horizontal', 'vertical', 'diagonal'],
};

const CONTAINER_STYLE = {
  position: 'relative',
};

const AxisLeft = (React.memo(AxisLeftOriginal): React.AbstractComponent<
  React.ElementConfig<typeof AxisLeftOriginal>,
>);

/**
 * This component is built on top of vx's BoxPlot component see
 * https://github.com/hshoff/vx/blob/master/packages/vx-stats/Readme.md#boxplot-
 * for the vx BoxPlot documentation
 * @visibleName BoxPlot
 */
class BoxPlotCore extends React.PureComponent<Props, State> {
  static defaultProps: $AllowZenModelDefaultProp = {
    onOutlierClick: noop,
    outlierClassName: '',
    showOutliers: true,
    showViolinPatternLines: true,
    violinPatternName: 'horizontal',
    violinPatternId: 'hViolinLines',
    theme: BoxPlotTheme.LightTheme,
    showViolinPlot: true,
    dimensionValueFormatter: (value: string) => value,
    metricValueFormatter: (value: number) => `${value}`,
  };

  state: State = {
    innerChartSize: {
      height: 10,
      width: 10,
    },
    boxTooltipData: undefined,
    outlierTooltipData: undefined,
  };

  @memoizeOne
  computeYScale(
    groups: $ReadOnlyArray<BoxPlotBoxData>,
    height: number,
    includeOutliers: boolean,
  ): LinearScale {
    let maxY = -Infinity;
    let minY = Infinity;
    groups.forEach(group => {
      const { boxPlotSummary, outliers } = group.data;
      const { max, min } = boxPlotSummary;
      maxY = Math.max(maxY, max);
      minY = Math.min(min, minY);
      if (includeOutliers) {
        const outlierValues = outliers.map(outlier => outlier.value);
        maxY = Math.max(maxY, ...outlierValues);
        minY = Math.min(minY, ...outlierValues);
      }
    });
    const minMaxOffset = 0.2 * Math.abs(minY);
    return scaleLinear({
      domain: [minY - minMaxOffset, maxY + minMaxOffset],
      rangeRound: [height, 0],
    }).nice(getNiceTickCount(height));
  }

  @memoizeOne
  computeXScale(
    groups: $ReadOnlyArray<BoxPlotBoxData>,
    width: number,
  ): BandScale {
    const domain = groups.map(g => g.key);
    return scaleBand({
      domain,
      rangeRound: [0, width],
      padding: 0.4,
    });
  }

  @memoizeOne
  computeBackgroundProps(theme: BoxPlotTheme): { fill: string, rx: number } {
    return {
      fill: theme.backgroundColor(),
      rx: 14,
    };
  }

  @memoizeOne
  buildLeftAxisTextProps(theme: BoxPlotTheme): AxisTextProps {
    const fontColor = theme.axisLabelColor();
    // TODO(david): A lot of these properties are repeated in several
    // visualizations (e.g. the box plot). It would be nice to unify them and
    // ensure we have consistent styles in all our visualizations.
    return {
      labelProps: {
        fill: fontColor,
        fontFamily: LABEL_FONT,
        fontSize: LABEL_FONT_SIZE,
        textAnchor: 'middle',
      },
      tickLabelProps: () => ({
        dx: '-0.25em',
        dy: '0.25em',
        fill: fontColor,
        fontFamily: LABEL_FONT,
        fontSize: LABEL_FONT_SIZE,
        fontWeight: 'bold',
        textAnchor: 'end',
      }),
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
    const boxWidth = this.getXScale().bandwidth();
    return Math.min(50, boxWidth);
  }

  getGraphHeight(): number {
    return this.state.innerChartSize.height;
  }

  getGraphWidth(): number {
    return this.state.innerChartSize.width;
  }

  getTooltipPosition(xValue: string, yValue: number): TooltipPosition {
    const xScale = this.getXScale();
    const yScale = this.getYScale();
    return {
      tooltipTop: yScale(yValue),
      tooltipLeft: xScale(xValue) + this.getBoxPlotWidth(),
    };
  }

  getViolinPlotFill(): string {
    const { violinPatternId } = this.props;
    let fill = this.props.theme.violinFillColor();

    if (this.props.showViolinPatternLines) {
      fill = `url(#${violinPatternId})`;
    }
    return fill;
  }

  getXScale(): BandScale {
    return this.computeXScale(this.props.groups, this.getGraphWidth());
  }

  getYScale(): LinearScale {
    return this.computeYScale(
      this.props.groups,
      this.getGraphHeight(),
      this.props.showOutliers,
    );
  }

  // TODO(stephen): Generalize the LayeredAxis a bit more so that non-BarGraph
  // visualizations can use it more cleanly. Right now, we have to conform the
  // data in this visualization to approximately look like the BarGraph's data
  // and usage style (i.e. with `formatXAxisValue` and `buildXAxisLayers`).
  @autobind
  formatXAxisValue({ key }: { key: string, ... }): string {
    return this.props.dimensionValueFormatter(key);
  }

  @memoizeOne
  buildXAxisLayers(
    groups: $ReadOnlyArray<BoxPlotBoxData>,
  ): $ReadOnlyArray<LayerData> {
    const layerValues = groups.map(({ key }) => ({ key }));

    return [
      {
        angle: 'horizontal',
        layerDimensions: [],
        layerValues,
      },
    ];
  }

  @autobind
  onBoxHoverStart(boxTooltipData: BoxTooltipData) {
    this.setState({ boxTooltipData });
  }

  @autobind
  onBoxHoverEnd() {
    this.setState({ boxTooltipData: undefined });
  }

  @autobind
  onOutlierHoverStart(outlierTooltipData: OutlierTooltipData) {
    this.setState({ outlierTooltipData });
  }

  @autobind
  onOutlierHoverEnd() {
    this.setState({ outlierTooltipData: undefined });
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
        innerChartSize: { height, width },
      };
    });
  }

  maybeRenderBoxTooltip(): React.Node {
    const { boxTooltipData } = this.state;
    if (boxTooltipData === undefined) {
      return null;
    }

    const { dimensionValueFormatter, metricValueFormatter } = this.props;
    const { boxPlotSummary, dimensionValue, left, top } = boxTooltipData;
    return (
      <BoxTooltip
        boxPlotSummary={boxPlotSummary}
        label={dimensionValueFormatter(dimensionValue)}
        left={left}
        tooltipValueFormatter={metricValueFormatter}
        top={top}
      />
    );
  }

  maybeRenderOutlierTooltip(): React.Node {
    const { outlierTooltipData } = this.state;
    if (outlierTooltipData === undefined) {
      return null;
    }

    const {
      dimensionValueFormatter,
      metricValueFormatter,
      renderOutlierTooltip,
    } = this.props;

    if (renderOutlierTooltip !== undefined) {
      return renderOutlierTooltip(outlierTooltipData);
    }

    // TODO(david): Currently all uses of the box plot use a custom tooltip.
    // Keeping this here for now but if we never use it elsewhere then it may be
    // worth removing this and the OutlierTooltip component.
    const { dimensionValue, left, top, dataPoint } = outlierTooltipData;

    return (
      <OutlierTooltip
        label={dimensionValueFormatter(dimensionValue)}
        left={left}
        top={top}
        value={metricValueFormatter(dataPoint.value)}
      />
    );
  }

  @autobind
  renderBox(group: BoxPlotBoxData, idx: number): React.Node {
    const {
      onOutlierClick,
      outlierClassName,
      showOutliers,
      showViolinPatternLines,
      showViolinPlot,
      theme,
      violinPatternName,
      violinPatternId,
    } = this.props;
    const xScale = this.getXScale();
    return (
      <Box
        key={group.key}
        addViolinPatternDefinition={idx === 0 && showViolinPatternLines}
        boxOffset={this.getBoxPlotOffset()}
        boxWidth={this.getBoxPlotWidth()}
        data={group}
        fill={theme.boxPlotFillColor()}
        fillOpacity={0.4}
        left={xScale(group.key)}
        outlierStroke={theme.outliersStrokeColor()}
        onBoxHoverStart={this.onBoxHoverStart}
        onBoxHoverEnd={this.onBoxHoverEnd}
        onOutlierClick={onOutlierClick}
        onOutlierHoverStart={this.onOutlierHoverStart}
        onOutlierHoverEnd={this.onOutlierHoverEnd}
        outlierClassName={outlierClassName}
        showOutliers={showOutliers}
        showViolinPlot={showViolinPlot}
        scale={this.getYScale()}
        stroke={theme.boxPlotLinesColor()}
        violinFill={this.getViolinPlotFill()}
        violinPatternFill={theme.violinPatternsFillColor()}
        violinPatternDirection={VIOLIN_PATTERNS[violinPatternName]}
        violinPatternStroke={theme.violinPatternsStrokeColor()}
        violinPatternId={violinPatternId}
        violinStroke={theme.violinPlotStrokeColor()}
        violinWidth={this.getViolinPlotWidth()}
      />
    );
  }

  renderLeftAxis(): React.Element<typeof AxisLeft> {
    const { yAxisLabel, theme, metricValueFormatter } = this.props;
    return (
      <AxisLeft
        scale={this.getYScale()}
        label={yAxisLabel}
        left={10}
        stroke={theme.axisLineColor()}
        tickStroke={theme.axisLineColor()}
        tickFormat={metricValueFormatter}
        {...this.buildLeftAxisTextProps(theme)}
      />
    );
  }

  renderBottomAxis(): React.Element<'g'> {
    const { groups, theme, xAxisLabel } = this.props;
    const xScale = this.getXScale();
    const left = (xScale.bandwidth() - xScale.step()) / 2;
    return (
      <g transform={`translate(${left}, 0)`}>
        <LayeredAxis
          axisValueFormatter={this.formatXAxisValue}
          fontSize={LABEL_FONT_SIZE}
          groupPadding={0}
          layers={this.buildXAxisLayers(groups)}
          onAxisValueClick={noop}
          scale={xScale}
          textColor={theme.axisLabelColor()}
          tickColor={theme.axisLineColor()}
          tickLabelProps={BOTTOM_AXIS_LABEL_PROPS}
          title={xAxisLabel}
          top={4}
          width={this.getGraphWidth()}
        />
      </g>
    );
  }

  @autobind
  renderInnerChart(): React.Element<'g'> {
    return <g>{this.props.groups.map(this.renderBox)}</g>;
  }

  renderGraph(): React.Element<typeof ResponsiveContainer> {
    const { height, theme, width } = this.props;
    return (
      <ResponsiveContainer
        axisBottom={this.renderBottomAxis()}
        axisLeft={this.renderLeftAxis()}
        backgroundProps={this.computeBackgroundProps(theme)}
        chart={this.renderInnerChart()}
        height={height}
        onChartResize={this.onInnerChartResize}
        width={width}
      />
    );
  }

  render(): React.Element<'div'> {
    return (
      <div className="box-plot" style={CONTAINER_STYLE}>
        {this.renderGraph()}
        {this.maybeRenderBoxTooltip()}
        {this.maybeRenderOutlierTooltip()}
      </div>
    );
  }
}

export default BoxPlotCore;
