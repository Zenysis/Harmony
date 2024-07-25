// @flow
/* eslint-disable no-unused-vars */
import * as React from 'react';

type Props = {
  children: React.Node,

  className?: string,
};

/**
 * `List.Item` should be used in conjunction with [`<List>`](#list).
 *
 * If you want to attach click interactions to your list item, you should use
 * [`<List.ClickableItem>`](#listclickableitem) instead.
 *
 * @visibleName List.Item
 */
export default function ListItem({
  children,
  className = '',
}: Props): React.Element<'li'> {
  return <li className={`zen-list-item ${className}`}>{children}</li>;
}
