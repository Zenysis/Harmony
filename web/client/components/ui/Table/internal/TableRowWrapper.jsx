// @flow
import * as React from 'react';
import classNames from 'classnames';

import Icon from 'components/ui/Icon';
import TableRow from 'components/ui/Table/TableRow';
import autobind from 'decorators/autobind';
import { noop } from 'util/util';
import type { IconType } from 'components/ui/Icon/types';

type DefaultProps<T> = {
  className: string,
  disableClick: boolean,
  isEditMode: boolean | void,
  isSelected: boolean,
  onClick?: (
    data: T,
    idx: number,
    event: SyntheticEvent<HTMLTableRowElement>,
  ) => void,
  onEditCancel: () => void | void,
  onEditSave: () => void | void,
  setEditRow: (isEditMode: number | void) => void | void,
};

type Props<T> = {
  ...DefaultProps<T>,
  children: React.Element<typeof TableRow> | null,
  data: T,
  isTableEditable: boolean,
  rowIdx: number,
};

/**
 * A row in a `<Table>`
 * Its children must be of type `<Table.Cell>`.
 *
 * @visibleName Table.Row
 */
export default class TableRowWrapper<T> extends React.PureComponent<Props<T>> {
  static defaultProps: DefaultProps<T> = {
    className: '',
    disableClick: false,
    isEditMode: undefined,
    isSelected: false,
    onClick: undefined,
    onEditCancel: noop,
    onEditSave: noop,
    setEditRow: noop,
  };

  @autobind
  onClick(event: SyntheticEvent<HTMLTableRowElement>) {
    const { data, disableClick, isEditMode, onClick, rowIdx } = this.props;
    if (onClick && !disableClick && isEditMode !== true) {
      onClick(data, rowIdx, event);
    }
  }

  @autobind
  onClickConfirm() {
    const { onEditSave, setEditRow } = this.props;
    onEditSave();
    setEditRow(undefined);
  }

  @autobind
  onClickCancel() {
    const { onEditCancel, setEditRow } = this.props;
    onEditCancel();
    setEditRow(undefined);
  }

  @autobind
  onClickEdit(event: SyntheticEvent<HTMLDivElement>) {
    const { rowIdx, setEditRow } = this.props;
    setEditRow(rowIdx);
    event.stopPropagation();
  }

  maybeRenderActions(): React.Node {
    const { isEditMode, isTableEditable, setEditRow } = this.props;
    if (!isTableEditable) {
      return null;
    }

    let actionItems = null;
    // Note that a user can only edit one row at a time. When a row is in edit
    // mode, all other row edits are temporarily disabled.
    // `isEditMode` can be undefined, false, or true.
    // (1) If undefined, we know that no row in the table is in edit mode which
    // means all rows will display the edit pen icon.
    // (2) If true, we know that the current row is in edit mode and we display
    // the save and cancel buttons.
    // (3) If false, we know that the current row is not in edit mode and another
    // row is. Thus, we hide all icons.
    if (isEditMode === undefined) {
      actionItems = this.renderEditModeButton(
        'zen-table__edit-button',
        setEditRow !== undefined ? this.onClickEdit : noop,
        'svg-edit-outline',
      );
    } else if (isEditMode) {
      actionItems = (
        <div className="zen-table__edit-actions">
          {this.renderEditModeButton(
            'zen-table__cancel-button',
            this.onClickCancel,
            'svg-cancel-outline',
          )}
          <div className="zen-table__edit-mode-button-separator" />
          {this.renderEditModeButton(
            'zen-table__save-button',
            this.onClickConfirm,
            'svg-check-circle-outline',
          )}
        </div>
      );
    }
    return (
      <td>
        <div className="zen-table__editable-row-actions">{actionItems}</div>
      </td>
    );
  }

  renderEditModeButton(
    className: string,
    onClick: (event: SyntheticEvent<HTMLDivElement>) => void,
    type: IconType,
  ): React.Node {
    return (
      <div
        className={`zen-table__edit-mode-button ${className}`}
        onClick={onClick}
        role="button"
      >
        <Icon type={type} />
      </div>
    );
  }

  render(): React.Element<'tr'> {
    const {
      children,
      className,
      isEditMode,
      onClick,
      disableClick,
      isSelected,
    } = this.props;
    const trClassName = classNames('zen-table__row', className, {
      'zen-table__row--is-clickable': onClick !== undefined && !disableClick,
      'zen-table__row--is-selected': isSelected || isEditMode,
    });
    return (
      <tr
        className={trClassName}
        onClick={onClick !== undefined ? this.onClick : undefined}
      >
        {children}
        {this.maybeRenderActions()}
      </tr>
    );
  }
}
