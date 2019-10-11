// @flow
import * as React from 'react';
import { Line as LineOriginal } from '@vx/shape';
import { Point } from '@vx/point';
import { getStringWidth } from '@vx/text';

import memoizeOne from 'decorators/memoizeOne';
import { noop } from 'util/util';
import type { DimensionID } from 'components/ui/visualizations/BarGraph/types';
import type {
  LayerData,
  LayerValue,
} from 'components/ui/visualizations/BarGraph/internal/LayeredAxis/types';

type AxisValueFormatter = (
  layerValue: LayerValue,
  layerDimensions: $ReadOnlyArray<DimensionID>,
) => string;

type TickLabelPropsCreator = (
  layerValue: LayerValue,
  layerDimensions: $ReadOnlyArray<DimensionID>,
) => $Shape<{ fontWeight: 'bold' | number }>;

type BandScale = any;

type Props = {
  axisValueFormatter: AxisValueFormatter,
  fontSize: number,

  /**
   * The padding between the end of one bar group and the beginning of the next
   * bar group.
   */
  groupPadding: number,
  layerData: LayerData,
  layerID: number,
  onAxisValueClick: (
    layerValue: LayerValue,
    layerDimensions: $ReadOnlyArray<DimensionID>,
  ) => void,
  textColor: string,
  tickColor: string,
  tickLabelProps: TickLabelPropsCreator,
  scale: BandScale,
  width: number,

  hideOverlapping: boolean,

  /**
   * The maximum number of rows of text that can be used to avoid colliding
   * labels.
   */
  maxRows: number,
  minTickLength: number,
  onHeightUpdate: (height: number, layerIdx: number) => void,
  tickOuterPadding: number,
};

type TickData = {
  layerValue: LayerValue,
  textLabel: string,
  textProps: { [string]: string | number },
  xCenter: number,
};

const Line = React.memo<any>(LineOriginal);

export default class CollisionAvoidantAxis extends React.PureComponent<Props> {
  static defaultProps = {
    hideOverlapping: false,
    maxRows: 3,
    minTickLength: 8,
    onHeightUpdate: noop,
    tickOuterPadding: 2,
  };

  _ref: $RefObject<'g'> = React.createRef();

  componentDidMount() {
    const { layerID, onHeightUpdate } = this.props;
    this.updateHeight(
      this.getTickLengths()[1],
      this._ref.current,
      layerID,
      onHeightUpdate,
    );
  }

  componentDidUpdate() {
    const { layerID, onHeightUpdate } = this.props;
    this.updateHeight(
      this.getTickLengths()[1],
      this._ref.current,
      layerID,
      onHeightUpdate,
    );
  }

  @memoizeOne
  updateHeight(
    rowCount: number,
    ref: React.ElementRef<'g'> | null,
    layerID: number,
    onHeightUpdate: (height: number, layerID: number) => void,
  ) {
    if (!ref) {
      return;
    }

    // $FlowIssue - Flow does not understand SVG elements.
    onHeightUpdate(ref.getBBox().height, layerID);
  }

  @memoizeOne
  buildTickData(
    axisValueFormatter: AxisValueFormatter,
    fontSize: number,
    groupPadding: number,
    layerData: LayerData,
    scale: BandScale,
    textColor: string,
    tickLabelProps: TickLabelPropsCreator,
    width: number,
  ): $ReadOnlyArray<TickData> {
    const { layerDimensions, layerValues } = layerData;
    return layerValues.map((layerValue, idx) => {
      const start = scale(layerValue.key);
      const nextLayerValue = layerValues[idx + 1];
      const nextStart =
        nextLayerValue !== undefined ? scale(nextLayerValue.key) : width;
      const xCenter = (start + nextStart - groupPadding) / 2;
      return {
        layerValue,
        textLabel: axisValueFormatter(layerValue, layerDimensions),
        textProps: {
          fill: textColor,
          fontSize,
          textAnchor: 'middle',
          ...tickLabelProps(layerValue, layerDimensions),
        },
        xCenter,
      };
    });
  }

  getTickData(): $ReadOnlyArray<TickData> {
    const {
      axisValueFormatter,
      fontSize,
      groupPadding,
      layerData,
      scale,
      textColor,
      tickLabelProps,
      width,
    } = this.props;
    return this.buildTickData(
      axisValueFormatter,
      fontSize,
      groupPadding,
      layerData,
      scale,
      textColor,
      tickLabelProps,
      width,
    );
  }

