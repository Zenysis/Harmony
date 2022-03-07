// @flow
import * as React from 'react';

import Button from 'components/ui/Button';
import Group from 'components/ui/Group';
import Icon from 'components/ui/Icon';
import I18N from 'lib/I18N';

type Props = {
  onClick: () => void,
};

function ExitButton({ onClick }: Props) {
  return (
    <Button.Unstyled
      className="gd-fullscreen-tile__button"
      onClick={onClick}
    >
      <Group.Horizontal spacing="xxs">
        <Icon type="resize-small" />
        <I18N>Exit</I18N>
      </Group.Horizontal>
    </Button.Unstyled>
  );
}

export default (React.memo(ExitButton): React.AbstractComponent<Props>);
