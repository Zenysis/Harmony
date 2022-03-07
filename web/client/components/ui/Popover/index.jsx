// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';

import { PopoverContext } from 'components/ui/Popover/internal/PopoverContext';
import PopoverPortal from 'components/ui/Popover/internal/PopoverPortal';
import {
  BLUR_TYPES,
  ORIGINS,
  POPOVER_CONTAINERS,
} from 'components/ui/Popover/internal/constants';
import { noop } from 'util/util';
import type {
  BlurType,
  OptionalWindowEdgeThresholds,
  OriginPlacement,
  PopoverContainer,
} from 'components/ui/Popover/internal/types';

type DefaultProps = {
  /**
   * The origin coordinates of the anchor element. The popover will be attached
   * to this origin point. Can be specified using
   * `Popover.Origins.TOP_CENTER | TOP_LEFT | ...`.
   */
  anchorOrigin: OriginPlacement,

  /**
   * The outer spacing between the anchor element and the popover.
   * For example, if the anchor's origin is `bottom center` and the popover is
   * `top center`, this adds some spacing so that the origins are not touching.
   */
  anchorOuterSpacing: number,

  /** The accessibility name for this popover. */
  ariaName?: string,

  /**
   * Determine how blurring of the popover should be handled.
   *
   * - `Popover.BlurTypes.OVERLAY` This is the default. Blurring is handled
   *   when the user clicks on an invisible overlay outside of the Popover.
   *   This is the most robust against bugs. The only disadvantage is if any
   *   elements have a higher zIndex than your popover, then clicking on those
   *   elements will NOT trigger a blur. This blurType also prevents any other
   *   elements from being interactable until the Popover is closed.
   * - `Popover.BlurTypes.DOCUMENT` Blurring is handled when the user clicks
   *   ANYWHERE in the document that is outside of the popover. This can cause
   *   bugs if clicking an element inside your popover causes that clicked
   *   element to disappear. If this happens, then the popover will close,
   *   because since the element disappeared when it was clicked, then
   *   `event.target` is `null`, so the Popover thinks you clicked outside the
   *   Popover. Use this blurType only when you know this is not possible. The
   *   advantage of this blurType is that the rest of the document remains
   *   interactable. The popover will close at the same time as you interact
   *   with any outside element. With `OVERLAY`, you have to first close the
   *   popover before anything else becomes interactable.
   */
  blurType: BlurType,

  /** Additional class names to add to the popover */
  className: string,

  /**
   * The type of container to use for the popover.
   *
   * - `Popover.Containers.DEFAULT`: default container (has builtin padding
   *   to make it easy to start adding text)
   * - `Popover.Containers.EMPTY`: default container but without padding
   * - `Popover.Containers.NONE`: no container. This gives you more freedom as
   *   to how the popover looks, because the `div` that wrapps the `children`
   *   has been stripped of any styles that affect how the popover looks.
   */
  containerType: PopoverContainer,

  /**
   * By default the popover tries to stay in view as long as possible, so when
   * it is close to a window edge, it will flip either horizontally or
   * vertically. Sometimes this isn't ideal if the popover's dimensions can
   * change due to internal interactions, causing the popover to flip while
   * it is being used. Set this flag to `true` if you want to disable the
   * flipping mechanic.
   */
  doNotFlip: boolean,

  /**
   * An offset to add to the popover's x position when the popover's horizontal
   * origin is automatically flipped in order to fit in the window.
   */
  flippedOffsetX: number,

  /**
   * An offset to add to the popover's y position when the popover's vertical
   * origin is automatically flipped in order to fit in the window.
   */
  flippedOffsetY: number,

  /**
   * Keep the popover in-screen at all times, even if we scroll away. Never
   * let it go off-screen. This is useful for pages that are not scrollable,
   * so you don't want the popover to **ever** render vertically off-screen.
   */
  keepInWindow: boolean,

  /**
   * Sometimes changes in external nodes can cause the anchor's position to
   * shift, but for performance reasons we do not listen for all changes to the
   * document. Use this prop to specify nodes we should observe for changes,
   * in case they change the anchor's position, so we can move the popover.
   *
   * Acceptable types are DOM id strings or HTMLElements.
   */
  nodesToObserve:
    | string
    | HTMLElement
    | $ReadOnlyArray<string | HTMLElement>
    | void
    | null,

  /** An offset to add to the popover's x position */
  offsetX: number,

  /** An offset to add to the popover's y position */
  offsetY: number,

  /**
   * A callback for when the popover is opened, positioned, and ready to be
   * interacted with. Even though this is a controlled component, the popover
   * is not *immediately* ready to be interacted with, because it takes a few
   * browser repaints for all calculations to be done. So if you need to do
   * any DOM interactions on the Popover's children (e.g. focusing an InputText
   * in the popover), it should happen in this callback.
   */
  onPopoverOpened?: () => void,

  /**
   * Event handler for when the popover needs to close. This is called when the
   * user clicks somewhere outside the popover.
   */
  onRequestClose: (SyntheticMouseEvent<HTMLElement> | Event) => void,

  /**
   * The popover's parent element in which it will render. It can be either the
   * element itself or an element id. If none is specified, the popover will
   * render inside `document.body`.
   *
   * If you need to provide a parentElt for many popovers inside the same parent
   * component then you can provide a `PopoverContext` context with the parent
   * element specified. This will be overriden by any parentElt prop.
   *
   * *NOTE:* Your `parentElt` should have a CSS position that is non-default
   * (i.e. something like 'relative', 'absolute', or 'fixed') for this to work
   * correctly.
   */
  parentElt?: HTMLElement | string,

  /**
   * The origin coordinates of the popover. This is the point on the popover
   * that will be attached to the `anchorOrigin`. Can be specified using
   * `Popover.Origins.TOP_CENTER | TOP_LEFT | ...`.
   */
  popoverOrigin: OriginPlacement,

  /**
   * How close we can get to any window edge before we auto-adjust the popover's
   * position. If you want to set thresholds for specific edges then use the
   * `windowEdgeThresholds` prop.
   */
  windowEdgeThreshold: number,

  /**
   * An object mapping window edges to their threshold. Any thresholds not
   * included will default to the `windowEdgeThreshold` prop.
   */
  windowEdgeThresholds?: OptionalWindowEdgeThresholds,

  /**
   * Change the popover's z-index, in case you need to make sure the popover
   * shows up in front or behind some elements.
   */
  zIndex?: number,
};

