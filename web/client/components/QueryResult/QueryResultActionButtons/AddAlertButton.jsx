// @flow
import * as React from 'react';

import ComposeAlertDefinitionModal from 'components/AlertsApp/ComposeAlertDefinitionModal';
import LegacyButton from 'components/ui/LegacyButton';
import QuerySelections from 'models/core/wip/QuerySelections';
import SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import autobind from 'decorators/autobind';

type Props = {
  querySelections: QuerySelections | SimpleQuerySelections,
};

type State = {
  showModal: boolean,
};

const TEXT = t('query_result.common.addAlertButtonText');

export default class AddAlertButton extends React.PureComponent<Props, State> {
  state = {
    showModal: false,
  };

  @autobind
  openModal() {
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

  maybeRenderAddAlertModal() {
    if (!this.state.showModal) {
      return null;
    }

    const { querySelections } = this.props;
    return (
      <ComposeAlertDefinitionModal
        // $FlowFixMe - handle case where this isn't a SimpleQuerySelections
        initialFields={querySelections.fields()}
        // $FlowFixMe - handle case where this isn't a SimpleQuerySelections
        initialGranularity={querySelections.granularity()}
        mode={ComposeAlertDefinitionModal.Modes.CREATE}
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
          <span aria-hidden="true" className="glyphicon glyphicon-bell" />
          <span className="action-button-text">{TEXT}</span>
        </LegacyButton>
        {this.maybeRenderAddAlertModal()}
      </span>
    );
  }
}
