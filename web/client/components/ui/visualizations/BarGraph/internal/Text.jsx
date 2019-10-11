// @flow
import * as React from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import { Text as BasicText } from '@vx/text';

import autobind from 'decorators/autobind';

type Props = {
  angle: number,
  backgroundStyle: {
    padding: {
      bottom: number,
      left: number,
      right: number,
      top: number,
    },
    +[string]: mixed,
  },
  children: string | number,
  dx: number,
  dy: number,
};

// Same as `getBBox()`.
type State = {
  height: number,
  width: number,
  x: number,
  y: number,
};

const TextOriginal = React.memo(BasicText);

/**
 * The Text component provides a wrapper around VX's SVG Text component and adds
 * support for background color.
 */
export default class Text extends React.PureComponent<Props, State> {
  static defaultProps = {
    angle: 0,
    backgroundStyle: {
      fill: 'transparent',
      padding: {
        bottom: 1,
        left: 5,
        right: 5,
        top: 1,
      },
    },
    dx: 0,
    dy: 0,
  };

  state: State = {
    height: 0,
    width: 0,
    x: 0,
    y: 0,
  };

  _textElt: ?SVGElement = null;
  animationFrameID = undefined;
  observer: ResizeObserver;

  componentWillUnmount() {
    window.cancelAnimationFrame(this.animationFrameID);
    if (this.observer !== undefined) {
      this.observer.disconnect();
    }
  }

  @autobind
  setTextEltRef(currentElt: SVGElement | null) {
    // Handle edge case if svg element is replaced in DOM with new reference.
    if (this.observer !== undefined) {
      this.observer.disconnect();
    }

    // NOTE(stephen): Storing argument in const variable so that flow
    // understands that it won't be reassigned.
    const elt = currentElt;
    if (elt === null) {
      return;
    }

    this.observer = new ResizeObserver(() => {
      this.animationFrameID = window.requestAnimationFrame(() => {
        // NOTE(stephen): Using the first element of the SVG node since we
        // want to capture the coordinates and sizing of the text element
        // *after* transforms (like rotate) have been applied.
        // $FlowIssue - Does not understand SVG elements.
        const { height, width, x, y } = elt.firstElementChild.getBBox();
        this.setState({ height, width, x, y });
      });
    });
    this.observer.observe(elt);
  }

  getBackgroundTransform() {
    const { angle, backgroundStyle } = this.props;
    const { transform } = backgroundStyle;
    if (angle === 0) {
      return transform;
    }

    const rotate = `rotate(${angle},0,0)`;
    if (typeof transform === 'string') {
      return `${rotate} ${transform}`;
    }
    return rotate;
  }

  maybeRenderBackground() {
    const { height, width, x, y } = this.state;
    if (height === 0 || width === 0) {
      return null;
    }

    const { padding, ...passThroughProps } = this.props.backgroundStyle;
    const { bottom, left, right, top } = padding;
    return (
      <rect
        {...passThroughProps}
        height={height + bottom + top}
        transform={this.getBackgroundTransform()}
        width={width + left + right}
        x={x - left}
        y={y - top}
      />
    );
  }

  render() {
    // TODO(stephen): Make this more flexible.
    const {
      backgroundStyle,
      children,
      dx,
      dy,
      ...passThroughProps
    } = this.props;

    // NOTE(stephen): The dx/dy values are for centering the text within the
    // label. There is probably a way to calculate this.
    return (
      <g className="ui-svg-text" transform={`translate(${dx}, ${dy})`}>
        {this.maybeRenderBackground()}
        <TextOriginal innerRef={this.setTextEltRef} {...passThroughProps}>
          {children}
        </TextOriginal>
      </g>
    );
  }
}
