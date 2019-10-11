// @flow
import * as React from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import { Group } from '@vx/group';

import autobind from 'decorators/autobind';
import { noop } from 'util/util';
import type { Margin } from 'components/ui/visualizations/types';

type AxisMargins = {
  axisBottom: Margin,
  axisLeft: Margin,
  axisRight: Margin,
  axisTop: Margin,
};

type ChartElements = {
  axisBottom: ?Element,
  axisLeft: ?Element,
  axisRight: ?Element,
  axisTop: ?Element,
  chart: ?Element,
  container: ?Element,
};

type GroupElement = React.Element<'g' | typeof Group>;

// The element type React will send when setting a ref.
type GroupRefElement = React.ElementRef<'g'> | null;
type SVGRefElement = React.ElementRef<'svg'> | null;

type InnerRefCallback = (
  (innerRef: React.ElementRef<any> | null) => void,
) => React.Element<any> | null;
type AxisProp = React.Element<any> | null | InnerRefCallback;

type Props = {
  axisBottom: AxisProp,
  axisLeft: AxisProp,
  axisMargins: AxisMargins,
  axisRight: AxisProp,
  axisTop: AxisProp,
  chart: GroupElement,
  className: string,
  disableResize: boolean,
  height: number,
  onChartResize: (height: number, width: number) => void,
  padding: {
    bottom: number,
    left: number,
    right: number,
    top: number,
  },
  width: number,
};

type State = {
  axisBottomHeight: number,
  axisLeftWidth: number,
  axisRightWidth: number,
  axisTopHeight: number,
  chartHeight: number,
  chartWidth: number,
};

const DEFAULT_MARGIN = { bottom: 0, left: 0, right: 0, top: 0 };

export default class ResponsiveContainer extends React.PureComponent<
  Props,
  State,
