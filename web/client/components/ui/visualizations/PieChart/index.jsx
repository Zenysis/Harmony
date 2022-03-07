// @flow
import * as React from 'react';
import { Pie as VXPieBuilderOriginal } from '@vx/shape';

import Pie from 'components/ui/visualizations/PieChart/internal/Pie';
import { DEFAULT_THEME } from 'components/ui/visualizations/PieChart/defaults';
import { autobind, memoizeOne } from 'decorators';
import type {
  DataPoint,
  PieChartTheme,
  PieData,
} from 'components/ui/visualizations/PieChart/types';

type DefaultProps = {
  /** The values for each segment of the pie. */
  dataPoints: $ReadOnlyArray<DataPoint>,

  /** Should the pie chart be shown as a donut chart. */
  donut: boolean,

  /**
   * The segments of the pie chart that should be highlighted. When this is
   * non-empty, the non-highlighted segments will be made opaque.
   */
  highlightedSegments: $ReadOnlyArray<string>,

  /**
   * Triggered when the pie is clicked on. If the handler is `undefined`, then
   * the pie is not clickable and a default cursor will be used when the user
   * hovers over it.
   */
  onClick: (() => void) | void,

  /** The visual style for the PieChart. */
  theme: PieChartTheme,

  /** The title to display for this chart. */
  title: string,
};

type Props = {
  ...DefaultProps,

  height: number,
  width: number,

  ...
};

type State = {
  hovering: boolean,
};

// This is the VX component that builds the pie chart arc and path data. It
// forwards this data on to the child function.
const VXPieBuilder = React.memo<$FlowTODO>(VXPieBuilderOriginal);

// How much space the title should have from the bottom of the Pie chart.
// NOTE(stephen): Be careful adjusting this value. Make sure that it does not
// inadvertently cause a collision between the title and a highlighted segment
// label.
const TITLE_OFFSET = 10;

const getValue = ({ value }: DataPoint) => value || 0;

export default class PieChart extends React.PureComponent<Props, State> {
  static defaultProps: DefaultProps = {
    dataPoints: [],
    donut: false,
    highlightedSegments: [],
    onClick: undefined,
    theme: DEFAULT_THEME,
    title: '',
  };

  state: State = {
    hovering: false,
  };

  // Ensure the order that pie arcs are drawn within the VX Pie match the order
  // provided by the user.
  @autobind
  sortPieArcs(a: DataPoint, b: DataPoint): number {
    const { dataPoints } = this.props;
    return dataPoints.indexOf(a) - dataPoints.indexOf(b);
  }

  @memoizeOne
  buildPieParameters(
    donut: boolean,
    height: number,
    width: number,
    hovering: boolean,
  ): {
    innerRadius: number,
    outerRadius: number,
    padAngle: number,
  } {
    // Choose an outer radius that will fit within the height/width bounds of
    // the chart.
    // NOTE(stephen): Ensure the radius is never negative.
    const outerRadius = Math.max(Math.min(width, height) / 2, 1);

    // When hovering, add space between each pie segment.
    const padAngle = hovering ? 0.04 : 0;

    // Donut chart styling.
    if (donut) {
      return {
        innerRadius: (outerRadius * 2) / 3,
        outerRadius,
        padAngle,
      };
    }

    // Standard pie chart with hover effects.
    if (hovering) {
      return {
        innerRadius: outerRadius * 0.015,
        outerRadius,
        padAngle,
      };
    }

    // Standard pie chart with no hover effects.
    return {
      innerRadius: 0,
      outerRadius,
      padAngle,
    };
  }

  getPieParameters(): {
    innerRadius: number,
    outerRadius: number,
    padAngle: number,
  } {
    const { donut, width } = this.props;
    return this.buildPieParameters(
      donut,
      this.getAvailableHeight(),
      width,
      this.state.hovering,
    );
  }

  // Get the height the pie chart can potentially fill while ensuring there is
  // enough room for the title.
  getAvailableHeight(): number {
    const { height, theme, title } = this.props;
    if (title.length === 0) {
      return height;
    }

    return height - theme.titleFontSize * 1.2 - TITLE_OFFSET;
  }

  @autobind
  onHoverStart() {
    this.setState({ hovering: true });
  }

  @autobind
  onHoverEnd() {
    this.setState({ hovering: false });
  }

  maybeRenderTitle(y: number): React.Node {
    const { theme, title } = this.props;
    if (title.length === 0) {
      return null;
    }

    return (
      <text
        dominantBaseline="hanging"
        fill={theme.titleFontColor}
        fontFamily={theme.titleFontFamily}
        fontSize={theme.titleFontSize}
        fontWeight={this.state.hovering ? 'bold' : undefined}
        textAnchor="middle"
        y={y + TITLE_OFFSET - 1}
      >
        {title}
      </text>
    );
  }

  render(): React.Element<'svg'> {
    const {
      dataPoints,
      donut,
      height,
      highlightedSegments,
      onClick,
      theme,
      width,
    } = this.props;
    const pieParameters = this.getPieParameters();
    const top = this.getAvailableHeight() / 2;
    return (
      <svg height={height} width={width}>
        <g transform={`translate(${width / 2}, ${top})`}>
          <VXPieBuilder
            data={dataPoints}
            pieSort={this.sortPieArcs}
            pieValue={getValue}
            {...pieParameters}
          >
            {({ arcs, path }: PieData) => (
              <Pie
                arcs={arcs}
                donut={donut}
                highlightedSegments={highlightedSegments}
                path={path}
                theme={theme}
              />
            )}
          </VXPieBuilder>
          {this.maybeRenderTitle(pieParameters.outerRadius)}
          <circle
            cursor={onClick !== undefined ? 'pointer' : undefined}
            fill="transparent"
            onClick={onClick}
            onMouseMove={this.onHoverStart}
            onMouseLeave={this.onHoverEnd}
            r={pieParameters.outerRadius}
          />
        </g>
      </svg>
    );
  }
}
