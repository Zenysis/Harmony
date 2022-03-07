// @flow
import * as React from 'react';
import ResizeObserver from 'resize-observer-polyfill';

import ResizeService from 'services/ui/ResizeService';
import buildPopoverPosition from 'components/ui/Popover/internal/PopoverPortal/usePopoverPosition/buildPopoverPosition';
import useGuaranteedMemo from 'lib/hooks/useGuaranteedMemo';
import useIntersectionObserver from 'components/ui/Popover/internal/PopoverPortal/usePopoverPosition/useIntersectionObserver';
import usePrevious from 'lib/hooks/usePrevious';
import type {
  OptionalWindowEdgeThresholds,
  OriginPlacement,
  WindowEdgeThresholds,
} from 'components/ui/Popover/internal/types';

function buildNodesToObserve(
  nodesToObserve:
    | string
    | HTMLElement
    | $ReadOnlyArray<string | HTMLElement>
    | void
    | null,
): $ReadOnlyArray<HTMLElement> {
  if (nodesToObserve) {
    const nodes =
      typeof nodesToObserve === 'string' ||
      nodesToObserve instanceof HTMLElement
        ? [nodesToObserve]
        : nodesToObserve;

    const maybeNodeElements = nodes.map(maybeNode =>
      typeof maybeNode === 'string'
        ? document.getElementById(maybeNode)
        : maybeNode,
    );

    const nodeElements = ((maybeNodeElements.filter(
      maybeNode => maybeNode !== null,
    ): $Cast): $ReadOnlyArray<HTMLElement>);
    return nodeElements;
  }
  return [];
}

function buildWindowEdgeThresholds(
  windowEdgeThresholds: OptionalWindowEdgeThresholds | void,
  windowEdgeThreshold: number,
): WindowEdgeThresholds {
  const { bottom, left, right, top } = windowEdgeThresholds || {};
  return {
    bottom: bottom === undefined ? windowEdgeThreshold : bottom,
    left: left === undefined ? windowEdgeThreshold : left,
    right: right === undefined ? windowEdgeThreshold : right,
    top: top === undefined ? windowEdgeThreshold : top,
  };
}

/**
 * This custom hook encapsulates all of the logic for positioning of the
 * popover. It provides `popoverLeft` and `popoverTop` values as the popover
 * uses position: absolute.
 */
export default function usePopoverPosition(
  isOpen: boolean,
  anchorElt: HTMLElement | null | void,
  popoverRef: { current: HTMLDivElement | null },
  parentElt: HTMLElement | void,
  anchorOrigin: OriginPlacement,
  popoverOrigin: OriginPlacement,
  anchorOuterSpacing: number,
  offsetX: number,
  offsetY: number,
  flippedOffsetX: number,
  flippedOffsetY: number,
  windowEdgeThreshold: number,
  windowEdgeThresholds: OptionalWindowEdgeThresholds | void,
  keepInWindow: boolean,
  doNotFlip: boolean,
  nodesToObserve:
    | string
    | HTMLElement
    | $ReadOnlyArray<string | HTMLElement>
    | void
    | null,
): [
  number | string, // popoverLeft
  number | string, // popoverTop
] {
  const [popoverLeft, setPopoverLeft] = React.useState(0);
  const [popoverTop, setPopoverTop] = React.useState(0);
  const prevIsOpen = usePrevious(isOpen);

  // NOTE(david): We store recalculatingPosition as a ref as we do not want
  // an update to its current value to trigger a re-render.
  const recalculatingPosition = React.useRef(false);

  const getPopoverPosition = React.useCallback(() => {
    if (anchorElt && popoverRef.current) {
      const popoverElt = popoverRef.current;

      return buildPopoverPosition(
        anchorElt,
        popoverElt,
        anchorOrigin,
        popoverOrigin,
        anchorOuterSpacing,
        { offsetX, offsetY },
        { flippedOffsetX, flippedOffsetY },
        buildWindowEdgeThresholds(windowEdgeThresholds, windowEdgeThreshold),
        parentElt,
        keepInWindow,
        doNotFlip,
      );
    }
    return undefined;
  }, [
    anchorElt,
    anchorOrigin,
    anchorOuterSpacing,
    doNotFlip,
    flippedOffsetX,
    flippedOffsetY,
    keepInWindow,
    popoverOrigin,
    popoverRef,
    offsetX,
    offsetY,
    parentElt,
    windowEdgeThreshold,
    windowEdgeThresholds,
  ]);

  /**
   * This function will recalculate the popover position and set the relevant
   * state values. It will disable any necessary observers (to avoid infinite
   * loops) until the setState call has finished.
   */
  const updatePopoverPosition = React.useCallback(() => {
    if (recalculatingPosition.current) {
      return;
    }

    recalculatingPosition.current = true;
    const newPopoverPosition = getPopoverPosition();
    if (newPopoverPosition !== undefined) {
      setPopoverLeft(newPopoverPosition.popoverLeft);
      setPopoverTop(newPopoverPosition.popoverTop);
      recalculatingPosition.current = false;
    }
  }, [getPopoverPosition, recalculatingPosition]);

  // Track the animation frame IDs that are generated during resize events.
  const animationFrameIds = useGuaranteedMemo(() => new Set(), []);

  // Need to use a ref so that the resize observer always has access to the
  // correct callback even if it changes.
  const resizeObserverCallbackRef = React.useRef(() => {});
  resizeObserverCallbackRef.current = () => {
    animationFrameIds.add(window.requestAnimationFrame(updatePopoverPosition));
  };

  // Memoize the resizeObserver so we don't create a new one on each render.
  const resizeObserver = useGuaranteedMemo(
    () => new ResizeObserver(() => resizeObserverCallbackRef.current()),
    [],
  );

  // Need to use a ref so that the ResizeService always has access to the
  // correct callback even if it changes. We also avoid continually re-creating
  // the subscriptiion.
  const resizeServiceCallbackRef = React.useRef(() => {});
  resizeServiceCallbackRef.current = updatePopoverPosition;

  // We use an IntersectionObserver to track non-window level scrolling and
  // update the popover position
  const isAnchorVisible = useIntersectionObserver(
    anchorElt,
    isOpen,
    offsetX,
    offsetY,
    updatePopoverPosition,
  );

  React.useLayoutEffect(() => {
    if (isOpen && !prevIsOpen) {
      updatePopoverPosition();
    }
  }, [isOpen, prevIsOpen, updatePopoverPosition]);

  React.useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    const resizeSubscription = ResizeService.subscribe(() =>
      resizeServiceCallbackRef.current(),
    );
    buildNodesToObserve(nodesToObserve).forEach(resizeObserver.observe);
    if (popoverRef.current) {
      resizeObserver.observe(popoverRef.current);
    }

    // eslint-disable-next-line consistent-return
    return () => {
      ResizeService.unsubscribe(resizeSubscription);
      resizeObserver.disconnect();
      animationFrameIds.forEach(animationFrameId =>
        window.cancelAnimationFrame(animationFrameId),
      );
    };
  }, [isOpen, nodesToObserve, popoverRef]);

  return [
    isAnchorVisible ? popoverLeft : 'calc(-100vw - 100%)',
    isAnchorVisible ? popoverTop : 'calc(-100vh - 100%)',
  ];
}