> {
  static defaultProps = {
    axisBottom: null,
    axisLeft: null,
    axisMargins: {
      axisBottom: DEFAULT_MARGIN,
      axisLeft: DEFAULT_MARGIN,
      axisRight: DEFAULT_MARGIN,
      axisTop: DEFAULT_MARGIN,
    },
    axisRight: null,
    axisTop: null,
    className: '',
    disableResize: false,
    onChartResize: noop,
    padding: {
      bottom: 10,
      left: 0,
      right: 0,
      top: 10,
    },
  };

  state = {
    axisBottomHeight: 0,
    axisLeftWidth: 0,
    axisRightWidth: 0,
    axisTopHeight: 0,
    chartHeight: 0,
    chartWidth: 0,
  };

  chartElements: ChartElements = {
    axisBottom: undefined,
    axisLeft: undefined,
    axisRight: undefined,
    axisTop: undefined,
    chart: undefined,
    container: undefined,
  };

  onRefChangeCallback = {
    bottom: (elt: GroupRefElement) => this.onRefChange(elt, 'axisBottom'),
    chart: (elt: GroupRefElement) => this.onRefChange(elt, 'chart'),
    container: (elt: SVGRefElement) => this.onRefChange(elt, 'container'),
    left: (elt: GroupRefElement) => this.onRefChange(elt, 'axisLeft'),
    right: (elt: GroupRefElement) => this.onRefChange(elt, 'axisRight'),
    top: (elt: GroupRefElement) => this.onRefChange(elt, 'axisTop'),
  };

  // $FlowFixMe
  observer: ResizeObserver = new ResizeObserver(this.onResize);
  animationFrameID = undefined;

  componentDidUpdate(prevProps: Props, prevState: State) {
    // If the container
    const { chartHeight, chartWidth } = this.state;
    const { disableResize } = this.props;

    const sizeChanged =
      chartHeight !== prevState.chartHeight ||
      chartWidth !== prevState.chartWidth;

    // If resizing is enabled and the size changed, trigger the callback. Also,
    // the props just switched from disabling resize to allowing resize, trigger
    // the callback. This is needed since the dimension changes are still being
    // tracked even if the onChartResize callback is disabled.
    if (!disableResize && (sizeChanged || prevProps.disableResize)) {
      this.props.onChartResize(chartHeight, chartWidth);
    }
  }

  componentWillUnmount() {
    window.cancelAnimationFrame(this.animationFrameID);
    if (this.observer !== undefined) {
      this.observer.disconnect();
    }
  }

  @autobind
  onResize(entries: $ReadOnlyArray<ResizeObserverEntry> = []) {
    const {
      axisBottom,
      axisLeft,
      axisRight,
      axisTop,
      chart,
    } = this.chartElements;
    const {
      axisMargins,
      padding,
      height: containerHeight,
      width: containerWidth,
    } = this.props;

    this.animationFrameID = window.requestAnimationFrame(() => {
      this.setState(prevState => {
        const newState = { ...prevState };
        entries.forEach(({ contentRect, target }) => {
          const { height, width } = contentRect;
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
          } else if (target === chart) {
            newState.chartHeight = height;
            newState.chartWidth = width;
          }
        });

        // Resize chart height/width to ensure everything fits perfectly within
        // the container bounds.
        newState.chartHeight =
          containerHeight -
          newState.axisBottomHeight -
          newState.axisTopHeight -
          padding.top -
          padding.bottom;
        newState.chartWidth =
          containerWidth -
          newState.axisLeftWidth -
          newState.axisRightWidth -
          padding.left -
          padding.right;
        Object.keys(newState).forEach(key => {
          if (newState[key] < 0) {
            newState[key] = 0;
          }
        });
        return newState;
      });
    });
  }

  @autobind
  onRefChange(
    newElement: GroupRefElement | SVGRefElement,
    type: $Keys<ChartElements>,
  ) {
    const currentElement = this.chartElements[type];
    if (newElement === currentElement) {
      return;
    }

    if (currentElement) {
      this.observer.unobserve(currentElement);
    }
    if (newElement) {
      this.observer.observe(newElement);
    }

    this.chartElements[type] = newElement;
  }

  maybeRenderAxisTop() {
    const { axisTop, axisMargins } = this.props;
    if (!axisTop) {
      return null;
    }

    const { left, top } = axisMargins.axisTop;
    return this.renderAxis(axisTop, left, top, 'top');
  }

  maybeRenderAxisBottom() {
    const { axisBottom, axisMargins } = this.props;
    if (!axisBottom) {
      return null;
    }

    const { axisLeftWidth, axisTopHeight, chartHeight } = this.state;
    const left = axisLeftWidth + axisMargins.axisBottom.left;
    const top = axisTopHeight + chartHeight + axisMargins.axisBottom.top;
    return this.renderAxis(axisBottom, left, top, 'bottom');
  }

  maybeRenderAxisLeft() {
    const { axisLeft, axisMargins } = this.props;
    if (!axisLeft) {
      return null;
    }

    const { axisLeftWidth, axisTopHeight } = this.state;
    const left = axisMargins.axisLeft.left + axisLeftWidth;
    const top = axisMargins.axisLeft.top + axisTopHeight;
    return this.renderAxis(axisLeft, left, top, 'left');
  }

  maybeRenderAxisRight() {
    const { axisRight, axisMargins } = this.props;
    if (!axisRight) {
      return null;
    }

    const { axisLeftWidth, axisTopHeight, chartWidth } = this.state;
    const left = axisLeftWidth + chartWidth + axisMargins.axisRight.left;
    const top = axisTopHeight + axisMargins.axisRight.top;
    return this.renderAxis(axisRight, left, top, 'right');
  }

  renderAxis(
    axisProp: AxisProp,
    left: number,
    top: number,
    direction: 'bottom' | 'left' | 'right' | 'top',
  ) {
    let child;
    let ref = this.onRefChangeCallback[direction];
    if (typeof axisProp === 'function') {
      child = axisProp(ref);
      ref = undefined;
    } else {
      child = (axisProp: React.Element<any> | null);
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

  renderChart() {
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

  render() {
    const {
      axisBottom,
      axisLeft,
      axisMargins,
      axisRight,
      axisTop,
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

    // NOTE(stephen): Including a <rect> inside the SVG that fills the full
    // SVG container size so that the `ResizeObserver` watching the SVG properly
    // can detect when height/width of the container changes. `ResizeObserver`
    // watches the *bounding box* of the SVG, so if just the height/width props
    // change it might not trigger a resize.
    return (
      <svg
        className={svgClassName}
        height={height}
        ref={this.onRefChangeCallback.container}
        width={width}
        {...passThroughProps}
      >
        <rect height={height} width={width} fill="transparent" />
        <g transform={`translate(${padding.left}, ${padding.top})`}>
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
