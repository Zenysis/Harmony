// @flow
// Inspired by material design drag handle using glyphicons.
import * as React from 'react';

type Props = {|
  className: string,
  size: 'small' | 'medium' | 'large',
|};

const defaultProps = {
  className: '',
  size: 'small',
};

const DRAG_HANDLE_CLASS = 'ui-drag-handle';
const ICON_CLASS = 'glyphicon glyphicon-option-vertical';

/**
 * A basic draggable handle icon that indicates to the user that an
 * element is draggable.
 *
 * You can restrict a `DraggableItem` to only allow draggin on the handle by
 * passing the handle's selector in:
 * ```jsx
 * <DraggableItem dragRestrictionSelector={DragHandle.DEFAULT_SELECTOR}>
 *   ...
 * </DraggableItem>
 * ```
 */
export default function DragHandle({
  className,
  size,
  ...passThroughProps
}: Props) {
  const fullClassName = `${className} ${DRAG_HANDLE_CLASS}`;
  const dragIconClassName = `${DRAG_HANDLE_CLASS}__icon ${DRAG_HANDLE_CLASS}__icon--${size}`;
  return (
    <div className={fullClassName} {...passThroughProps}>
      <span className={`${dragIconClassName} ${ICON_CLASS}`} />
      <span className={`${dragIconClassName} ${ICON_CLASS}`} />
    </div>
  );
}

DragHandle.defaultProps = defaultProps;
DragHandle.DEFAULT_SELECTOR = `.${DRAG_HANDLE_CLASS}`;
