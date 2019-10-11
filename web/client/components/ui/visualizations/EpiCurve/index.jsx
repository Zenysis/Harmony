// @flow
import * as React from 'react';
import { AxisBottom, AxisLeft } from '@vx/axis';

import EpiCurveTooltip from 'components/ui/visualizations/EpiCurve/EpiCurveToolTip';
import { autobind, memoizeOne } from 'decorators';
import {
  computeInnerHeight,
  computeInnerWidth,
  computeXScale,
  computeYScale,
  createTimeFormatter,
} from 'components/ui/visualizations/EpiCurve/EpiCurveUtil';
import type {
  Margin,
  TooltipData,
  Bin,
  HistogramData,
} from 'components/ui/visualizations/EpiCurve/types';

type Props = {
  /** Data required to draw the histogram */
  data: HistogramData,

  /** The width of the graph */
  width: number,

  /**
   * The space to leave on the top, left, bottom and right of the graph
   */
  margin: Margin,

  /**
   * The full width of the svg
   */
  width: number,

  /**
   * The full height of the svg
   */
  height: number,

  /**
   * The label of the x-axis
   */
  yAxisLabel: string,

  /**
   * The time format of the horizontal axis. For valid formats see moments docs
   * (https://momentjs.com/docs/#/parsing/string-format/)
   */
  horizontalAxisTimeFormat: string,

  /**
   * The format of the date to show in the tooltip.
   *  For valid formats see moments docs
   * (https://momentjs.com/docs/#/parsing/string-format/)
   */
  tooltipTimeFormat: string,

  /** A boolean value to enable showing or hiding bin value */
  showBinValues: boolean,
};

type State = {
  /** The data to show in the tooltip */
  tooltipData: TooltipData | void,

  /** The tooltip left coordinate */
  tooltipLeft: number,

  /** The tooltip top coordinate */
  tooltipTop: number,
};

const TEXT = t('ui.visualizations.EpiCurve');

class EpiCurveCore extends React.PureComponent<Props, State> {
  static defaultProps = {
    margin: {
      top: 10,
      left: 60,
      right: 10,
      bottom: 40,
    },
    yAxisLabel: TEXT.yAxisDefaultLabel,
    horizontalAxisTimeFormat: 'MMM YYYY',
    showBinValues: false,
    tooltipTimeFormat: 'MMM YYYY',
  };

  state = {
    tooltipData: undefined,
    tooltipLeft: 0,
    tooltipTop: 0,
  };

  @memoizeOne
  computeInnerHeight = computeInnerHeight;

  @memoizeOne
  computeInnerWidth = computeInnerWidth;

  @memoizeOne
  computeYScale = computeYScale;

  @memoizeOne
  computeXScale = computeXScale;

  getInnerWidth(): number {
    return this.computeInnerWidth(this.props.width, this.props.margin);
  }

  getInnerHeight(): number {
    return this.computeInnerHeight(this.props.height, this.props.margin);
  }

  getXScale() {
    const { data } = this.props;
    return this.computeXScale(
      data.lowerBound,
      data.upperBound,
      this.getInnerWidth(),
    );
  }

  getYScale() {
    return this.computeYScale(this.props.data.bins, this.getInnerHeight());
  }

  getLeftAxisLabelProps() {
    return {
      fontSize: 13,
      fontWeight: 'bold',

      // default styles from vx docs
      // eslint-disable-next-line
      // see https://github.com/hshoff/vx/tree/master/packages/vx-axis#Axis__labelProps
      textAnchor: 'middle',
      fontFamily: 'Arial',
      fill: 'black',
    };
  }

  getBottomAxisTickLabelProps() {
    return {
      fill: '#000000',
      fontWeight: 'bold',
      fontSize: 13,

      // default styles from vx docs
      // eslint-disable-next-line
      // see https://github.com/hshoff/vx/tree/master/packages/vx-axis#AxisBottom__tickLabelProps
      dy: '0.25em',
      fontFamily: 'Arial',
      textAnchor: 'middle',
    };
  }

  getLeftAxisTickLabelProps() {
    return {
      fill: '#000000',
      fontWeight: 'bold',
      fontSize: 13,

      // default styles from vx docs
      // eslint-disable-next-line
      // see https://github.com/hshoff/vx/tree/master/packages/vx-axis#AxisLeft__tickLabelProps
      dx: '-0.25em',
      dy: '0.25em',
      fontFamily: 'Arial',
      textAnchor: 'end',
    };
  }

  @autobind
  onBinMouseLeave() {
    this.setState({
      tooltipData: undefined,
      tooltipLeft: 0,
      tooltipTop: 0,
    });
  }

  onBinMouseMove(bin: Bin): void {
    const xScale = this.getXScale();
    const verticalTooltipOffset = -30;
    this.setState({
      tooltipLeft: xScale(bin.lowerBinLimit),
      tooltipTop: verticalTooltipOffset,
      tooltipData: {
        from: new Date(bin.lowerBinLimit),
        to: new Date(bin.upperBinLimit),
      },
    });
  }

