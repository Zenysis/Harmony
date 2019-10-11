// @flow
import * as React from 'react';
import classNames from 'classnames';

import TableRow from 'components/ui/Table/TableRow';
import autobind from 'decorators/autobind';

// TODO(pablo): finish documenting
type Props<T> = {
  children: React.Element<typeof TableRow> | null,
  data: T,
  rowIdx: number,

  className: string,
  disableClick: boolean,
  isSelected: boolean,
  onClick?: (
    data: T,
    idx: number,
    event: SyntheticEvent<HTMLTableRowElement>,
  ) => void,
};

/**
 * A row in a `<Table>`
 * Its children must be of type `<Table.Cell>`.
 *
 * @visibleName Table.Row
 */
export default class TableRowWrapper<T> extends React.PureComponent<Props<T>> {
  static defaultProps = {
    className: '',
    disableClick: false,
    isSelected: false,
    onClick: undefined,
  };

  @autobind
  onClick(event: SyntheticEvent<HTMLTableRowElement>) {
    const { data, rowIdx, onClick, disableClick } = this.props;
    if (onClick && !disableClick) {
      onClick(data, rowIdx, event);
    }
  }

  render() {
    const {
      children,
      className,
      onClick,
      disableClick,
      isSelected,
    } = this.props;
    const trClassName = classNames('zen-table__row', className, {
      'zen-table__row--is-clickable': onClick !== undefined && !disableClick,
      'zen-table__row--is-selected': isSelected,
    });
    return (
      <tr className={trClassName} onClick={this.onClick}>
        {children}
      </tr>
    );
  }
}
