// @flow
import * as React from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import { Group as VXGroup } from '@vx/group';

import ResizeObserverCompensationService from 'components/ui/visualizations/common/ResponsiveContainer/internal/ResizeObserverCompensationService';
import normalizeARIAName from 'components/ui/util/normalizeARIAName';
import { autobind, memoizeOne } from 'decorators';
import { noop } from 'util/util';
import type { Margin } from 'components/ui/visualizations/types';

type AxisMargins = {
  axisBottom: Margin,
  axisLeft: Margin,
  axisRight: Margin,
  axisTop: Margin,
};

// All properties and individual margin properties are optional, so a user
// does not need to specify the full margin when providing the prop. All missing
// values will receive an empty margin of 0.
type OptionalAxisMargins = $Shape<{
  axisBottom: $Shape<Margin>,
  axisLeft: $Shape<Margin>,
  axisRight: $Shape<Margin>,
  axisTop: $Shape<Margin>,
}>;

type ChartElements = {
  axisBottom: ?Element,
  axisLeft: ?Element,
  axisRight: ?Element,
  axisTop: ?Element,
  chart: ?Element,
  container: ?Element,
};

type GroupElement = React.Element<'g' | typeof VXGroup>;

// The element type React will send when setting a ref.
type GroupRefElement = React.ElementRef<'g'> | null;
type SVGRefElement = React.ElementRef<'svg'> | null;

// We use an InnerRefCallback when we need to take the size of an inner
// component as the space to allocate for an axis. An example usage is with the
// metric axis where we want to exclude goal lines from the axis size
// measurements.
type InnerRefCallback = (
  (innerRef: React.ElementRef<$AllowAny> | null) => void,
) => React.MixedElement | null;
type AxisProp = React.MixedElement | null | InnerRefCallback;

type DefaultProps = {
  /** The accessibility name for this container. */
  ariaName?: string,
  axisBottom: AxisProp,
  axisLeft: AxisProp,
  axisMargins: OptionalAxisMargins,
  axisRight: AxisProp,
  axisTop: AxisProp,

  // TODO(stephen): These should be `rect` props.
  backgroundProps: {
    +fill?: string,
    +rx?: number,
    +ry?: number,
  },
  className: string,
  disableResize: boolean,
  onChartResize: (height: number, width: number) => void,
  padding: $Shape<Margin>,
};

type Props = {
  ...DefaultProps,

  chart: GroupElement,
  height: number,
  width: number,
  ...
};

type State = {
  axisBottomHeight: number,
  axisLeftWidth: number,
  axisRightWidth: number,
  axisTopHeight: number,

  // Store the chart height twice. The first values (chartHeight, chartWidth)
  // are the values that should be used during rendering. This might not be the
  // actual size that the chart *could* render with but it is the value we want
  // the chart to render with. The second values (trueChartHeight,
  // trueChartWidth) always will store the correct chart size as calculated by
  // the differences in axis sizing and the container sizing. This value is
  // always kept in sync. We store these values separately so that when the user
  // has disabled resizing (through the `disableResize` prop), we can preserve
  // the axes positioning that existed right when `disableResize` was enabled.
  chartHeight: number,
  chartWidth: number,
  trueChartHeight: number,
  trueChartWidth: number,
};

// Create a slimmed down ResizeObserverEntry so that we can handle size changes
// that are triggered both by ResizeObserver and manually by ourselves.
type ElementSizeEntry = {
  target: Element,
  contentRect: { +height: number, +width: number, ... },
  ...
};

const EMPTY_MARGIN = { bottom: 0, left: 0, right: 0, top: 0 };
const DEFAULT_PADDING = { bottom: 10, left: 0, right: 0, top: 10 };

/**
 * A component that handles spacing for a chart. It requires axis, inner
 * chart components and the outer dimensions of the chart to be passed to it and
 * it provides the spacing and the size of the inner chart area (the area
 * bordered by the axes) through the onChartResize callback prop.
 *
 * By default, we measure an axis' dimensions by adding a ref to it. If we need
 * to instead use an inner component's dimensions as the space to allocate to an
 * axis then we should provide the axis prop as an InnerRefCallback.
 */
