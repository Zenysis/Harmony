// @flow

import * as React from 'react';

import I18N from 'lib/I18N';
import LabelWrapper from 'components/ui/LabelWrapper';
import Tooltip from 'components/ui/Tooltip';

type Props = {
  sender: string,
};

function SenderText(props: Props) {
  const { sender } = props;
  return (
    <LabelWrapper
      className="share-message-label"
      inline
      label={I18N.text('Reply-to: ')}
    >
      <Tooltip content={I18N.text('Users will reply to this email address')}>
        {sender}
      </Tooltip>
    </LabelWrapper>
  );
}

export default (React.memo(SenderText): React.AbstractComponent<Props>);
