// @flow
import * as React from 'react';

import TableCell from 'components/ui/Table/TableCell';

type ComponentThatRendersTableCell =
  | Class<
      React.Component<$AllowAny, $AllowAny> & {
        +render: () => null | React.Element<typeof TableCell>,
        ...
      },
    >
  | ($AllowAny => null | React.Element<typeof TableCell>);

type ComponentThatRendersTableCellArray =
  | Class<
      React.Component<$AllowAny, $AllowAny> & {
        +render: () => null | $ReadOnlyArray<
          | null
          | React.Element<typeof TableCell>
          | React.Element<ComponentThatRendersTableCell>
          | React.Element<ComponentThatRendersTableCellArray>,
        >,
        ...
      },
    >
  | ($AllowAny => null | $ReadOnlyArray<
      | null
      | React.Element<typeof TableCell>
      | React.Element<ComponentThatRendersTableCell>
      | React.Element<ComponentThatRendersTableCellArray>,
    >);

export type TableRowChildren = React.ChildrenArray<
  | null
  | React.Element<typeof TableCell>
  | React.Element<ComponentThatRendersTableCell>
  | React.Element<ComponentThatRendersTableCellArray>,
>;
