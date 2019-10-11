// @flow
import * as React from 'react';

type Props = {|
  children: React.Node,
  className: string,

  /** The number of columns to span */
  colSpan?: number,
|};

// TODO(pablo): when we upgrade React v16.8 replace this with a functional
// component wrapped by React.memo
/**
 * A cell in a `<Table.Row>`.
 * Each row must span the same number of cells.
 *
 * @visibleName Table.Cell
 */
export default class TableCell extends React.PureComponent<Props> {
  static defaultProps = {
    children: null,
    className: '',
    colSpan: undefined,
  };

  render() {
    const { className, children, colSpan } = this.props;
    return (
      <td className={`zen-table__cell ${className}`} colSpan={colSpan}>
        {children}
      </td>
    );
  }
}
