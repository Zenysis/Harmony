// @flow
import * as React from 'react';
import classNames from 'classnames';

import ListClickableItem from 'components/ui/List/ListClickableItem';
import ListItem from 'components/ui/List/ListItem';

type Props = {
  children: React.ChildrenArray<?(
    | React.Element<typeof ListItem>
    | React.Element<typeof ListClickableItem>
  )>,

  className?: string,

  /** Hides the separating line between each list item */
  noSeparators?: boolean,

  /**
   * If true then when you hover over an item it will be highlighted.
   * This does not necessarily mean they will be clickable. You will need to use
   * [`<List.ClickableItem>`](#listclickableitem) for that.
   */
  hoverableItems?: boolean,

  /** Hides the border around the entire list container */
  noBorder?: boolean,

  /**
   * The spacing to have in betwen each list item. These follow our
   * [standard spacing definitions](#layout).
   */
  spacing?: 'xs' | 's' | 'm' | 'l',

  width?: number | string,
};

/**
 * A vertical list of items.
 */
export default function List({
  children,
  className = '',
  noSeparators = false,
  hoverableItems = false,
  noBorder = false,
  spacing = 'm',
  width = undefined,
}: Props): React.Element<'ul'> {
  const style = { width };
  const mainClassName = classNames('zen-list', className, {
    'zen-list--hoverable': hoverableItems,
    'zen-list--no-separators': noSeparators,
    'zen-list--no-border': noBorder,
    'zen-list--spacing-xs': spacing === 'xs',
    'zen-list--spacing-s': spacing === 's',
    'zen-list--spacing-m': spacing === 'm',
    'zen-list--spacing-l': spacing === 'l',
  });

  return (
    <ul className={mainClassName} style={style}>
      {children}
    </ul>
  );
}

List.Item = ListItem;
List.ClickableItem = ListClickableItem;
