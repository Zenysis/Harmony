// @flow

import * as React from 'react';

import LabelWrapper from 'components/ui/LabelWrapper';
import autobind from 'decorators/autobind';

const TEXT = t('query_result.common.share_analysis');

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
      <LabelWrapper className="share-message-label" label={TEXT.emailMessage}>
        <textarea
          name="share-message-panel"
          onChange={this.onMessageChange}
          rows="8"
          className="form-control"
          value={this.props.message}
        />
      </LabelWrapper>
    );
  }
}
