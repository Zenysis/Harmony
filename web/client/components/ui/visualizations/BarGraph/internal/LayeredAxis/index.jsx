// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import CollisionAvoidantAxis from 'components/ui/visualizations/BarGraph/internal/LayeredAxis/CollisionAvoidantAxis';
import GroupAxisLine from 'components/ui/visualizations/BarGraph/internal/LayeredAxis/GroupAxisLine';
import { autobind, memoizeOne } from 'decorators';
import type { DimensionID } from 'components/ui/visualizations/BarGraph/types';
import type {
  LayerData,
  LayerValue,
} from 'components/ui/visualizations/BarGraph/internal/LayeredAxis/types';

type BandScale = any;

type Props = {
  /**
   * The padding between the end of one bar group and the beginning of the next
   * bar group.
   */
  groupPadding: number,
  layers: $ReadOnlyArray<LayerData>,
  onAxisValueClick: (
    layerValue: LayerValue,
    layerDimensions: $ReadOnlyArray<DimensionID>,
  ) => void,
  scale: BandScale,

  axisValueFormatter: (
    layerValue: LayerValue,
    layerDimensions: $ReadOnlyArray<DimensionID>,
  ) => string,
  fontSize: number,
  textColor: string,
  tickColor: string,
  tickLabelProps: (
    layerValue: LayerValue,
    layerDimensions: $ReadOnlyArray<DimensionID>,
  ) => {},
  title: string,
  titleLabelProps: {}, // TODO(stephen): FIX THIS.
  top: number,
  width: number,
};

type State = {
  axisHeights: Zen.Array<number>,
};

export default class LayeredAxis extends React.PureComponent<Props, State> {
  static defaultProps = {
    fontSize: 12,
    textColor: '#000000',
    tickColor: '#000000',
    title: '',
    titleLabelProps: {
      fill: 'black',
      fontSize: 12,
      textAnchor: 'middle',
    },
    top: 0,
  };

  state: State = {
    axisHeights: Zen.Array.create(),
  };

  @memoizeOne
  calculateAxisOffsets(axisHeights: Zen.Array<number>): $ReadOnlyArray<number> {
    let curOffset = 0;
    return axisHeights
      .reverse()
      .mapValues((height: number, idx: number) => {
        const offset = idx === 0 ? 0 : curOffset;
        curOffset += height + 10;
        return offset;
      })
      .reverse();
  }

  getAxisOffset(layerIdx: number): number {
    const axisOffsets = this.calculateAxisOffsets(this.state.axisHeights);
    if (axisOffsets.length <= layerIdx) {
      return (this.props.layers.length - layerIdx - 1) * 50;
    }
    return axisOffsets[layerIdx];
  }

  @memoizeOne
  calculateTitleOffset(axisHeights: Zen.Array<number>): number {
    return axisHeights.reduce((acc, height) => acc + height, 0);
  }

  @autobind
  onAxisHeightUpdate(height: number, layerIdx: number) {
    if (layerIdx >= 0 && height > 0) {
      this.setState(({ axisHeights }) => {
        if (axisHeights.get(layerIdx) !== height) {
          return {
            axisHeights: axisHeights.set(layerIdx, height),
          };
        }

        return { axisHeights };
      });
    }
  }

  maybeRenderAxisTitle() {
    const { title, titleLabelProps, width } = this.props;
    if (title.length === 0) {
      return null;
    }

    const offset = this.calculateTitleOffset(this.state.axisHeights);
    return (
      <g
        className="ui-layered-axis__axis-title"
        transform={`translate(0, ${offset})`}
      >
        <text
          dominantBaseline="hanging"
          x={width / 2}
          y={10}
          {...titleLabelProps}
        >
          {title}
        </text>
      </g>
    );
  }

  renderGroupAxisLine(
    layerDimensions: $ReadOnlyArray<DimensionID>,
    layerValue: LayerValue,
    nextLayerValue: LayerValue | void,
  ) {
    const {
      groupPadding,
      onAxisValueClick,
      scale,
      tickColor,
      width,
    } = this.props;
    const offset = groupPadding / 4;
    const start = scale(layerValue.key) - offset;
    const nextGroupStart =
      nextLayerValue !== undefined ? scale(nextLayerValue.key) : width;
    const end = nextGroupStart - 3 * offset;
    return (
      <GroupAxisLine
        chartWidth={width}
        end={end}
        key={layerValue.key}
        layerDimensions={layerDimensions}
        layerValue={layerValue}
        onClick={onAxisValueClick}
        start={start}
        tickColor={tickColor}
      />
    );
  }

  renderGroupAxisLines(
    layerData: LayerData,
  ): $ReadOnlyArray<React.Element<typeof GroupAxisLine>> {
    const { layerDimensions, layerValues } = layerData;
    return layerValues.map((val, idx) =>
      this.renderGroupAxisLine(layerDimensions, val, layerValues[idx + 1]),
    );
  }

  @autobind
  renderLayer(layerData: LayerData, idx: number) {
    const {
      axisValueFormatter,
      fontSize,
      groupPadding,
      onAxisValueClick,
      scale,
      textColor,
      tickColor,
      tickLabelProps,
      width,
    } = this.props;
    const offset = this.getAxisOffset(idx);
    // Include the axis lines if this layer is not the closest layer to the
    // bars.
    const axisLines =
      offset !== 0 ? this.renderGroupAxisLines(layerData) : null;
    return (
      <g
        className="ui-layered-axis__axis-layer"
        key={idx}
        transform={`translate(0, ${offset})`}
      >
        {axisLines}
        <CollisionAvoidantAxis
          axisValueFormatter={axisValueFormatter}
          fontSize={fontSize}
          groupPadding={groupPadding}
          hideOverlapping
          layerData={layerData}
          layerID={idx}
          onAxisValueClick={onAxisValueClick}
          onHeightUpdate={this.onAxisHeightUpdate}
          scale={scale}
          textColor={textColor}
          tickColor={tickColor}
          tickLabelProps={tickLabelProps}
          width={width}
        />
      </g>
    );
  }

  render() {
    const { layers, top } = this.props;
    return (
      <g className="ui-layered-axis" transform={`translate(0, ${top})`}>
        {layers.map(this.renderLayer)}
        {this.maybeRenderAxisTitle()}
      </g>
    );
  }
}