export default class ResponsiveContainer extends React.PureComponent<
  Props,
  State,
> {
  static defaultProps: DefaultProps = {
    ariaName: undefined,
    axisBottom: null,
    axisLeft: null,
    axisMargins: {},
    axisRight: null,
    axisTop: null,
    backgroundProps: {
      fill: 'transparent',
    },
    className: '',
    disableResize: false,
    onChartResize: noop,
    padding: DEFAULT_PADDING,
  };

  state: State = {
    axisBottomHeight: 0,
    axisLeftWidth: 0,
    axisRightWidth: 0,
    axisTopHeight: 0,
    chartHeight: 0,
    chartWidth: 0,
    trueChartHeight: 0,
    trueChartWidth: 0,
  };

  chartElements: ChartElements = {
    axisBottom: undefined,
    axisLeft: undefined,
    axisRight: undefined,
    axisTop: undefined,
    chart: undefined,
    container: undefined,
  };

  onRefChangeCallback: { [string]: (GroupRefElement) => void } = {
    bottom: (elt: GroupRefElement) => this.onRefChange(elt, 'axisBottom'),
    chart: (elt: GroupRefElement) => this.onRefChange(elt, 'chart'),
    container: (elt: SVGRefElement) => this.onRefChange(elt, 'container'),
    left: (elt: GroupRefElement) => this.onRefChange(elt, 'axisLeft'),
    right: (elt: GroupRefElement) => this.onRefChange(elt, 'axisRight'),
    top: (elt: GroupRefElement) => this.onRefChange(elt, 'axisTop'),
  };

  observer: ResizeObserver | void = new ResizeObserver(
    // $FlowFixMe[incompatible-variance]
    entries => this.processSizeChanges(entries),
  );

  // Track all animation frame IDs that are currently in-progress. Sometimes,
  // multiple calls will be made to `requestAnimationFrame`, so we need to track
  // all the IDs that have not been completed in case we need to clean them up
  // when the component unmounts.
  animationFrameIDs: Set<number> = new Set();

  componentDidUpdate(prevProps: Props, prevState: State) {
    // If resizing is disabled, we don't need to synchronize the chart size
    // to the parent.
    const { disableResize, onChartResize } = this.props;
    if (disableResize) {
      return;
    }

    // If we just transitioned to allow resizing, ensure that the chart height
    // and width match the true height and width. If they are different, update
    // state so the values are in sync.
    const {
      chartHeight,
      chartWidth,
      trueChartHeight,
      trueChartWidth,
    } = this.state;
    if (
      prevProps.disableResize &&
      (chartHeight !== trueChartHeight || chartWidth !== trueChartWidth)
    ) {
      this.setState({
        chartHeight: trueChartHeight,
        chartWidth: trueChartWidth,
      });
      return;
    }

    // If the chart size has changed, we need to let the parent know.
    if (
      chartHeight !== prevState.chartHeight ||
      chartWidth !== prevState.chartWidth
    ) {
      onChartResize(chartHeight, chartWidth);
    }
  }

  componentWillUnmount() {
    if (this.observer !== undefined) {
      this.observer.disconnect();
      this.observer = undefined;
    }
    this.animationFrameIDs.forEach(id => window.cancelAnimationFrame(id));
  }

  // Convert the OptionalAxisMargins input, where not all properties need to be
  // defined, into a full AxisMargins object with all properties valid.
  @memoizeOne
  buildFullAxisMargins(axisMargins: OptionalAxisMargins): AxisMargins {
    const { axisBottom, axisLeft, axisRight, axisTop } = axisMargins;
    return {
      axisBottom: { ...EMPTY_MARGIN, ...axisBottom },
      axisLeft: { ...EMPTY_MARGIN, ...axisLeft },
      axisRight: { ...EMPTY_MARGIN, ...axisRight },
      axisTop: { ...EMPTY_MARGIN, ...axisTop },
    };
  }

  getFullAxisMargins(): AxisMargins {
    return this.buildFullAxisMargins(this.props.axisMargins);
  }

  @memoizeOne
  buildFullPadding(padding: $Shape<Margin>): Margin {
    return {
      ...DEFAULT_PADDING,
      ...padding,
    };
  }

  getFullPadding(): Margin {
    return this.buildFullPadding(this.props.padding);
  }

  processSizeChanges(entries: $ReadOnlyArray<ElementSizeEntry>) {
    const { axisBottom, axisLeft, axisRight, axisTop } = this.chartElements;

    const animationFrameID = window.requestAnimationFrame(() => {
      this.animationFrameIDs.delete(animationFrameID);

      this.setState((prevState, prevProps) => {
        const newState = { ...prevState };
        const {
          disableResize,
          height: containerHeight,
          width: containerWidth,
        } = prevProps;
        const axisMargins = this.getFullAxisMargins();
        const padding = this.getFullPadding();
        entries.forEach(({ contentRect, target }) => {
          const scale = ResizeObserverCompensationService.getSVGSizeScale();
          const height = contentRect.height * scale;
          const width = contentRect.width * scale;
          if (target === axisBottom) {
            const { bottom, top } = axisMargins.axisBottom;
            newState.axisBottomHeight = height + bottom + top;
          } else if (target === axisLeft) {
            const { left, right } = axisMargins.axisLeft;
            newState.axisLeftWidth = width + left + right;
          } else if (target === axisRight) {
            const { left, right } = axisMargins.axisRight;
            newState.axisRightWidth = width + left + right;
          } else if (target === axisTop) {
            const { bottom, top } = axisMargins.axisTop;
            newState.axisTopHeight = height + bottom + top;
          }
        });

        // Resize chart height/width to ensure everything fits perfectly within
        // the container bounds.
        newState.trueChartHeight =
          containerHeight -
          newState.axisBottomHeight -
          newState.axisTopHeight -
          padding.top -
          padding.bottom;
        newState.trueChartWidth =
          containerWidth -
          newState.axisLeftWidth -
          newState.axisRightWidth -
          padding.left -
          padding.right;

        // If resizing is enabled, we can synchronize the true chart size with
        // the chart size we want to render.
        if (!disableResize) {
          newState.chartHeight = newState.trueChartHeight;
          newState.chartWidth = newState.trueChartWidth;
        }

        // Ensure the minimum height/width is always 0.
        // NOTE(stephen): Adding our own test for if the state has changed so
        // that we can return `undefined` if it has not. This has shown to be a
        // decent performance boost when the ResponsiveContainer receives many
        // resize events in a row. By returning `undefined` we are telling React
        // that the state hasn't changed. While React will do that for us
        // eventually, by comparing all the state properties to the previous
        // version, that check happens many layers down.
        const stateChanged =
          Object.keys(newState).filter(key => {
            if (newState[key] < 0) {
              newState[key] = 0;
            }
            return newState[key] !== prevState[key];
          }).length > 0;

        return stateChanged ? newState : undefined;
      });
    });
    this.animationFrameIDs.add(animationFrameID);
  }

  @autobind
  onRefChange(
    newElement: GroupRefElement | SVGRefElement,
    type: $Keys<ChartElements>,
  ) {
    const currentElement = this.chartElements[type];

    // If the element reference has not changed, we do not need to update. If
    // the observer is undefined, this indicates the component is unmounted and
    // no size changes should be tracked anymore.
    if (newElement === currentElement || this.observer === undefined) {
      return;
    }

    if (currentElement) {
      this.observer.unobserve(currentElement);

      // If the element is only being removed and not replaced, we need to clear
      // the sizing of this element.
      if (!newElement) {
        this.processSizeChanges([
          {
            contentRect: { height: 0, width: 0 },
            target: currentElement,
          },
        ]);
      }
    }

    if (newElement) {
      this.observer.observe(newElement);
    }

    this.chartElements[type] = newElement;
  }

  maybeRenderAxisTop(): React.Node {
    const { axisTop } = this.props;
    if (!axisTop) {
      return null;
    }

    const { axisLeftWidth } = this.state;
    const axisMargins = this.getFullAxisMargins();
    const left = axisLeftWidth + axisMargins.axisTop.left;
    return this.renderAxis(axisTop, left, axisMargins.axisTop.top, 'top');
  }

  maybeRenderAxisBottom(): React.Node {
    const { axisBottom } = this.props;
    if (!axisBottom) {
      return null;
    }

    const { axisLeftWidth, axisTopHeight, chartHeight } = this.state;
    const axisMargins = this.getFullAxisMargins();
    const left = axisLeftWidth + axisMargins.axisBottom.left;
    const top = axisTopHeight + chartHeight + axisMargins.axisBottom.top;
    return this.renderAxis(axisBottom, left, top, 'bottom');
  }

  maybeRenderAxisLeft(): React.Node {
    const { axisLeft } = this.props;
    if (!axisLeft) {
      return null;
    }

    const { axisLeftWidth, axisTopHeight } = this.state;
    const axisMargins = this.getFullAxisMargins();
    const left = axisLeftWidth - axisMargins.axisLeft.right;
    const top = axisMargins.axisLeft.top + axisTopHeight;
    return this.renderAxis(axisLeft, left, top, 'left');
  }

  maybeRenderAxisRight(): React.Node {
    const { axisRight } = this.props;
    if (!axisRight) {
      return null;
    }

    const { axisLeftWidth, axisTopHeight, chartWidth } = this.state;
    const axisMargins = this.getFullAxisMargins();
    const left = axisLeftWidth + chartWidth + axisMargins.axisRight.left;
    const top = axisTopHeight + axisMargins.axisRight.top;
    return this.renderAxis(axisRight, left, top, 'right');
  }

  renderAxis(
    axisProp: AxisProp,
    left: number,
    top: number,
    direction: 'bottom' | 'left' | 'right' | 'top',
  ): React.Element<'g'> {
    let child;
    let ref = this.onRefChangeCallback[direction];
    if (typeof axisProp === 'function') {
      child = axisProp(ref);
      ref = undefined;
    } else {
      child = (axisProp: React.MixedElement | null);
    }

    return (
      <g
        className={`ui-responsive-container__axis-${direction}`}
        ref={ref}
        transform={`translate(${left}, ${top})`}
      >
        {child}
      </g>
    );
  }

  renderChart(): React.Element<'g'> {
    const { axisLeftWidth, axisTopHeight } = this.state;
    return (
      <g
        className="ui-responsive-container__chart"
        ref={this.onRefChangeCallback.chart}
        transform={`translate(${axisLeftWidth}, ${axisTopHeight})`}
      >
        {this.props.chart}
      </g>
    );
  }

  render(): React.Element<'svg'> {
    const {
      ariaName,
      axisBottom,
      axisLeft,
      axisMargins,
      axisRight,
      axisTop,
      backgroundProps,
      chart,
      className,
      disableResize,
      height,
      onChartResize,
      padding,
      width,
      ...passThroughProps
    } = this.props;

    const svgClassName = `ui-responsive-container ${className || ''}`;
    const fullPadding = this.getFullPadding();

    // NOTE(stephen): Including a <rect> inside the SVG that matches the full
    // desired SVG container size. We watch this rect with the `ResizeObserver`
    // since watching the SVG will not always trigger a resize. `ResizeObserver`
    // watches the *bounding box* of the SVG, so if just the height/width props
    // change it might not trigger a resize. The <rect> element does not have
    // this problem.
    return (
      <svg
        {...passThroughProps}
        aria-label={normalizeARIAName(ariaName)}
        role="figure"
        className={svgClassName}
        height={height}
        width={width}
      >
        <rect
          height={height}
          ref={this.onRefChangeCallback.container}
          width={width}
          {...backgroundProps}
        />
        <g transform={`translate(${fullPadding.left}, ${fullPadding.top})`}>
          {this.renderChart()}
          {this.maybeRenderAxisTop()}
          {this.maybeRenderAxisLeft()}
          {this.maybeRenderAxisBottom()}
          {this.maybeRenderAxisRight()}
        </g>
      </svg>
    );
  }
}
