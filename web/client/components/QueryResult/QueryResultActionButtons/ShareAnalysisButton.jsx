// @flow
import * as React from 'react';

import LegacyButton from 'components/ui/LegacyButton';
import QueryResultSpec from 'models/core/QueryResultSpec';
import QuerySelections from 'models/core/wip/QuerySelections';
import ShareByEmailModal from 'components/QueryResult/QueryResultActionButtons/ShareAnalysisModal/ShareByEmailModal';
import SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import autobind from 'decorators/autobind';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

type Props = {
  querySelections: QuerySelections | SimpleQuerySelections,
  queryResultSpec: QueryResultSpec,
  viewType: ResultViewType,
};

type State = {
  showModal: boolean,
};

const TEXT = t('query_result.common.shareAnalysisButtonText');

export default class ShareAnalysisButton extends React.PureComponent<
  Props,
  State,
> {
  state = {
    showModal: false,
  };

  @autobind
  openModal() {
    const { username, fullName, isAdmin } = window.__JSON_FROM_BACKEND.user;

    analytics.track('Clicked Share Analysis Button', {
      userEmail: username,
      fullName,
      isAdmin,
    });

    this.setState({
      showModal: true,
    });
  }

  @autobind
  closeModal() {
    this.setState({
      showModal: false,
    });
  }

  maybeRenderShareByEmailModal() {
    if (!this.state.showModal) {
      return null;
    }

    const { querySelections, queryResultSpec, viewType } = this.props;
    return (
      <ShareByEmailModal
        querySelections={querySelections}
        queryResultSpec={queryResultSpec}
        viewType={viewType}
        showModal
        onRequestClose={this.closeModal}
      />
    );
  }

  render() {
    return (
      <span className="query-result-add-alert-button">
        <LegacyButton
          className="action-button dashboard-item-button"
          onClick={this.openModal}
          dataContent={TEXT}
        >
          <span aria-hidden="true" className="glyphicon glyphicon-envelope" />
          <span className="action-button-text">{TEXT}</span>
        </LegacyButton>
        {this.maybeRenderShareByEmailModal()}
      </span>
    );
  }
}
