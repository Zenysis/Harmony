// @flow
import * as React from 'react';
import classNames from 'classnames';

import normalizeARIAName from 'components/ui/util/normalizeARIAName';
import useBoolean from 'lib/hooks/useBoolean';
import usePopoverPosition from 'components/ui/Popover/internal/PopoverPortal/usePopoverPosition';
import usePrevious from 'lib/hooks/usePrevious';
import {
  BLUR_TYPES,
  POPOVER_CONTAINERS,
} from 'components/ui/Popover/internal/constants';
import type {
  BlurType,
  OptionalWindowEdgeThresholds,
  OriginPlacement,
  PopoverContainer,
} from 'components/ui/Popover/internal/types';

type Props = {
  anchorElt: ?HTMLElement,
  anchorOrigin: OriginPlacement,
  anchorOuterSpacing: number,
  ariaName: string | void,
  blurType: BlurType,
  children: React.Node,
  className: string,
  containerType: PopoverContainer,
  doNotFlip: boolean,
  flippedOffsetX: number,
  flippedOffsetY: number,
  isOpen: boolean,
  keepInWindow: boolean,
  nodesToObserve:
    | string
    | HTMLElement
    | $ReadOnlyArray<string | HTMLElement>
    | void
    | null,
  offsetX: number,
  offsetY: number,
  onPopoverOpened?: () => void,
  onRequestClose: (SyntheticMouseEvent<HTMLElement> | Event) => void,
  parentElt?: HTMLElement,
  popoverOrigin: OriginPlacement,
  windowEdgeThreshold: number,
  windowEdgeThresholds?: OptionalWindowEdgeThresholds,
  zIndex?: number,
};

export default function PopoverPortal({
  anchorElt,
  anchorOrigin,
  anchorOuterSpacing,
  ariaName,
  blurType,
  children,
  className,
  containerType,
  doNotFlip,
  flippedOffsetX,
  flippedOffsetY,
  isOpen,
  keepInWindow,
  nodesToObserve,
  offsetX,
  offsetY,
  onPopoverOpened,
  onRequestClose,
  parentElt,
  popoverOrigin,
  windowEdgeThreshold,
  windowEdgeThresholds,
  zIndex,
}: Props): React.Node {
  const popoverRef = React.useRef<HTMLDivElement | null>(null);

  // NOTE(pablo): we intentionally use a separate state variable here instead of
  // the isOpen prop because the state is only updated **after** the component
  // fully mounts. This is crucial to allow nested popovers to render in the
  // correct order, because it means any children will not render until after
  // the parent has fully mounted.
  const [popoverIsOpen, openPopover, closePopover] = useBoolean(false);
  const prevPopoverIsOpen = usePrevious(popoverIsOpen);

  // Keep popoverIsOpen in sync with isOpen prop.
  React.useEffect(() => {
    if (isOpen) {
      openPopover();
    } else {
      closePopover();
    }
  }, [isOpen, closePopover, openPopover]);

  React.useEffect(() => {
    if (onPopoverOpened && popoverIsOpen && !prevPopoverIsOpen) {
      onPopoverOpened();
    }
  }, [onPopoverOpened, popoverIsOpen, prevPopoverIsOpen]);

  const [popoverLeft, popoverTop] = usePopoverPosition(
    popoverIsOpen,
    anchorElt,
    popoverRef,
    parentElt,
    anchorOrigin,
    popoverOrigin,
    anchorOuterSpacing,
    offsetX,
    offsetY,
    flippedOffsetX,
    flippedOffsetY,
    windowEdgeThreshold,
    windowEdgeThresholds,
    keepInWindow,
    doNotFlip,
    nodesToObserve,
  );

  const onDocumentClick = React.useCallback(
    (event: Event) => {
      if (
        !popoverRef.current ||
        (event.target instanceof Element &&
          !popoverRef.current.contains(event.target))
      ) {
        onRequestClose(event);
      }
    },
    [onRequestClose],
  );

  // eslint-disable-next-line consistent-return
  React.useEffect(() => {
    if (isOpen && blurType === BLUR_TYPES.DOCUMENT) {
      document.addEventListener('click', onDocumentClick);
      return () => document.removeEventListener('click', onDocumentClick);
    }
  }, [isOpen, blurType, onDocumentClick]);

  const onOverlayClick = (event: SyntheticMouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    onRequestClose(event);
  };

  const renderPopover = () => {
    const popoverClassName = classNames(`zen-popover ${className}`, {
      'zen-popover--default-container':
        containerType === POPOVER_CONTAINERS.DEFAULT,
      'zen-popover--empty-container':
        containerType === POPOVER_CONTAINERS.EMPTY,
      'zen-popover--no-container': containerType === POPOVER_CONTAINERS.NONE,
    });

    const popoverStyle = {
      left: popoverLeft,
      position: 'absolute',
      top: popoverTop,
      zIndex,
    };

    return (
      <div
        ref={popoverRef}
        aria-label={normalizeARIAName(ariaName)}
        className={popoverClassName}
        role="dialog"
        style={popoverStyle}
      >
        {children}
      </div>
    );
  };

  if (!popoverIsOpen) {
    return null;
  }

  if (blurType === BLUR_TYPES.OVERLAY) {
    const popoverContainerStyle = { zIndex };

    // if the blurring is handled by clicking on an overlay, then we need to
    // render that overlay
    return (
      <div className="zen-popover-container" style={popoverContainerStyle}>
        <div
          aria-hidden="true"
          className="zen-popover-overlay"
          data-testid="zen-popover-overlay"
          onClick={onOverlayClick}
        />
        {renderPopover()}
      </div>
    );
  }

  // the blurring is handled by catching clicks on the document, so we do
  // not need an overlay
  return renderPopover();
}
