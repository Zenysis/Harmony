// @flow
import * as React from 'react';

type Props = {
  children: React.Node,

  className?: string,
  /** The number of columns to span */
  colSpan?: number,
  testId?: string,
};

/**
 * A cell in a `<Table.Row>`.
 * Each row must span the same number of cells.
 *
 * @visibleName Table.Cell
 */
function TableCell({
  children = null,
  className = '',
  colSpan = undefined,
  testId = undefined,
}: Props) {
  return (
    <td
      className={`zen-table__cell ${className}`}
      colSpan={colSpan}
      data-testid={testId}
    >
      {children}
    </td>
  );
}

export default (React.memo(TableCell): React.AbstractComponent<Props>);
