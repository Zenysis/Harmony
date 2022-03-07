// @flow
import * as React from 'react';

import AnnotateCanvas from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/AnnotateButton/AnnotateCanvas';
import BaseModal from 'components/ui/BaseModal';
import Button from 'components/ui/Button';
import autobind from 'decorators/autobind';

type Props = {
  // Callback to receive the VisualizationContainer element reference we need
  // to use for annotation.
  getVisualizationContainerElt: () => HTMLElement,
};

type State = {
  modalIsOpen: boolean,
};

export default class AnnotateButton extends React.PureComponent<Props, State> {
  state: State = {
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

  maybeRenderAnnotateCanvas(): React.Node {
    if (!this.state.modalIsOpen) {
      return null;
    }

    const { getVisualizationContainerElt } = this.props;
    // TODO(nina, stephen): There is a bug where the query result is not being
    // drawn properly (from AQT scaling and render2canvas). The result is
    // a usable but smaller query result on the canvas.
    return <AnnotateCanvas element={getVisualizationContainerElt()} />;
  }

  render(): React.Node {
    return (
      <span>
        <Button
          outline
          size={Button.Sizes.MEDIUM}
          intent={Button.Intents.PRIMARY}
          onClick={this.openModal}
        >
          {t('query_result.common.annotate')}
        </Button>
        <BaseModal
          height="85%"
          show={this.state.modalIsOpen}
          showHeader={false}
          showFooter={false}
          onRequestClose={this.closeModal}
          width="85%"
        >
          {this.maybeRenderAnnotateCanvas()}
        </BaseModal>
      </span>
    );
  }
}
