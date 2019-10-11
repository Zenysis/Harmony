// @flow
import * as React from 'react';

import AnnotateCanvas from 'components/QueryResult/QueryResultActionButtons/AnnotateCanvas';
import BaseModal from 'components/ui/BaseModal';
import Button from 'components/ui/Button';
import autobind from 'decorators/autobind';

type Props = {
  // Callback to receive the VisualizationContainer element reference we need
  // to use for annotation.
  getVisualizationContainerElt: () => HTMLDivElement,
};

type State = {
  modalIsOpen: boolean,
};

export default class AnnotateButton extends React.PureComponent<Props, State> {
  state = {
    modalIsOpen: false,
  };

  @autobind
  openModal() {
    this.setState({ modalIsOpen: true });
  }

  @autobind
  closeModal() {
    this.setState({ modalIsOpen: false });
  }

  maybeRenderAnnotateCanvas() {
    if (!this.state.modalIsOpen) {
      return null;
    }

    const { getVisualizationContainerElt } = this.props;
    return <AnnotateCanvas element={getVisualizationContainerElt()} />;
  }

  render() {
    return (
      <span>
        <Button
          outline
          size={Button.Sizes.MEDIUM}
          intent={Button.Intents.PRIMARY}
          onClick={this.openModal}
        >
          <span className="action-button-text">
            {t('query_result.common.annotate')}
          </span>
        </Button>
        <BaseModal
          show={this.state.modalIsOpen}
          showHeader={false}
          showFooter={false}
          onRequestClose={this.closeModal}
          defaultHeight="90%"
          defaultPercentTop={5}
          width={Infinity}
        >
          {this.maybeRenderAnnotateCanvas()}
        </BaseModal>
      </span>
    );
  }
}