  maybeRenderBinValues() {
    const { showBinValues, data } = this.props;

    if (!showBinValues) {
      return null;
    }

    const xScale = this.getXScale();
    const yScale = this.getYScale();

    const binValues = data.bins.map((bin: Bin) => {
      const binHeight = this.getInnerHeight() - yScale(bin.valuesCount);
      const textHeightGreaterThanBinHeight =
        bin.valuesCount < 1 || binHeight < 10;
      const verticalTextOffset = textHeightGreaterThanBinHeight ? -10 : 12;
      const key = `text-${xScale(bin.lowerBinLimit)}-${xScale(
        bin.upperBinLimit,
      )}`;

      return (
        <text
          key={key}
          x={(xScale(bin.lowerBinLimit) + xScale(bin.upperBinLimit)) / 2}
          y={yScale(bin.valuesCount) + verticalTextOffset}
          textAnchor="middle"
          className="epi-curve__bin-value"
        >
          {bin.valuesCount}
        </text>
      );
    });

    return <g>{binValues}</g>;
  }

  maybeRenderBinHighlight() {
    const { tooltipData } = this.state;

    if (!tooltipData) {
      return null;
    }

    const xScale = this.getXScale();
    const [minY, maxY] = this.getYScale().range();
    const xPosition = (xScale(tooltipData.from) + xScale(tooltipData.to)) / 2;

    return (
      <line
        x1={xPosition}
        x2={xPosition}
        y1={minY}
        y2={maxY}
        stroke="#3f73b4"
        strokeDasharray="2,2"
      />
    );
  }

  maybeRenderTooltip() {
    const { tooltipTimeFormat } = this.props;
    const { tooltipData, tooltipLeft, tooltipTop } = this.state;

    if (!tooltipData) {
      return null;
    }

    const tooltipTimeFormatter = createTimeFormatter(tooltipTimeFormat);

    return (
      <EpiCurveTooltip
        tooltipLeft={tooltipLeft}
        tooltipTop={tooltipTop}
        tooltipData={tooltipData}
        timeFormatter={tooltipTimeFormatter}
      />
    );
  }

  renderAxisBottom() {
    const { margin } = this.props;
    const xScale = this.getXScale();
    const formatDate = createTimeFormatter(this.props.horizontalAxisTimeFormat);
    return (
      <AxisBottom
        scale={xScale}
        left={margin.left}
        top={this.getInnerHeight() + margin.top}
        stroke="#000000"
        tickStroke="#000000"
        tickFormat={formatDate}
        tickLabelProps={this.getBottomAxisTickLabelProps}
      />
    );
  }

  renderAxisLeft() {
    const { margin, yAxisLabel } = this.props;
    const yScale = this.getYScale();
    return (
      <AxisLeft
        scale={yScale}
        left={margin.left}
        top={margin.top}
        stroke="#000000"
        label={yAxisLabel}
        labelProps={this.getLeftAxisLabelProps()}
        tickStroke="#000000"
        tickLabelProps={this.getLeftAxisTickLabelProps}
      />
    );
  }

  renderBackground() {
    const { width, height } = this.props;
    return <rect width={width} height={height} fill="#dddddd" />;
  }

  renderHistogram(): React.Node {
    const xScale = this.getXScale();
    const yScale = this.getYScale();
    const { data } = this.props;
    const binRects = data.bins.map(
      (bin: Bin): React.Node => {
        const { lowerBinLimit, valuesCount, upperBinLimit } = bin;
        const binWidth = xScale(upperBinLimit) - xScale(lowerBinLimit);
        const binHeight = this.getInnerHeight() - yScale(valuesCount);
        const key = `${valuesCount}-${lowerBinLimit.toLocaleString()}`;
        const transform = `translate(${xScale(lowerBinLimit)},${yScale(
          valuesCount,
        )})`;

        return (
          <rect
            key={key}
            transform={transform}
            width={binWidth}
            height={binHeight}
            fill="red"
            fillOpacity={0.3}
            stroke="red"
            strokeOpacity={1}
            onMouseMove={() => this.onBinMouseMove(bin)}
            onMouseLeave={this.onBinMouseLeave}
          />
        );
      },
    );

    return binRects;
  }

  render() {
    const { width, height, margin } = this.props;
    return (
      <div className="epi-curve__visualization__container">
        <svg width={width} height={height}>
          {this.renderBackground()}
          <g transform={`translate(${margin.left},${margin.top})`}>
            {this.renderHistogram()}
            {this.maybeRenderBinValues()}
            {this.maybeRenderBinHighlight()}
          </g>
          {this.renderAxisBottom()}
          {this.renderAxisLeft()}
        </svg>
        {this.maybeRenderTooltip()}
      </div>
    );
  }
}

export default EpiCurveCore;
