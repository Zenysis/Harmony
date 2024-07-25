// @flow
// Inspired by material design drag handle using glyphicons.
import * as React from 'react';
import classNames from 'classnames';

import Icon from 'components/ui/Icon';
import type { IconType } from 'components/ui/Icon/types';

type Props = {
  className?: string,
  disabled?: boolean,
  iconType?: IconType,
  size?: 'small' | 'medium' | 'large',
};

const DRAG_HANDLE_CLASS = 'ui-drag-handle';

const SIZE_STYLES = {
  small: {
    height: 12,
    width: 12,
  },
  medium: {
    height: 14,
    width: 14,
  },
  large: {
    height: 16,
    width: 16,
  },
};

/**
 * A basic draggable handle icon that indicates to the user that an
 * element is draggable.
 *
 * You can restrict a `DraggableItem` to only allow dragging on the handle by
 * passing the handle's selector in:
 * ```jsx
 * <DraggableItem dragRestrictionSelector={DragHandle.DEFAULT_SELECTOR}>
 *   ...
 * </DraggableItem>
 * ```
 */
export default function DragHandle({
  className = '',
  disabled = false,
  iconType = 'svg-drag-indicator',
  size = 'small',
  ...passThroughProps
}: Props): React.Element<'div'> {
  const fullClassName = classNames(DRAG_HANDLE_CLASS, className, {
    [`${DRAG_HANDLE_CLASS}--disabled`]: disabled,
  });
  return (
    <div className={fullClassName} {...passThroughProps}>
      <Icon style={SIZE_STYLES[size]} type={iconType} />
    </div>
  );
}

DragHandle.DEFAULT_SELECTOR = `.${DRAG_HANDLE_CLASS}`;
