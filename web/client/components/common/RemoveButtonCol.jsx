// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import Icon from 'components/ui/Icon';
import LegacyButton from 'components/ui/LegacyButton';
import Popover from 'components/ui/Popover';
import Table from 'components/ui/Table';
import Tooltip from 'components/ui/Tooltip';
import { autobind } from 'decorators';

// TODO(vedant, pablo) - This is not ideal placement for this particular file.
// It doesn't make sense to have a column as a standalone component in common.
// It is clearly intended to be used in a specific type of Table
// (e.g. UserSelect, RoleSelect)

const TEXT = t('common.user_select.removeButtonColumn');
const POPOVER_TEXT = t('common.confirmation_popover');

type DefaultProps = {
  deleteButtonText: string,
  deleteConfirmationText: string,
  disabled: boolean,
  disabledText: string,
  requireDeleteConfirmation: boolean,
};

type Props<T> = {
  ...DefaultProps,

  // TODO(pablo): this should not be named `columnId`, because it is never used
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
    deleteButtonText: TEXT.deleteButton,
    deleteConfirmationText: TEXT.deleteConfirmation,
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
        isOpen={show}
        anchorElt={this._removeBtnElt.current}
        onRequestClose={this.onDeleteCancelled}
      >
        <p>{deleteConfirmationText}</p>
        <Group.Horizontal>
          <LegacyButton type="danger" onClick={this.onDeleteConfirmed}>
            {deleteButtonText}
          </LegacyButton>
          <LegacyButton type="default" onClick={this.onDeleteCancelled}>
            {POPOVER_TEXT.cancel}
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
        className="remove-row-button"
        disabled={disabled}
        onClick={this.onDeleteRequested}
        ref={this._removeBtnElt}
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
