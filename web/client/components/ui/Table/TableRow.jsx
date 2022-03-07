// @flow
import * as React from 'react';

import type { TableRowChildren } from 'components/ui/Table/types';

type Props = {
  /**
   * A row's children can be a TableCell, a component that renders a TableCell,
   * or a component that renders an array of TableCells.
   */
  children: TableRowChildren,

  /**
   * The row's ID, which will be used as the React key when rendering the table
   */
  id: React.Key, // eslint-disable-line react/no-unused-prop-types

  className?: string, // eslint-disable-line react/no-unused-prop-types

  /**
   * If the `<Table>` component has `onRowClick` set, all rows become clickable.
   * If you need any rows to be unclickable, then set their `disableClick` prop
   * to `true`
   */
  disableClick?: boolean, // eslint-disable-line react/no-unused-prop-types

  /**
   * Enables editing for this row.
   */
  enableEdit?: boolean, // eslint-disable-line react/no-unused-prop-types

  /** Whether or not this row should be styled as selected */
  isSelected?: boolean, // eslint-disable-line react/no-unused-prop-types

  /**
   * The cancel action for editing.
   */
  onEditCancel?: () => void, // eslint-disable-line react/no-unused-prop-types

  /**
   * The save action for editing.
   */
  onEditSave?: () => void, // eslint-disable-line react/no-unused-prop-types
};

// NOTE(pablo): this component is intentionally a very thin wrapper around a
// few props just to enforce the API that we want. This is similar to how
// in Dropdown we use an Option as the public API, and an OptionWrapper as
// the component's private API.
// TODO(pablo): wrap in React.memo when that API is available in v16.8
/**
 * A row in a `<Table>`
 * Its children must be of type `<Table.Cell>`, or a component that renders
 * `<Table.Cell>`, or a component that renders an array of `<Table.Cell>`
 *
 * @visibleName Table.Row
 */
export default function TableRow({ children }: Props): React.Node {
  return <React.Fragment>{children}</React.Fragment>;
}
