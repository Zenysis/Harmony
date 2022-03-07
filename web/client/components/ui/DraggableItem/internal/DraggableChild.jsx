// @flow
import * as React from 'react';

import type { StyleObject } from 'types/jsCore';

/**
 * Props that `react-draggable: <Draggable>` will pass in that we need to
 * override. They are marked as `Unsettable` because the user cannot provide
 * them. If they were included, we wouldn't be able to override
 * `react-draggable`'s behavior.
 *
 * NOTE(stephen): Ignoring the `transform` prop even though it is optionally
 * specified by `react-draggable` since we don't support SVG element dragging
 * right now.
 */
opaque type UnsettableProp<T> = T;
type ReactDraggableProps = {
  style?: UnsettableProp<StyleObject>,
};

type Props = {
  ...ReactDraggableProps,
  onClickCapture: (event: SyntheticEvent<HTMLDivElement>) => boolean | void,
  children: React.Element<React.ElementType>,

  /**
   * To avoid having `react-draggable` overwrite style attributes that we intend
   * to include, pass any additional style separately and handle merging
   * ourselves.
   */
  additionalStyle?: StyleObject,
  className?: string,
};

/**
 * Wrapper component that gets passed to `react-draggable: <Draggable>` and
 * overrides certain default behaviors of that library.
 *
 * `react-draggable: <Draggable>` requires there only be a single child element
 * passed into that component. `react-draggable` then clones that child element
 * and adds merges conflicting props (primarily `style`). The `style` prop they
 * build has some quirks, and we want to overwrite it. To do this, we hook into
 * the props that `react-draggable` was going to send to the child and make our
 * modifications.
 *
 * NOTE(stephen): We only expose the Props that are allowed to be set on this
 * component by the user. Exposing the props we want to override would not
 * allow us to override them as easily.
 */
export default function DraggableChild({
  children,
  additionalStyle = {},
  className = '',
  style = undefined,
  ...passThroughProps
}: Props): React.Element<'div'> {
  // react-draggable merges these props in the opposite order. We would prefer
  // to be able to override specific style attributes set by react-draggable if
  // we want to.
  const fullStyle = {
    ...style,
    ...additionalStyle,
  };

  // Clear the default translate value that react-draggable adds since we don't
  // want to create a new stacking context if we don't have to.
  if (fullStyle.transform === 'translate(0px,0px)') {
    fullStyle.transform = undefined;
  }

  return (
    <div className={className} style={fullStyle} {...passThroughProps}>
      {children}
    </div>
  );
}
