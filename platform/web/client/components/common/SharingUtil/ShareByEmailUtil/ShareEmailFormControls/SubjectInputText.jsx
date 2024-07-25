// @flow

import * as React from 'react';

import I18N from 'lib/I18N';
import InputText from 'components/ui/InputText';
import LabelWrapper from 'components/ui/LabelWrapper';

type Props = {
  setSubject: (subject: string) => void,
  subject: string,
};

function SubjectInputText(props: Props) {
  const { setSubject, subject } = props;
  return (
    <LabelWrapper className="share-message-label" label={I18N.text('Subject:')}>
      <InputText
        onChange={setSubject}
        placeholder={I18N.text('Enter your subject')}
        value={subject}
      />
    </LabelWrapper>
  );
}

export default (React.memo(SubjectInputText): React.AbstractComponent<Props>);
