// @flow
/* eslint-disable react/no-unused-state */
import * as React from 'react';
import classNames from 'classnames';

import type { StyleObject } from 'types/jsCore';

const AUTO = 'auto';

type LifecycleMap = {
  BASE: 'BASE',
  CALCULATE_END_HEIGHT: 'CALCULATE_END_HEIGHT',
  CALCULATE_START_HEIGHT: 'CALCULATE_START_HEIGHT',
  SET_START_HEIGHT: 'SET_START_HEIGHT',
};

type Lifecycle = $Keys<LifecycleMap>;

const LIFECYCLES: LifecycleMap = {
  BASE: 'BASE',
  CALCULATE_END_HEIGHT: 'CALCULATE_END_HEIGHT',
  CALCULATE_START_HEIGHT: 'CALCULATE_START_HEIGHT',
  SET_START_HEIGHT: 'SET_START_HEIGHT',
};

type Height = number | 'auto';

type DefaultProps = {
  className: string,
  duration: number,

  /** The height we want to change to. Either an exact number or 'auto' */
  height: Height,

  /**
   * Additional style to add to the AnimateHeight wrapper. Beware that if you
   * add `height`, `transition`, or `overflow` styles you may override important
   * behavior in this component and make the animation stop working.
   */
  style?: StyleObject,
};

type Props = {
  ...DefaultProps,
  children: React.Node,
};

type State = {
  // this is the children Node that will be set in the DOM element
  // in the render() function
  childrenToSet: React.Node,

  // the *calculated* end height of the DOM element (cannot be 'auto')
  endHeight?: number,

  // this is the height that will be set on the DOM element
  // in the render() function
  heightToSet: Height, // height to set on the actual DOM element

  lifecycle: Lifecycle,

  // the previous 'height' the user passed to props (used to determine what
  // type of height transition we're doing:
  //   number -> number, auto -> number, number -> auto, or auto -> auto
  prevRequestedHeight: Height,

  // the *calculated* start height of the DOM element (cannot be 'auto')
  startHeight?: number,

  // we need to keep track of a timeout if the user requested height: 'auto',
  // because we need to wait for the animation to end before we can actually
  // set the height to 'auto' otherwise the animation will snap.
  timeoutId?: TimeoutID,
};

/**
 * AnimateHeight is a wrapper component used to smoothly animate any changes
 * in height for the wrapped component. You can either specify a specific
 * height to set, or set height to 'auto' (the default) to have the height
 * calculated for you.
 *
 * Internally, the component behaves as a state machine depending on the height
 * transition we're doing. There are 4 ways height can change:
 *   number height -> number height
 *   number height -> auto
 *   auto -> number height
 *   auto -> auto
 *
 * Whenever we have an 'auto' (i.e. in 3 out of the 4 possibilities), we will
 * need some intermediate stages where the DOM's real pixel height is
 * calculated.
 */
export default class AnimateHeight extends React.PureComponent<Props, State> {
  static defaultProps: DefaultProps = {
    className: '',
    duration: 300,
    height: AUTO,
    style: undefined,
  };

  static getDerivedStateFromProps(props: Props, state: State): State | null {
    if (state.lifecycle === LIFECYCLES.BASE) {
      const oldHeight = state.prevRequestedHeight;
      const newHeight = props.height;
      const newChildren = props.children;

      let nextLifecycle: Lifecycle = state.lifecycle;
      let { childrenToSet, endHeight, heightToSet, startHeight } = state;
      const { timeoutId } = state;

      if (typeof oldHeight === 'number' && typeof newHeight === 'number') {
        if (newHeight === oldHeight) {
          // nothing changed
          return null;
        }

        // if we are changing the height from a number to a different number
        nextLifecycle = LIFECYCLES.BASE;
        heightToSet = newHeight;
        childrenToSet = newChildren;
        startHeight = oldHeight;
        endHeight = newHeight;
      } else if (typeof oldHeight === 'number' && newHeight === 'auto') {
        // we are changing from a number to 'auto'
        nextLifecycle = LIFECYCLES.CALCULATE_END_HEIGHT;
        heightToSet = 'auto';
        childrenToSet = newChildren;
        startHeight = oldHeight;
        endHeight = undefined;
      } else if (oldHeight === 'auto' && typeof newHeight === 'number') {
        // we are changing from 'auto' to a number
        nextLifecycle = LIFECYCLES.CALCULATE_START_HEIGHT;
        startHeight = undefined;
        endHeight = newHeight;
      } else if (oldHeight === 'auto' && newHeight === 'auto') {
        if (props.children === state.childrenToSet) {
          // nothing changed
          return null;
        }

        // children changed, so we need to recalculate heights
        nextLifecycle = LIFECYCLES.CALCULATE_START_HEIGHT;
        startHeight = undefined;
        startHeight = undefined;
      }

      // if props were changed mid-animation, we need to cancel the previous
      // timeout
      clearTimeout(timeoutId);
      return {
        childrenToSet,
        endHeight,
        heightToSet,
        startHeight,
        lifecycle: nextLifecycle,
        prevRequestedHeight: newHeight,
        timeoutId: undefined,
      };
    }

    return null;
  }

