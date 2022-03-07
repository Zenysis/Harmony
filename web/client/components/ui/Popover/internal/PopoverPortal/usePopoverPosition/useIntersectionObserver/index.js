// @flow
import * as React from 'react';
import 'intersection-observer';

import useElementObservation from 'components/ui/Popover/internal/PopoverPortal/usePopoverPosition/useIntersectionObserver/useElementObservation';
import useGuaranteedMemo from 'lib/hooks/useGuaranteedMemo';

// eslint-disable-next-line flowtype/no-mutable-array
function buildIntersectionThresholds(): Array<number> {
  const thresholds = [];
  for (let threshold = 0; threshold <= 1; threshold += 0.0001) {
    thresholds.push(threshold);
  }
  return thresholds;
}

/**
 * We use an intersection observers to reposition the popover when scrolling is
 * performed on a container other than the window. To do this, we 2 main types
 * of element:
 *   - Dedicated elements for intersection observation. These are 100vh * 100vw
 *     hidden elements that are attached to the anchor element. When the
 *     intersection of these with the window change, that indicates scrolling
 *     and a need to update the popover position.
 *   - The anchor element. In scrolling containers smaller than the window, the
 *     intersection elements above will have a constant intersection value when
 *     the anchor hits the edge of the viewport. We observe the anchor element
 *     for this case and hide the popover when the anchor is fully off-screen.
 * This relies on the anchor element having a non-static position attribute.
 * Typically, this would be position: relative.
 */
export default function useIntersectionObserver(
  anchorElt: HTMLElement | null | void,
  isOpen: boolean,
  offsetX: number,
  offsetY: number,
  onUpdatePopoverPosition: () => void,
): boolean {
  // We can't track the intersections when the anchor is off-screen so we use
  // this state to hide the popover.
  const [isAnchorVisible, setIsAnchorVisible] = React.useState(false);

  // Create an element to be used with the intersection observer.
  const absolutePositionedIntersectionElement = React.useMemo(() => {
    const absoluteDiv = document.createElement('div');
    absoluteDiv.classList.add('zen-popover-intersection-measurer');
    absoluteDiv.classList.add('zen-popover-intersection-measurer--absolute');
    return absoluteDiv;
  }, []);

  // When we are in a container with overflow: hidden we need an intersection
  // element that escapes the container. We do this using a fixed position
  // container. We cannot use this as the default though as we do not want to
  // escape the scrolling container.
  const [
    fixedPositionedIntersectionElement,
    fixedPositionWrapperDiv,
  ] = React.useMemo(() => {
    const fixedDiv = document.createElement('div');
    fixedDiv.classList.add('zen-popover-intersection-measurer');
    fixedDiv.classList.add('zen-popover-intersection-measurer--fixed');

    const fixedWrapperDiv = document.createElement('div');
    fixedWrapperDiv.classList.add(
      'zen-popover-intersection-measurer-wrapper-div',
    );
    fixedWrapperDiv.appendChild(fixedDiv);
    return [fixedDiv, fixedWrapperDiv];
  }, []);

  React.useMemo(() => {
    const anchorHeight = anchorElt ? anchorElt.offsetHeight : 0;
    const anchorWidth = anchorElt ? anchorElt.offsetWidth : 0;

    // The bottom/right of these positioned elements are already set through
    // CSS, so we need to shift upwards and to the left via a transform to avoid
    // causing overflow.
    // NOTE(stephen): This is not able to detect changes to the anchorElt
    // offsetHeight/Width. This is probably ok for most cases, since popovers
    // rarely change size after they are rendered. The only danger to not
    // listening for those sizes is that our intersection elements will be
    // misplaced, potentially causing overflow scrollbars to appear or to miss
    // some scrolling events due to being completely out of the intersection
    // zone.
    const x = offsetX - anchorWidth;
    const y = offsetY - anchorHeight;
    const transform = `translate(${x}px, ${y}px)`;
    absolutePositionedIntersectionElement.style.transform = transform;
    fixedPositionedIntersectionElement.style.transform = transform;
  }, [
    absolutePositionedIntersectionElement,
    anchorElt,
    fixedPositionedIntersectionElement,
    offsetX,
    offsetY,
  ]);

  // Add the intersection elements to the DOM when the popover is opened.
  // eslint-disable-next-line consistent-return
  React.useLayoutEffect(() => {
    if (anchorElt && isOpen) {
      anchorElt.appendChild(absolutePositionedIntersectionElement);
      anchorElt.appendChild(fixedPositionWrapperDiv);

      return () => {
        fixedPositionWrapperDiv.remove();
        absolutePositionedIntersectionElement.remove();
      };
    }
  }, [
    anchorElt,
    absolutePositionedIntersectionElement,
    fixedPositionWrapperDiv,
    isOpen,
  ]);

  // We only want to recalculate the popover position *once* per frame. Since
  // only one update can actually be flushed per frame, we want to have the last
  // update get called and cancel any earlier updates since they are based on
  // old information about the scroll position.
  const animationFrameRef = React.useRef(0);
  const onIntersect = (
    intersectionEntries: $ReadOnlyArray<IntersectionObserverEntry>,
  ) => {
    const { current } = animationFrameRef;
    if (current !== 0) {
      window.cancelAnimationFrame(current);
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      intersectionEntries.forEach(entry => {
        if (entry.target === anchorElt) {
          setIsAnchorVisible(entry.isIntersecting);
        }
      });
      onUpdatePopoverPosition();
      // Signal that our update is complete and no frame will need to be
      // canceled.
      animationFrameRef.current = 0;
    });
  };

  // Need to use a ref so that the intersection observer always has access to
  // the correct callback even if it changes.
  const intersectionObserverCallbackRef = React.useRef(onIntersect);
  intersectionObserverCallbackRef.current = onIntersect;

  // Memoize the intersectionObserver so we don't create a new one on each
  // render.
  const intersectionObserver = useGuaranteedMemo(
    () =>
      new IntersectionObserver(
        entries => intersectionObserverCallbackRef.current(entries),
        { threshold: buildIntersectionThresholds() },
      ),
    [],
  );

  // Register each intersection element to be observed when the popover opens.
  useElementObservation(
    absolutePositionedIntersectionElement,
    intersectionObserver,
    isOpen,
  );
  useElementObservation(
    fixedPositionedIntersectionElement,
    intersectionObserver,
    isOpen,
  );
  useElementObservation(anchorElt, intersectionObserver, isOpen);

  // Fully disconnect intersection observer on component unmount
  React.useEffect(() => {
    return () => intersectionObserver.disconnect();
  }, [intersectionObserver]);

  return isAnchorVisible;
}
