// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import LegacyButton from 'components/ui/LegacyButton';
import Popover from 'components/ui/Popover';
import Table from 'components/ui/Table';
import Tooltip from 'components/ui/Tooltip';
import { autobind } from 'decorators';

// TODO - This is not ideal placement for this particular file.
// It doesn't make sense to have a column as a standalone component in common.
// It is clearly intended to be used in a specific type of Table
// (e.g. UserSelect, RoleSelect)

type DefaultProps = {
  deleteButtonText: string,
  deleteConfirmationText: string,
  disabled: boolean,
  disabledText: string,
  requireDeleteConfirmation: boolean,
};

type Props<T> = {
  ...DefaultProps,

  // TODO: this should not be named `columnId`, because it is never used
  // as such. Instead it is being used as a data prop to pass to onRemoveClick.
  columnId: T,
  onRemoveClick: (columnId: T) => void,
};

type State = {
  deleteClicked: boolean,
};

export default class RemoveButtonCol<T> extends React.PureComponent<
  Props<T>,
  State,
> {
  static defaultProps: DefaultProps = {
    deleteButtonText: I18N.textById('Delete'),
    deleteConfirmationText: I18N.text(
      'Are you sure you want to delete this entry?',
    ),
    disabled: false,
    disabledText: '',
    requireDeleteConfirmation: false,
  };

  state: State = {
    deleteClicked: false,
  };

  _removeBtnElt: $ElementRefObject<'button'> = React.createRef();

  notifyDeleteAndReset() {
    this.setState({ deleteClicked: false }, () =>
      this.props.onRemoveClick(this.props.columnId),
    );
  }

  @autobind
  onDeleteRequested(event: SyntheticEvent<HTMLButtonElement>) {
    event.stopPropagation();

    if (this.props.requireDeleteConfirmation) {
      this.setState({ deleteClicked: true });
    } else {
      this.notifyDeleteAndReset();
    }
  }

  @autobind
  onDeleteCancelled(event: SyntheticEvent<HTMLElement> | Event) {
    event.stopPropagation();
    this.setState({ deleteClicked: false });
  }

  @autobind
  onDeleteConfirmed(event: SyntheticEvent<HTMLElement>) {
    event.stopPropagation();
    this.notifyDeleteAndReset();
  }

  maybeRenderDeletePopover(): React.Node {
    const {
      deleteButtonText,
      deleteConfirmationText,
      requireDeleteConfirmation,
    } = this.props;
    const show = requireDeleteConfirmation && this.state.deleteClicked;

    return (
      <Popover
        anchorElt={this._removeBtnElt.current}
        isOpen={show}
        onRequestClose={this.onDeleteCancelled}
      >
        <p>{deleteConfirmationText}</p>
        <Group.Horizontal>
          <LegacyButton onClick={this.onDeleteConfirmed} type="danger">
            {deleteButtonText}
          </LegacyButton>
          <LegacyButton onClick={this.onDeleteCancelled} type="default">
            {I18N.textById('Cancel')}
          </LegacyButton>
        </Group.Horizontal>
      </Popover>
    );
  }

  renderDeleteButton(): React.Node {
    const { disabled, disabledText } = this.props;
    const iconClassName = disabled
      ? 'remove-row-button__icon--disabled'
      : 'remove-row-button__icon';
    const button = (
      <button
        ref={this._removeBtnElt}
        className="remove-row-button"
        disabled={disabled}
        onClick={this.onDeleteRequested}
        type="button"
      >
        <Icon className={iconClassName} type="remove" />
      </button>
    );
    if (disabled) {
      return (
        <Tooltip content={disabledText} tooltipPlacement="right">
          {button}
        </Tooltip>
      );
    }
    return button;
  }

  render(): React.Element<typeof Table.Cell> {
    return (
      <Table.Cell>
        <div className="pull-right">{this.renderDeleteButton()}</div>
        <span>{this.maybeRenderDeletePopover()}</span>
      </Table.Cell>
    );
  }
}
