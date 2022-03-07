// @flow
import * as React from 'react';
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
) => { fontWeight?: 'bold' | number, cursor?: string };

type BandScale = $FlowTODO;

type DefaultProps = {
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

type Props = {
  ...DefaultProps,
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
};

type TickData = {
  layerValue: LayerValue,
  textLabel: string,
  textProps: {
    fill?: string,
    fontSize?: number,
    fontWeight?: string | number,
    cursor?: string,
  },
  xCenter: number,
};

const DIAGONAL_ANGLE = 45;

// Props determining how to position the text based on the angle the user has
// chosen.
function buildTextAnglePositionProps(
  angle: 'diagonal' | 'horizontal' | 'vertical',
  tickLength: number,
  xCenter: number,
): {
  dominantBaseline: string,
  textAnchor: string,
  x: number,
  y: number,
  transform?: string,
} {
  if (angle === 'diagonal') {
    const y = tickLength + 4;
    return {
      dominantBaseline: 'middle',
      textAnchor: 'start',
      transform: `rotate(${DIAGONAL_ANGLE}, ${xCenter}, ${y})`,
      x: xCenter,
      y,
    };
  }

  if (angle === 'vertical') {
    return {
      dominantBaseline: 'central',
      textAnchor: 'end',
      transform: `rotate(-90, 0, 0)`,
      x: -4,
      y: xCenter,
    };
  }

  // Default case is the `horizontal` angle.
  return {
    dominantBaseline: 'hanging',
    textAnchor: 'middle',
    x: xCenter,
    y: tickLength + 4,
  };
}

export default class CollisionAvoidantAxis extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    hideOverlapping: false,
    maxRows: 3,
    minTickLength: 8,
    onHeightUpdate: noop,
    tickOuterPadding: 2,
  };

  _ref: $ElementRefObject<'g'> = React.createRef();

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
    ref: ?React.ElementRef<'g'>,
    layerID: number,
    onHeightUpdate: (height: number, layerID: number) => void,
  ) {
    if (!ref) {
      return;
    }

    // $FlowIssue[prop-missing] - Does not understand SVG elements.
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
    angle: 'diagonal' | 'horizontal' | 'vertical',
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

        // getStringWidth expects a string for fontSize not a number
        const textStyle = textProps?.fontSize
          ? { ...textProps, fontSize: `${textProps.fontSize}px` }
          : textProps;

        // Compute the horizontal size this label will take up. In non-rotated
        // mode, this will be equal to the width of the label. In rotated mode,
        // this will be the height of the label.
        // HACK(stephen): In limited testing, it seems like the text height is
        // close to the font size + 3 or 4 pixels. This is a bit hand-wavey for
        // the `diagonal` use case, but it works pretty well after testing.
        const labelSize =
          angle === 'horizontal'
            ? getStringWidth(textLabel, textStyle)
            : fontSize + 3;
        const tickStart = xCenter - labelSize / 2;
        const tickEnd = xCenter + labelSize / 2;
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

          // HACK(stephen): We want to trigger a recalculation of the height of
          // the axis level during rotated mode. By passing the text length, we
          // can force a height update when the largest axis label changes.
          if (angle !== 'horizontal') {
            rowCount = Math.max(rowCount, textLabel.length);
          }
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
      layerData,
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
      layerData.angle,
    );
  }

  renderTick(
    tickData: TickData,
    tickLength: number,
  ): [void | React.Element<'line'>, React.Element<'text'>] {
    const { layerData, onAxisValueClick, tickColor } = this.props;
    const { angle, layerDimensions } = layerData;
    const { layerValue, textLabel, textProps, xCenter } = tickData;
    const { key } = layerValue;

    let tick;
    if (tickLength > 0) {
      tick = (
        <line
          key={`${key}--tick`}
          stroke={tickColor}
          x1={xCenter}
          x2={xCenter}
          y1={0}
          y2={tickLength}
        />
      );
    }

    const text = (
      <text
        className="ui-collision-avoidant-axis__tick-text"
        key={`${key}--text`}
        onClick={() => onAxisValueClick(layerValue, layerDimensions)}
        {...buildTextAnglePositionProps(angle, tickLength, xCenter)}
        {...textProps}
      >
        {textLabel}
      </text>
    );

    return [tick, text];
  }

  renderTextWithTicks(): React.Node {
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
      if (tick) {
        tickMarks.push(tick);
      }
      tickText.push(text);
    });

    return (
      <React.Fragment>
        {tickMarks.length > 0 && (
          <g className="ui-collision-avoidant-axis__tick-mark-layer">
            {tickMarks}
          </g>
        )}
        <g className="ui-collision-avoidant-axis__tick-text-layer">
          {tickText}
        </g>
      </React.Fragment>
    );
  }

  render(): React.Element<'g'> {
    return (
      <g className="ui-collision-avoidant-axis" ref={this._ref}>
        {this.renderTextWithTicks()}
      </g>
    );
  }
}
