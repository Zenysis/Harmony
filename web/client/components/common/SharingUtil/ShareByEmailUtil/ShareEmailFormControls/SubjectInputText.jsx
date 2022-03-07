// @flow

import * as React from 'react';

import InputText from 'components/ui/InputText';
import LabelWrapper from 'components/ui/LabelWrapper';

const TEXT = t('query_result.common.share_analysis');

type Props = {
  subject: string,
  setSubject: (subject: string) => void,
};

function SubjectInputText(props: Props) {
  const { subject, setSubject } = props;
  return (
    <LabelWrapper className="share-message-label" label={TEXT.subjectText}>
      <InputText
        value={subject}
        onChange={setSubject}
        placeholder={TEXT.subjectPlaceholder}
      />
    </LabelWrapper>
  );
}

export default (React.memo(SubjectInputText): React.AbstractComponent<Props>);