type Props = {
  ...DefaultProps,
  /**
   * The element to which this Popover is anchored. There are three types of
   * elements you can pass:
   *
   * - `() => React.MixedElement` a render function that returns a React
   *   Element. This will get wrapped by a `div` and rendered onto the page.
   * - `HTMLElement` the DOM Node you want to anchor to
   * - `string` the DOM ID of the element you want to anchor to
   *
   * If `null` or `void` are passed, the popover will not render.
   */
  anchorElt: (() => React.MixedElement) | HTMLElement | string | null | void,

  /** This is the contents of the Popover */
  children: React.Node,

  /** Controls whether we show the popover or not */
  isOpen: boolean,
};

type State = {
  /**
   * This is only used if props.anchorElt is a render function. In which case
   * the anchorElt has to be extracted from the ref on componentDidMount and
   * componentDidUpdate/
   */
  anchorElt: HTMLDivElement | null,
};

function isRenderFunction(
  elt: (() => React.MixedElement) | HTMLElement | string | null | void,
): boolean %checks {
  return typeof elt === 'function';
}

/**
 * Popovers are used to display content that overlays the main document.
 * As opposed to modals, Popovers are less intrusive and still allow the rest
 * of the document to be interacted with.
 *
 * Popovers are typically triggered by an event (e.g. hovering over something
 * or clicking on a button), and are always coupled to an **anchor element**. As
 * opposed to modals which automatically render centered in the window, a
 * popover's position is calculated based on the position of its anchor element.
 *
 * This is a **controlled** component, meaning that the `isOpen` state must be
 * explicitly passed by the parent. The popover does not maintain its own open
 * or closed state.
 */
