// @flow
import * as React from 'react';
import { BoxPlot, ViolinPlot } from '@vx/stats';
import { PatternLines } from '@vx/pattern';
import { localPoint } from '@vx/event';

import BoxPlotTheme from 'components/ui/visualizations/BoxPlot/models/BoxPlotTheme';
import Outliers from 'components/ui/visualizations/BoxPlot/internal/Outliers';
import autobind from 'decorators/autobind';
import { noop } from 'util/util';
import type {
  BoxPlotBoxData,
  BoxPlotDataPoint,
  BoxTooltipData,
  OutlierTooltipData,
} from 'components/ui/visualizations/BoxPlot/types';

type LinearScale = $FlowTODO;

type DefaultProps = {
  addViolinPatternDefinition: boolean,
  boxOffset: number,
  fill: string,
  fillOpacity: number,
  left: number,
  onBoxHoverStart: BoxTooltipData => void,
  onBoxHoverEnd: () => void,
  onOutlierClick: BoxPlotDataPoint => void,
  onOutlierHoverStart: OutlierTooltipData => void,
  onOutlierHoverEnd: () => void,
  outlierClassName: string,
  outlierStroke: string,
  outlierStrokeWidth: number,
  showOutliers: boolean,
  showViolinPlot: boolean,
  stroke: string,
  strokeWidth: number,
  top: number,
  violinFill: string,
  violinPatternFill: string,
  violinPatternDirection: $ReadOnlyArray<
    'diagonal' | 'horizontal' | 'vertical',
  >,
  violinPatternId: string,
  violinPatternStroke: string,
  violinStroke: string,
};

type Props = {
  ...DefaultProps,
  boxWidth: number,
  data: BoxPlotBoxData,
  scale: LinearScale,
  violinWidth: number,
};

export default class Box extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    addViolinPatternDefinition: false,
    boxOffset: 0,
    fill: BoxPlotTheme.LightTheme.boxPlotFillColor(),
    fillOpacity: 0.4,
    left: 0,
    onBoxHoverStart: noop,
    onBoxHoverEnd: noop,
    onOutlierClick: noop,
    onOutlierHoverStart: noop,
    onOutlierHoverEnd: noop,
    outlierClassName: '',
    outlierStroke: BoxPlotTheme.LightTheme.outliersStrokeColor(),
    outlierStrokeWidth: 0.8,
    showOutliers: false,
    showViolinPlot: true,
    stroke: BoxPlotTheme.LightTheme.boxPlotLinesColor(),
    strokeWidth: 2,
    top: 0,
    violinFill: BoxPlotTheme.LightTheme.violinFillColor(),
    violinPatternFill: BoxPlotTheme.LightTheme.violinPatternsFillColor(),
    violinPatternDirection: ['horizontal'],
    violinPatternId: 'hViolinLines',
    violinPatternStroke: BoxPlotTheme.LightTheme.violinPatternsStrokeColor(),
    violinStroke: BoxPlotTheme.LightTheme.violinPlotStrokeColor(),
  };

  @autobind
  onBoxHoverStart(event: SyntheticMouseEvent<SVGRectElement>) {
    const { data, onBoxHoverStart } = this.props;
    const { x, y } = localPoint(event);
    onBoxHoverStart({
      boxPlotSummary: data.data.boxPlotSummary,
      dimensionValue: data.key,
      left: x,
      top: y,
    });
  }

  maybeRenderViolinPatternDefinition(): React.Node {
    const {
      addViolinPatternDefinition,
      violinPatternFill,
      violinPatternDirection,
      violinPatternStroke,
      violinPatternId,
    } = this.props;
    if (!addViolinPatternDefinition) {
      return null;
    }

    return (
      <PatternLines
        fill={violinPatternFill}
        height={3}
        id={violinPatternId}
        orientation={violinPatternDirection}
        stroke={violinPatternStroke}
        strokeWidth={0.5}
        width={3}
      />
    );
  }

  maybeRenderViolinPlot(): React.Node {
    const {
      data,
      scale,
      showViolinPlot,
      violinFill,
      violinStroke,
      violinWidth,
    } = this.props;
    const { binData } = data.data;
    if (!showViolinPlot || binData.length === 0) {
      return null;
    }

    return (
      <React.Fragment>
        {this.maybeRenderViolinPatternDefinition()}
        <ViolinPlot
          data={binData}
          fill={violinFill}
          left={0}
          stroke={violinStroke}
          valueScale={scale}
          width={violinWidth}
        />
      </React.Fragment>
    );
  }

  maybeRenderOutliers(): React.Node {
    const {
      boxOffset,
      boxWidth,
      data,
      fill,
      fillOpacity,
      onOutlierClick,
      onOutlierHoverEnd,
      onOutlierHoverStart,
      outlierClassName,
      outlierStroke,
      outlierStrokeWidth,
      scale,
      showOutliers,
    } = this.props;
    const { outliers } = data.data;
    if (!showOutliers || outliers.length === 0) {
      return null;
    }

    return (
      <Outliers
        center={boxOffset + boxWidth / 2}
        dimensionValue={data.key}
        fill={fill}
        fillOpacity={fillOpacity}
        onOutlierClick={onOutlierClick}
        onOutlierHoverEnd={onOutlierHoverEnd}
        onOutlierHoverStart={onOutlierHoverStart}
        outlierClassName={outlierClassName}
        outliers={outliers}
        scale={scale}
        stroke={outlierStroke}
        strokeWidth={outlierStrokeWidth}
      />
    );
  }

  renderBox(): React.Node {
    const {
      boxOffset,
      boxWidth,
      data,
      fill,
      fillOpacity,
      scale,
      stroke,
      strokeWidth,
    } = this.props;
    const { boxPlotSummary } = data.data;
    return (
      <BoxPlot
        boxWidth={boxWidth}
        fill={fill}
        fillOpacity={fillOpacity}
        firstQuartile={boxPlotSummary.firstQuartile}
        left={boxOffset}
        max={boxPlotSummary.max}
        median={boxPlotSummary.median}
        min={boxPlotSummary.min}
        stroke={stroke}
        strokeWidth={strokeWidth}
        thirdQuartile={boxPlotSummary.thirdQuartile}
        valueScale={scale}
      />
    );
  }

  renderHoverArea(): React.Node {
    const {
      boxWidth,
      data,
      onBoxHoverEnd,
      scale,
      showViolinPlot,
      violinWidth,
    } = this.props;
    const { boxPlotSummary } = data.data;
    const width = showViolinPlot ? violinWidth : boxWidth;

    const y1 = scale(boxPlotSummary.max);
    const y2 = scale(boxPlotSummary.min);

    // Ensure that there is at least 5px of hoverable area. Without this, if the
    // box plot is "collapsed" (i.e. upper quartile = lower quartile) then there
    // will be no hoverable area which is confusing to the user.
    const height = Math.max(5, y2 - y1);

    return (
      <rect
        fill="transparent"
        height={height}
        onMouseMove={this.onBoxHoverStart}
        onMouseLeave={onBoxHoverEnd}
        width={width}
        x={0}
        y={y1}
      />
    );
  }

  render(): React.Element<'g'> {
    const { left, top } = this.props;
    return (
      <g transform={`translate(${left}, ${top})`}>
        {this.maybeRenderViolinPlot()}
        {this.renderBox()}
        {this.maybeRenderOutliers()}
        {this.renderHoverArea()}
      </g>
    );
  }
}
