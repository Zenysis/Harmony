// @flow
import * as React from 'react';

import Button from 'components/ui/Button';
import I18N from 'lib/I18N';

type Props = {
  onClick: () => void,
  testId: string,
};

export default function ResetButton({ onClick, testId }: Props): React.Node {
  const _testId = `reset-button-${testId}`;
  return (
    <Button
      className="configuration-tab__button"
      intent={Button.Intents.PRIMARY}
      minimal
      onClick={onClick}
      testId={_testId}
    >
      {I18N.text('Reset to default')}
    </Button>
  );
}