  _containerElt: $ElementRefObject<'div'> = React.createRef();

  constructor(props: Props) {
    super(props);
    this.state = {
      childrenToSet: props.children,
      heightToSet: props.height,
      lifecycle: LIFECYCLES.BASE,
      prevRequestedHeight: props.height,
      timeoutId: undefined,
    };
  }

  componentDidMount() {
    this.recomputeHeight();
  }

  componentDidUpdate() {
    this.recomputeHeight();
  }

  getStyle(): StyleObject {
    const { heightToSet } = this.state;
    const { duration, style } = this.props;
    const baseStyle = {
      height: heightToSet,

      // Only set an overflow value if we do not have an exact height set. This
      // prevents child stacking contexts from being clipped inside the
      // AnimateHeight container all the time.
      overflow: heightToSet === 'auto' ? undefined : 'hidden',

      transition: `height ${duration}ms`,
    };
    return style ? { ...baseStyle, ...style } : baseStyle;
  }

  recomputeHeight() {
    switch (this.state.lifecycle) {
      case LIFECYCLES.CALCULATE_START_HEIGHT: {
        if (this._containerElt.current) {
          const calculatedHeight = this._containerElt.current.offsetHeight;
          this.setState({
            heightToSet: calculatedHeight,
            lifecycle: LIFECYCLES.SET_START_HEIGHT,
            startHeight: calculatedHeight,
          });
          break;
        }
        throw new Error(
          '[AnimateHeight] trying to transition to SET_START_HEIGHT without a calculated height',
        );
      }
      case LIFECYCLES.CALCULATE_END_HEIGHT: {
        if (this._containerElt.current) {
          const calculatedHeight = this._containerElt.current.offsetHeight;
          const { startHeight } = this.state;

          // If the height has not changed, shortcut and avoid running an
          // animation.
          if (calculatedHeight === startHeight) {
            const heightToSet =
              this.props.height === 'auto' ? 'auto' : calculatedHeight;
            this.setState({
              heightToSet,
              childrenToSet: this.props.children,
              endHeight: undefined,
              lifecycle: LIFECYCLES.BASE,
              startHeight: undefined,
            });
          } else {
            this.setState(state => ({
              endHeight: calculatedHeight,
              heightToSet: state.startHeight,
              lifecycle: LIFECYCLES.SET_START_HEIGHT,
            }));
          }
          break;
        }
        throw new Error(
          '[AnimateHeight] trying to transition to SET_START_HEIGHT without a calculated height',
        );
      }
      case LIFECYCLES.SET_START_HEIGHT: {
        const { endHeight } = this.state;
        if (endHeight !== undefined) {
          // NOTE: using requestAnimationFrame to ensure a smooth
          // animation when we go from 'auto' height to a specific height.
          // https://stanko.github.io/react-rerender-in-component-did-mount/
          window.requestAnimationFrame(() => {
            let timeoutId;
            if (this.props.height === 'auto') {
              // if the requested height was 'auto', then we need to make sure
              // the component has an 'auto' height at the end of the animation.
              // We need to use a timeout for this otherwise we'll cause the
              // animation to snap.
              timeoutId = setTimeout(() => {
                this.setState({
                  childrenToSet: this.props.children,
                  endHeight: undefined,
                  heightToSet: 'auto',
                  lifecycle: LIFECYCLES.BASE,
                  startHeight: undefined,
                });
              }, this.props.duration);
            }

            this.setState({
              timeoutId,
              childrenToSet: this.props.children,
              endHeight: undefined,
              heightToSet: endHeight,
              lifecycle: LIFECYCLES.BASE,
              startHeight: undefined,
            });
          });
        } else {
          // endHeight is still undefined, so we haven't calculated it yet
          this.setState({
            childrenToSet: this.props.children,
            heightToSet: 'auto',
            lifecycle: LIFECYCLES.CALCULATE_END_HEIGHT,
          });
        }
        break;
      }
      default:
        break;
    }
  }

  render(): React.Element<'div'> {
    const divClassName = classNames(
      'zen-slide-transition-container',
      this.props.className,
    );
    return (
      <div
        ref={this._containerElt}
        className={divClassName}
        style={this.getStyle()}
      >
        {this.state.childrenToSet}
      </div>
    );
  }
}
