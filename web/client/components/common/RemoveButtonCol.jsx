// @flow
import * as React from 'react';

import ConfirmationPopover from 'components/common/ConfirmationPopover';
import Table from 'components/ui/Table';
import { autobind } from 'decorators';

// TODO(vedant, pablo) - This is not ideal placement for this particular file.
// It doesn't make sense to have a column as a standalone component in common.
// It is clearly intended to be used in a specific type of Table
// (e.g. UserSelect, RoleSelect)

const TEXT = t('common.removeButtonColumn');

type Props<T> = {
  // TODO(pablo): this should not be named `columnId`, because it is never used
  // as such. Instead it is being used as a data prop to pass to onRemoveClick.
  columnId: T,
  onRemoveClick: (columnId: T) => void,

  deleteButtonText: string,
  deleteConfirmationText: string,

  // HACK(vedant) - This is a temporary solution until we refactor the
  // components that use `RemoveButtonCol` to include an extra icon
  // column if they need it. It is not necessary to couple this seemingly
  // irrelevant icon to this component.
  extraIconClass?: string,
  requireDeleteConfirmation: boolean,
};

type State = {
  deleteClicked: boolean,
};

export default class RemoveButtonCol<T> extends React.PureComponent<
  Props<T>,
  State,
> {
  static defaultProps = {
    deleteButtonText: TEXT.deleteButton,
    deleteConfirmationText: TEXT.deleteConfirmation,
    extraIconClass: undefined,
    requireDeleteConfirmation: false,
  };

  state = {
    deleteClicked: false,
  };

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
  onDeleteCancelled() {
    this.setState({ deleteClicked: false });
  }

  @autobind
  onDeleteConfirmed() {
    this.notifyDeleteAndReset();
  }

  maybeRenderIcon() {
    if (!this.props.extraIconClass) {
      return null;
    }

    return <span className={this.props.extraIconClass} />;
  }

  maybeRenderDeletePopover() {
    const show =
      this.props.requireDeleteConfirmation && this.state.deleteClicked;

    return (
      <ConfirmationPopover
        show={show}
        text={this.props.deleteConfirmationText}
        primaryText={this.props.deleteButtonText}
        onPrimaryAction={this.onDeleteConfirmed}
        onSecondaryAction={this.onDeleteCancelled}
      />
    );
  }

  render() {
    return (
      <Table.Cell>
        <div className="pull-right">
          {this.maybeRenderIcon()}
          <button
            type="button"
            className="remove-row-button"
            onClick={this.onDeleteRequested}
          >
            <i className="glyphicon glyphicon-remove" aria-hidden="true" />
          </button>
        </div>
        <span>{this.maybeRenderDeletePopover()}</span>
      </Table.Cell>
    );
  }
}
