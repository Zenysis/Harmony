// @flow
import * as React from 'react';

import TableCell from 'components/ui/Table/TableCell';

type ComponentThatRendersTableCell = Class<
  React.Component<any, any> & {
    +render: () => null | React.Element<typeof TableCell>,
  },
>;

type ComponentThatRendersTableCellArray = Class<
  React.Component<any, any> & {
    +render: () => null | $ReadOnlyArray<
      | null
      | React.Element<typeof TableCell>
      | React.Element<ComponentThatRendersTableCell>
      | React.Element<ComponentThatRendersTableCellArray>,
    >,
  },
>;

type Props = {|
  /**
   * A row's children can be a TableCell, a component that renders a TableCell,
   * or a component that renders an array of TableCells.
   */
  children: React.ChildrenArray<
    | null
    | React.Element<typeof TableCell>
    | React.Element<ComponentThatRendersTableCell>
    | React.Element<ComponentThatRendersTableCellArray>,
  >,

  className: string, // eslint-disable-line react/no-unused-prop-types

  /**
   * If the `<Table>` component has `onRowClick` set, all rows become clickable.
   * If you need any rows to be unclickable, then set their `disableClick` prop
   * to `true`
   */
  disableClick: boolean, // eslint-disable-line react/no-unused-prop-types

  /**
   * The row's ID, which will be used as the React key when rendering the table
   */
  id?: React.Key, // eslint-disable-line react/no-unused-prop-types

  /** Whether or not this row should be styled as selected */
  isSelected: boolean, // eslint-disable-line react/no-unused-prop-types
|};

const defaultProps = {
  className: '',
  disableClick: false,
  id: undefined,
  isSelected: false,
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
export default function TableRow(props: Props) {
  return <React.Fragment>{props.children}</React.Fragment>;
}

TableRow.defaultProps = defaultProps;
