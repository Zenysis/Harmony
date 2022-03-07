// @flow
import * as React from 'react';

type Props<T> = {
  children: React.Node,

  /**
   * The value to associate with this item. **NOTE**: this is not what is
   * rendered. The rendered contents are handled by `children`.
   */
  value: T,

  /** The callback for when the item is clicked */
  onClick: (T, SyntheticMouseEvent<HTMLLIElement>) => void,
  className?: string,
};

/**
 * `List.ClickableItem` should be used in conjunction with [`<List>`](#list).
 *
 * @visibleName List.ClickableItem
 */
export default function ListClickableItem<T>({
  children,
  value,
  onClick,
  className = '',
}: Props<T>): React.Element<'li'> {
  const onItemClick = event => onClick(value, event);
  return (
    <li className={`zen-list-item zen-list-item--clickable ${className}`}>
      <div
        role="button"
        className="zen-list-item__clickable-contents"
        onClick={onItemClick}
      >
        {children}
      </div>
    </li>
  );
}
