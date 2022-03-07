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

type BandScale = $FlowTODO;

type DefaultProps = {
  fontSize: number,

  /**
   * The maximum height the LayeredAxis should try to fit within. Since the
   * LayeredAxis cannot actually guarantee that it matches an exact height
   * (since the child layers have variable height), it will use this as a
   * guideline to determine how many rows each child axis can use.
   */
  maxHeightSuggestion: number | void,
  textColor: string,
  tickColor: string,
  title: string,
  titleLabelProps: {
    fill?: string,
    fontSize?: number,
    textAnchor?: string,
    fontWeight?: string | number,
    cursor?: string,
  },
  top: number,
};

type Props = {
  ...DefaultProps,
  axisValueFormatter: (
    layerValue: LayerValue,
    layerDimensions: $ReadOnlyArray<DimensionID>,
  ) => string,

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
  tickLabelProps: (
    layerValue: LayerValue,
    layerDimensions: $ReadOnlyArray<DimensionID>,
  ) => { fontWeight?: 'bold' | number, cursor?: string },
  width: number,
};

type State = {
  axisHeights: Zen.Array<number>,

  // Track the max-height seen for an axis layer separately from the current
  // axis layer height. The max-height is needed since the `maxRows` for each
  // axis can change, which triggers a change to `axisHeights`. This happens
  // when we try to keep the height of the `LayeredAxis` within the
  // `maxHeightSuggestion`.
  axisMaxHeights: Zen.Array<number>,
};

function zeroFilledArray(size: number): Array<number> {
  return Array(size).fill(0);
}

export default class LayeredAxis extends React.PureComponent<Props, State> {
  static defaultProps: DefaultProps = {
    fontSize: 12,
    maxHeightSuggestion: undefined,
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
    axisHeights: Zen.Array.create(zeroFilledArray(this.props.layers.length)),
    axisMaxHeights: Zen.Array.create(zeroFilledArray(this.props.layers.length)),
  };

  componentDidMount() {
    this.updateAxisHeights(true);
  }

  componentDidUpdate(prevProps: Props) {
    this.updateAxisHeights(this.props.layers !== prevProps.layers);
  }

  updateAxisHeights(layersChanged: boolean) {
    const { axisHeights } = this.state;
    const axisHeightsSize = axisHeights.size();
    const newSize = this.props.layers.length;
    if (axisHeightsSize === newSize && !layersChanged) {
      return;
    }

    const newState = {};
    if (axisHeightsSize !== newSize) {
      newState.axisHeights =
        axisHeightsSize > newSize
          ? axisHeights.slice(0, newSize)
          : axisHeights.concat(zeroFilledArray(newSize - axisHeightsSize));
    }

    // If the layers have changed then we need to clear out the max height
    // stored and recalculate it the next time the height update comes in. This
    // is needed because even if the layer count stays the same, since if the
    // layers have changed we cannot rely on the previous layer max (the number
    // of rows the layer takes up might have changed with the update).
    if (layersChanged) {
      newState.axisMaxHeights = Zen.Array.create(zeroFilledArray(newSize));
    }
    this.setState(newState);
  }

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
  calculateTitleOffset(
    axisHeights: Zen.Array<number>,
    axisOffsets: $ReadOnlyArray<number>,
  ): number {
    if (axisOffsets.length === 0 || axisHeights.isEmpty()) {
      return 20;
    }
    return axisOffsets[0] + axisHeights.first() + 20;
  }

  /**
   * Determine how many rows each layer can use so that they fit within the
   * suggested maximum height.
   * NOTE(stephen): This is a really rough approximation.
   */
  @memoizeOne
  calculateMaxRows(
    axisMaxHeights: Zen.Array<number>,
    maxHeightSuggestion: number | void,
  ): number {
    if (maxHeightSuggestion === undefined) {
      return 3;
    }

    const currentHeight = axisMaxHeights.reduce((acc, v) => acc + v, 0);
    return currentHeight > maxHeightSuggestion ? 1 : 3;
  }

  @autobind
  onAxisHeightUpdate(height: number, layerIdx: number) {
    if (layerIdx >= 0 && height > 0) {
      this.setState(({ axisHeights, axisMaxHeights }) => {
        if (
          axisHeights.size() > layerIdx &&
          axisHeights.get(layerIdx) !== height &&
          axisHeights.size() === axisMaxHeights.size()
        ) {
          return {
            axisHeights: axisHeights.set(layerIdx, height),
            axisMaxHeights: axisMaxHeights.set(
              layerIdx,
              Math.max(height, axisMaxHeights.get(layerIdx)),
            ),
          };
        }

        return undefined;
      });
    }
  }

  maybeRenderAxisTitle(): React.Node {
    const { title, titleLabelProps, width } = this.props;
    if (title.length === 0) {
      return null;
    }

    const { axisHeights } = this.state;
    const offset = this.calculateTitleOffset(
      axisHeights,
      this.calculateAxisOffsets(axisHeights),
    );
    return (
      <g
        className="ui-layered-axis__axis-title"
        transform={`translate(${width / 2}, ${offset})`}
      >
        <text dy="0.35em" {...titleLabelProps}>
          {title}
        </text>
      </g>
    );
  }

  renderGroupAxisLine(
    layerDimensions: $ReadOnlyArray<DimensionID>,
    layerValue: LayerValue,
    nextLayerValue: LayerValue | void,
  ): React.Element<typeof GroupAxisLine> {
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
  renderLayer(layerData: LayerData, idx: number): React.Element<'g'> {
    const {
      axisValueFormatter,
      fontSize,
      groupPadding,
      maxHeightSuggestion,
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
    const maxRows =
      layerData.angle === 'horizontal'
        ? this.calculateMaxRows(this.state.axisMaxHeights, maxHeightSuggestion)
        : 1;
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
          maxRows={maxRows}
          minTickLength={layerData.angle === 'vertical' ? 0 : undefined}
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

  render(): React.Element<'g'> {
    // NOTE(stephen): Only render the layers if there is enough space to draw
    // them in without things looking terrible.
    const { layers, top, width } = this.props;
    return (
      <g className="ui-layered-axis" transform={`translate(0, ${top})`}>
        {width > 10 && layers.map(this.renderLayer)}
        {this.maybeRenderAxisTitle()}
      </g>
    );
  }
}