  /**
   * Compute the length the tick should be for each data point and detect if it
   * will overflow with any other ticks. Also return the number of rows that are
   * needed.
   * HACK(stephen): I don't like returning row count with this method, but it
   * is more efficient. Performance improvements are necessary because of the
   * focus bar usage.
   */
  @memoizeOne
  buildTickLengths(
    tickData: $ReadOnlyArray<TickData>,
    tickOuterPadding: number,
    minTickLength: number,
    fontSize: number,
    maxRows: number,
    hideOverlapping: boolean,
  ): [$ReadOnlyArray<[number, boolean]>, number] {
    if (tickData.length === 0 || maxRows < 1) {
      return [[], 0];
    }

    // Track the x value that text should be displayed at for each row of axis
    // text.
    const maxTextPositions = new Array(maxRows).fill([-Infinity, -Infinity]);
    let rowCount = 1;
    return [
      tickData.map(({ textLabel, textProps, xCenter }) => {
        // Try to keep values on the lowest level if possible.
        // NOTE(stephen): Interesting problem to try and produce the *minimum*
        // number of deviations from level 0.
        let bestRowIdx = 0;
        let smallestOverlap;
        let willOverlap = false;
        const textWidth = getStringWidth(textLabel, textProps);
        const tickStart = xCenter - textWidth / 2;
        const tickEnd = xCenter + textWidth / 2;
        maxTextPositions.some((position, rowIdx) => {
          const curEnd = position[1];
          const paddedTickStart = tickStart - tickOuterPadding;

          // Can this tick be placed at this level without overlapping other
          // text at the same level (including padding)?
          if (paddedTickStart > curEnd + tickOuterPadding) {
            willOverlap = !maxTextPositions.every(([start, end], idx) => {
              // Ensure the tick mark will not overlap any previous row's text.
              if (idx < rowIdx) {
                return xCenter > end + tickOuterPadding;
              }

              // Ensure the tick mark from later rows will not overlap with
              // this row's text.
              if (idx > rowIdx) {
                const midpoint = (start + end) / 2;
                return paddedTickStart > midpoint;
              }
              return true;
            });

            if (!willOverlap) {
              bestRowIdx = rowIdx;
              return true;
            }
          }

          // Find the level where text will overlap the least amount. This is
          // the worst case scenario where all levels will produce text that
          // overlaps.
          if (smallestOverlap === undefined || curEnd < smallestOverlap) {
            bestRowIdx = rowIdx;
            smallestOverlap = curEnd;
            willOverlap = true;
          }
          return false;
        });

        if (!(hideOverlapping && willOverlap)) {
          maxTextPositions[bestRowIdx] = [tickStart, tickEnd];
          rowCount = Math.max(rowCount, bestRowIdx + 1);
        }

        return [minTickLength + bestRowIdx * fontSize * 1.8, willOverlap];
      }),
      rowCount,
    ];
  }

  getTickLengths(): [$ReadOnlyArray<[number, boolean]>, number] {
    const {
      fontSize,
      hideOverlapping,
      maxRows,
      minTickLength,
      tickOuterPadding,
    } = this.props;
    return this.buildTickLengths(
      this.getTickData(),
      tickOuterPadding,
      minTickLength,
      fontSize,
      maxRows,
      hideOverlapping,
    );
  }

  renderTick(tickData: TickData, tickLength: number) {
    const { layerData, onAxisValueClick, tickColor } = this.props;
    const { layerValue, textLabel, textProps, xCenter } = tickData;
    const { key } = layerValue;
    const tickMarkStart = new Point({ x: xCenter, y: 0 });
    const tickMarkEnd = new Point({
      x: xCenter,
      y: tickLength,
    });
    const onClick = () =>
      onAxisValueClick(layerValue, layerData.layerDimensions);

    const tick = (
      <g key={`${key}--tick`} onClick={onClick}>
        <Line from={tickMarkStart} to={tickMarkEnd} stroke={tickColor} />
      </g>
    );

    const text = (
      <g key={`${key}--text`} onClick={onClick}>
        <text
          className="ui-collision-avoidant-axis__tick-text"
          dominantBaseline="hanging"
          x={xCenter}
          y={tickLength + 4}
          {...textProps}
        >
          {textLabel}
        </text>
      </g>
    );
    return [tick, text];
  }

  renderTicks() {
    const { hideOverlapping, width } = this.props;
    const tickMarks = [];
    const tickText = [];
    const tickLengths = this.getTickLengths()[0];
    this.getTickData().forEach((tickData, idx) => {
      const { xCenter } = tickData;
      if (xCenter < 0 || xCenter > width) {
        return;
      }

      const [tickLength, isOverlapping] = tickLengths[idx];
      if (hideOverlapping && isOverlapping) {
        return;
      }
      const [tick, text] = this.renderTick(tickData, tickLength);
      tickMarks.push(tick);
      tickText.push(text);
    });

    return (
      <React.Fragment>
        <g className="ui-collision-avoidant-axis__tick-mark-layer">
          {tickMarks}
        </g>
        <g className="ui-collision-avoidant-axis__tick-text-layer">
          {tickText}
        </g>
      </React.Fragment>
    );
  }

  render() {
    return (
      <g className="ui-collision-avoidant-axis" ref={this._ref}>
        {this.renderTicks()}
      </g>
    );
  }
}
