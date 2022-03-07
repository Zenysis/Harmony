// @flow
import * as React from 'react';

import Button from 'components/ui/Button';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import Spacing from 'components/ui/Spacing';

type Props = {
  isCustomizingTheme: boolean,
  onButtonClick: () => void,
  themeName: string,
};

export default function HeaderBar({
  isCustomizingTheme,
  onButtonClick,
  themeName,
}: Props): React.Node {
  const buttonText = isCustomizingTheme ? (
    <I18N>Done</I18N>
  ) : (
    <I18N>Customize</I18N>
  );

  return (
    <Spacing
      paddingBottom="m"
      paddingTop="m"
      paddingLeft="l"
      paddingRight="l"
      className="table-themes-settings-tab__header-bar"
    >
      <Group.Vertical spacing="xxs">
        <div className="table-themes-settings-tab__curent-theme-subtitle">
          <I18N>Current Theme</I18N>
        </div>
        <Heading.Small>{themeName}</Heading.Small>
      </Group.Vertical>
      <Button onClick={onButtonClick} outline>
        {buttonText}
      </Button>
    </Spacing>
  );
}
