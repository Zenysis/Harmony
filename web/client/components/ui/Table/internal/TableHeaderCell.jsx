// @flow
import * as React from 'react';
import classNames from 'classnames';

import SortCaret from 'components/ui/Table/internal/SortCaret';
import autobind from 'decorators/autobind';
import type { StyleObject } from 'types/jsCore';

type Props = {
  children: React.Node,
  id: string,
  onHeaderClick: (id: string) => void,

  centerHeader: boolean,
  className: string,
  isSortable: boolean,
  sortDirection?: 'ASC' | 'DESC',
  style?: StyleObject,
};

export default class TableHeaderCell extends React.PureComponent<Props> {
  static defaultProps = {
    centerHeader: false,
    className: '',
    isSortable: false,
    sortDirection: undefined,
    style: {},
  };

  @autobind
  onClick() {
    const { onHeaderClick, isSortable, id } = this.props;
    if (isSortable) {
      onHeaderClick(id);
    }
  }

  maybeRenderSortIcon() {
    const { isSortable, sortDirection } = this.props;
    if (isSortable) {
      return <SortCaret sortDirection={sortDirection} />;
    }
    return null;
  }

  render() {
    const { centerHeader, children, className, isSortable, style } = this.props;
    const headerClassName = classNames('zen-table__header-cell', className, {
      'zen-table__header-cell--sortable': isSortable,
    });
    const containerClassName = classNames(
      'zen-table__header-cell-content-container',
      {
        'zen-table__header-cell-content-container--centered': centerHeader,
      },
    );
    return (
      <th className={headerClassName} onClick={this.onClick} style={style}>
        <div className={containerClassName}>
          <div className="zen-table__header-cell-content">{children}</div>
          {this.maybeRenderSortIcon()}
        </div>
      </th>
    );
  }
}
