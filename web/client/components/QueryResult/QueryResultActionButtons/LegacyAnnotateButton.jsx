// @flow
import * as React from 'react';
import invariant from 'invariant';

import AnnotateCanvas from 'components/QueryResult/QueryResultActionButtons/AnnotateCanvas';
import BaseModal from 'components/ui/BaseModal';
import autobind from 'decorators/autobind';
import { findVisualizationContainerElt } from 'components/QueryResult/QueryResultActionButtons/QueryResultCaptureUtil';

type State = {
  modalIsOpen: boolean,
};

export default class LegacyAnnotateButton extends React.PureComponent<
  {},
  State,
> {
  state = {
    modalIsOpen: false,
  };

  _ref: $RefObject<'span'> = React.createRef();

  @autobind
  openModal() {
    this.setState({
      modalIsOpen: true,
    });
  }

  @autobind
  closeModal() {
    this.setState({
      modalIsOpen: false,
    });
  }

  maybeRenderAnnotateCanvas() {
    if (!this.state.modalIsOpen) {
      return null;
    }

    const vizContainerElt = findVisualizationContainerElt(this._ref);
    invariant(
      vizContainerElt !== undefined,
      'Viz container must exist if we are annotating',
    );
    return <AnnotateCanvas element={vizContainerElt} />;
  }

  render() {
    return (
      <span ref={this._ref}>
        <button
          type="button"
          className="action-button"
          onClick={this.openModal}
        >
          <i className="glyphicon glyphicon-pencil" />
          <span className="action-button-text">
            {t('query_result.common.annotate')}
          </span>
        </button>
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
