// @flow

import * as React from 'react';

import I18N from 'lib/I18N';
import LabelWrapper from 'components/ui/LabelWrapper';
import autobind from 'decorators/autobind';

type Props = {
  message: string,
  setMessage: (message: string) => void,
};

export default class MessageInputText extends React.PureComponent<Props> {
  @autobind
  onMessageChange(event: SyntheticEvent<HTMLTextAreaElement>) {
    const inputNode = event.target;
    if (inputNode instanceof HTMLTextAreaElement) {
      this.props.setMessage(inputNode.value);
    }
  }

  render(): React.Node {
    return (
      <LabelWrapper
        className="share-message-label"
        label={I18N.text('Message:')}
      >
        <textarea
          className="form-control"
          name="share-message-panel"
          onChange={this.onMessageChange}
          rows="8"
          value={this.props.message}
        />
      </LabelWrapper>
    );
  }
}
