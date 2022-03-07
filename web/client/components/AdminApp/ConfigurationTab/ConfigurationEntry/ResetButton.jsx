// @flow
import * as React from 'react';

import Button from 'components/ui/Button';

type Props = {
  onClick: () => void,
};

const TEXT = t('admin_app.configuration');

export default function ResetButton({ onClick }: Props): React.Node {
  return (
    <Button
      className="configuration-tab__button"
      minimal
      onClick={onClick}
      intent={Button.Intents.PRIMARY}
    >
      {TEXT.resetValue}
    </Button>
  );
}
