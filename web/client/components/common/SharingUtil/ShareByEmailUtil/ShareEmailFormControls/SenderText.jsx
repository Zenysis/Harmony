// @flow

import * as React from 'react';

import LabelWrapper from 'components/ui/LabelWrapper';
import Tooltip from 'components/ui/Tooltip';

const TEXT = t('query_result.common.share_analysis');

type Props = {
  sender: string,
};

function SenderText(props: Props) {
  const { sender } = props;
  return (
    <LabelWrapper inline className="share-message-label" label={TEXT.replyTo}>
      <Tooltip content={TEXT.replyToInfoTip}>{sender}</Tooltip>
    </LabelWrapper>
  );
}

export default (React.memo(SenderText): React.AbstractComponent<Props>);
