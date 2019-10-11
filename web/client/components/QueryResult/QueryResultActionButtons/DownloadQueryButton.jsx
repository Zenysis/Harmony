// @flow
import * as React from 'react';

import Button from 'components/ui/Button';
import DownloadQueryModal from 'components/QueryResult/QueryResultActionButtons/DownloadQueryModal/index';
import QueryResultSpec from 'models/core/QueryResultSpec';
import QuerySelections from 'models/core/wip/QuerySelections';
import autobind from 'decorators/autobind';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

type Props = {
  querySelections: QuerySelections,
  queryResultSpec: QueryResultSpec,
  viewType: ResultViewType,

  smallMode: boolean,
};

type State = {
  showModal: boolean,
};

const TEXT = t('query_result.common.download_query');

export default class DownloadQueryButton extends React.PureComponent<
  Props,
  State,
> {
  static defaultProps = {
    smallMode: false,
  };

  state = {
    showModal: false,
  };

  @autobind
  closeModal() {
    this.setState({ showModal: false });
  }

  @autobind
  openModal() {
    this.setState({ showModal: true });
  }

  @autobind
  onDownloadButtonClick() {
    this.openModal();
    analytics.track('Click download query button');
  }

  render() {
    const size = this.props.smallMode
      ? Button.Sizes.SMALL
      : Button.Sizes.MEDIUM;
    return (
      <div className="aqt-query-result-action-buttons__secondary-buttons--button">
        <Button
          size={size}
          intent={Button.Intents.PRIMARY}
          onClick={this.onDownloadButtonClick}
        >
          {TEXT.title}
        </Button>
        <DownloadQueryModal
          show={this.state.showModal}
          viewType={this.props.viewType}
          onRequestClose={this.closeModal}
          queryResultSpec={this.props.queryResultSpec}
          querySelections={this.props.querySelections}
        />
      </div>
    );
  }
}
