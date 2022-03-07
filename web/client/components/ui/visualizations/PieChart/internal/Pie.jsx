// @flow
import * as React from 'react';

import buildSegmentLabelData, {
  labelsCollide,
} from 'components/ui/visualizations/PieChart/internal/buildSegmentLabelData';
import memoizeOne from 'decorators/memoizeOne';
import type {
  ArcData,
  ArcPath,
  LabelData,
  PieChartTheme,
} from 'components/ui/visualizations/PieChart/types';

type Props = {
  arcs: $ReadOnlyArray<ArcData>,
  donut: boolean,
  highlightedSegments: $ReadOnlyArray<string>,
  path: ArcPath,
  theme: PieChartTheme,
};

const LABEL_DISTANCE = 8;

/**
 * Component that will draw a Pie chart using the arc data and path information
 * provided.
 */
export default class Pie extends React.PureComponent<Props> {
  // Compute the format and position of the percent value for every arc segment
  // in the pie.
  // NOTE(stephen): Calculating every position instead of only the highlighted
  // positions so that we can scale the chart *once* when segments are shown
  // and not multiple times as the user interacts with it.
  @memoizeOne
  buildSegmentLabelData: typeof buildSegmentLabelData = buildSegmentLabelData;

  getSegmentLabelData(): $ReadOnlyArray<LabelData> {
    const { arcs, path, theme } = this.props;
    return this.buildSegmentLabelData(
      arcs,
      path,
      theme.labelFontSize,
      theme.displayLabelType,
      LABEL_DISTANCE,
    );
  }

  @memoizeOne
  buildHighlightedLabelData(
    highlightedSegments: $ReadOnlyArray<string>,
    labelData: $ReadOnlyArray<LabelData>,
  ): $ReadOnlyArray<LabelData> {
    const output = [];
    labelData.forEach(label => {
      if (!highlightedSegments.includes(label.key)) {
        return;
      }

      // Detect collisions between pie segment labels.
      if (
        output.length > 0 &&
        labelsCollide(output[output.length - 1].position, label.position)
      ) {
        return;
      }

      output.push(label);
    });

    return output;
  }

  // Calculate the scale transform that will allow the pie chart and its labels
  // to fit within the available space without overflowing the intended chart
  // container.
  // NOTE(stephen): Using a scale transform vs recomputing the pie dimensions
  // since it is the easiest thing to do. Recalculating the pie dimensions would
  // require new callbacks and state in the parent that would increase
  // complexity. Only do this if we find the scaling is not sufficient.
  @memoizeOne
  buildScale(
    outerRadius: number,
    labelData: $ReadOnlyArray<LabelData>,
  ): number {
    if (labelData.length === 0) {
      return 1;
    }

    // Calculate how much area the labels are taking up.
    const bounds = {
      bottom: outerRadius,
      left: -outerRadius,
      right: outerRadius,
      top: -outerRadius,
    };

    labelData.forEach(({ position }) => {
      // NOTE(stephen): Since the scaling will be applied equally to all sides
      // of the pie, we need to calculate the bounds in such a way that we
      // ensure the proper amount of space exists *after* scaling. This means
      // that we need to ensure the same amount of space exists on the vertical
      // and horizontal sides. Otherwise, we could end up cutting off the text.
      // Example: There are labels on the top of the pie but no labels on the
      // bottom. Without mirroring the position of the top labels onto the
      // bottom, we would end up with only half the space needed to show the
      // labels without them being cut off.
      bounds.bottom = Math.max(bounds.bottom, position.bottom, -position.top);
      bounds.left = Math.min(bounds.left, position.left, -position.right);
      bounds.right = Math.max(bounds.right, position.right, -position.left);
      bounds.top = Math.min(bounds.top, position.top, -position.bottom);
    });

    // Find the maximum space that the labels will take up if all of them are
    // displayed at the same time.
    // NOTE(stephen): Choosing to consider the case when *all* labels are shown
    // versus recalculating when just the highlighted segments change because
    // this would cause the pie chart to change size as the user changes the
    // highlighted segments. It is cleaner if the chart just changes size once.
    const size = Math.max(
      bounds.bottom - bounds.top,
      bounds.right - bounds.left,
    );

    if (size > outerRadius * 2) {
      return (outerRadius * 2) / size;
    }

    return 1;
  }