export default class Popover extends React.PureComponent<Props, State> {
  static defaultProps: DefaultProps = {
    anchorOrigin: 'bottom center',
    anchorOuterSpacing: 10,
    ariaName: undefined,
    blurType: 'overlay',
    className: '',
    containerType: 'default',
    doNotFlip: false,
    flippedOffsetX: 0,
    flippedOffsetY: 0,
    keepInWindow: false,
    nodesToObserve: undefined,
    offsetX: 0,
    offsetY: 0,
    onPopoverOpened: undefined,
    onRequestClose: noop,
    parentElt: undefined,
    popoverOrigin: 'top center',
    windowEdgeThreshold: 5,
    windowEdgeThresholds: undefined,
    zIndex: undefined,
  };

  static contextType: typeof PopoverContext = PopoverContext;
  static Origins: typeof ORIGINS = ORIGINS;
  static Containers: typeof POPOVER_CONTAINERS = POPOVER_CONTAINERS;
  static BlurTypes: typeof BLUR_TYPES = BLUR_TYPES;

  state: State = {
    anchorElt: null,
  };

  _popoverPortalNode: HTMLDivElement = document.createElement('div');
  _anchorRefElt: $ElementRefObject<'div'> = React.createRef();

  componentDidMount() {
    this.attachPortalNode(this.getParentElement());
    if (this.state.anchorElt !== this._anchorRefElt.current) {
      this.setState({ anchorElt: this._anchorRefElt.current });
    }
  }

  componentDidUpdate(prevProps: Props) {
    // check if the parentElt has changed, if so we need to re-attach the portal
    if (this.props.parentElt !== prevProps.parentElt) {
      this.unattachPortalNode(this.getParentElement(prevProps.parentElt));
      this.attachPortalNode(this.getParentElement());
    }

    if (this.state.anchorElt !== this._anchorRefElt.current) {
      this.setState({ anchorElt: this._anchorRefElt.current });
    }
  }

  componentWillUnmount() {
    this.unattachPortalNode(this.getParentElement());
  }

  // attach the portal node to the given parent element
  attachPortalNode(parentElt: ?HTMLElement): void {
    if (parentElt) {
      parentElt.appendChild(this._popoverPortalNode);
    } else {
      throw new Error(
        '[Popover] The popover portal could not be attached to any node',
      );
    }
  }

  // remove the portal node from the given parent element
  unattachPortalNode(parentElt: ?HTMLElement): void {
    if (parentElt) {
      parentElt.removeChild(this._popoverPortalNode);
    }
  }

  getParentElement(parentElt?: HTMLElement | string): HTMLElement | null {
    let parent = parentElt;

    if (parent === undefined) {
      parent = this.props.parentElt;
    }

    if (parent === undefined) {
      parent = this.context.parentElt;
    }

    if (typeof parent === 'string') {
      return document.getElementById(parent) || document.body;
    }

    return parent || document.body;
  }

  /**
   * There are multiple different ways the anchor element could have been
   * passed in the props, but they all end up returning an HTMLElement.
   */
  getAnchorElement(): ?HTMLElement {
    const { anchorElt } = this.props;
    if (isRenderFunction(anchorElt)) {
      // if we passed a render function, then the anchor element got wrapped
      // in a div, which has a ref attached to it, and which we store in
      // state.anchorElt
      return this.state.anchorElt;
    }

    if (anchorElt instanceof HTMLElement) {
      return anchorElt;
    }

    if (typeof anchorElt === 'string') {
      return document.getElementById(anchorElt);
    }

    return anchorElt;
  }

  renderAnchorElt(anchorEltFn: () => React.MixedElement): React.Node {
    return (
      <div ref={this._anchorRefElt} className="zen-popover-anchor">
        {anchorEltFn()}
      </div>
    );
  }

  renderPopoverPortal(): React.Node {
    const { anchorElt, ...passThroughProps } = this.props;

    const parentElt = this.getParentElement() || undefined;

    return ReactDOM.createPortal(
      <PopoverPortal
        anchorElt={this.getAnchorElement()}
        {...passThroughProps}
        parentElt={parentElt}
      />,
      this._popoverPortalNode,
    );
  }

  render(): React.Node {
    const { anchorElt } = this.props;
    return (
      <React.Fragment>
        {isRenderFunction(anchorElt) ? this.renderAnchorElt(anchorElt) : null}
        {this.renderPopoverPortal()}
      </React.Fragment>
    );
  }
}
