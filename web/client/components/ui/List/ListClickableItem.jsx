// @flow
import * as React from 'react';

type Props<T> = {
  children: React.Node,
  className?: string,

  /** The callback for when the item is clicked */
  onClick: (T, SyntheticMouseEvent<HTMLLIElement>) => void,

  /**
   * The value to associate with this item. **NOTE**: this is not what is
   * rendered. The rendered contents are handled by `children`.
   */
  value: T,
};

/**
 * `List.ClickableItem` should be used in conjunction with [`<List>`](#list).
 *
 * @visibleName List.ClickableItem
 */
export default function ListClickableItem<T>({
  children,
  className = '',
  onClick,
  value,
}: Props<T>): React.Element<'li'> {
  const onItemClick = event => onClick(value, event);
  return (
    <li className={`zen-list-item zen-list-item--clickable ${className}`}>
      <div
        className="zen-list-item__clickable-contents"
        onClick={onItemClick}
        role="button"
      >
        {children}
      </div>
    </li>
  );
}