  getScale(): number {
    const { donut, highlightedSegments, path } = this.props;

    // If no labels are being shown, or if there is a single label being shown
    // but it is inside the donut, don't scale the viz.
    if (
      highlightedSegments.length === 0 ||
      (highlightedSegments.length === 1 && donut)
    ) {
      return 1;
    }
    return this.buildScale(path.outerRadius()(), this.getSegmentLabelData());
  }

  maybeRenderLabels():
    | React.Element<'text'>
    | $ReadOnlyArray<React.Element<'text'>>
    | null {
    const { donut, highlightedSegments, theme } = this.props;
    const { labelFontColor, labelFontFamily, labelFontSize } = theme;
    if (highlightedSegments.length === 0) {
      return null;
    }

    const highlightedLabelData = this.buildHighlightedLabelData(
      highlightedSegments,
      this.getSegmentLabelData(),
    );

    // If only one segment is highlighted and this is a donut chart, render the
    // segment label in the center of the donut instead of on the outside.
    if (
      highlightedSegments.length === 1 &&
      highlightedLabelData.length === 1 &&
      donut
    ) {
      return this.renderSingleDonutLabel(highlightedLabelData[0].displayValue);
    }

    // Align the labels so that the bottom of the text box is lined up with the
    // bottom of the label position.
    return highlightedLabelData.map(({ key, displayValue, position }) => (
      <text
        dominantBaseline="ideographic"
        fill={labelFontColor}
        fontFamily={labelFontFamily}
        fontSize={labelFontSize}
        key={key}
        textAnchor="start"
        x={position.left}
        y={position.bottom}
      >
        {displayValue}
      </text>
    ));
  }

  // Render the value label in the center of a donut chart.
  renderSingleDonutLabel(label: string): React.Element<'text'> {
    // Dynamically set the font size based on the amount of space
    // available inside the donut.
    // Approximation of how much the font needs to shrink based on the value.
    // For longer labels, this approximation doesn't work that well.
    const fontOffset = Math.max((label.length - 2) * 12, 12);
    const fontSize = Math.max(this.props.path.innerRadius()() - fontOffset, 15);
    return (
      <text dominantBaseline="middle" fontSize={fontSize} textAnchor="middle">
        {label}
      </text>
    );
  }

  renderPieSegments(): React.Node {
    const { arcs, highlightedSegments, path, theme } = this.props;
    const hashighlightedSegments = highlightedSegments.length > 0;
    const arcPaths = arcs.map(arc => {
      const isHighlighted = highlightedSegments.includes(arc.data.key);
      const opacity = !hashighlightedSegments || isHighlighted ? 1 : 0.25;
      const stroke =
        hashighlightedSegments && isHighlighted
          ? theme.highlightedSegmentStroke
          : undefined;

      // TODO(stephen): On segment hover, maybe show value, percent,
      return (
        <g key={arc.data.key}>
          <path
            d={path(arc)}
            fill={arc.data.color}
            opacity={opacity}
            stroke={stroke}
          />
        </g>
      );
    });

    return (
      <React.Fragment>
        {arcPaths}
        {this.maybeRenderLabels()}
      </React.Fragment>
    );
  }

  render(): React.Element<'g'> {
    const scale = this.getScale();
    const transform = scale !== 1 ? `scale(${scale})` : undefined;
    return (
      <g className="ui-pie-chart-pie" transform={transform}>
        {this.renderPieSegments()}
      </g>
    );
  }
}
