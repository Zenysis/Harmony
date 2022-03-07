// @flow
import * as React from 'react';
import classNames from 'classnames';

import SortCaret from 'components/ui/Table/internal/SortCaret';
import autobind from 'decorators/autobind';
import type { StyleObject } from 'types/jsCore';

type DefaultProps = {
  centerHeader: boolean,
  className: string,
  isSortable: boolean,
  sortDirection?: 'ASC' | 'DESC',
  style?: StyleObject,
  zenTestId?: string,
};

type Props = {
  ...DefaultProps,
  children: React.Node,
  id: string,
  onHeaderClick: (id: string) => void,
};

export default class TableHeaderCell extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    centerHeader: false,
    className: '',
    isSortable: false,
    sortDirection: undefined,
    style: undefined,
    zenTestId: undefined,
  };

  @autobind
  onClick() {
    const { onHeaderClick, isSortable, id } = this.props;
    if (isSortable) {
      onHeaderClick(id);
    }
  }

  maybeRenderSortIcon(): React.Node {
    const { isSortable, sortDirection } = this.props;
    if (isSortable) {
      return <SortCaret sortDirection={sortDirection} />;
    }
    return null;
  }

  render(): React.Element<'th'> {
    const {
      centerHeader,
      children,
      className,
      isSortable,
      style,
      zenTestId,
    } = this.props;
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
      <th
        className={headerClassName}
        onClick={this.onClick}
        style={style}
        data-testid={zenTestId}
      >
        <div className={containerClassName}>
          <div className="zen-table__header-cell-content">{children}</div>
          {this.maybeRenderSortIcon()}
        </div>
      </th>
    );
  }
}
