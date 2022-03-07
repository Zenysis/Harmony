// @flow
import * as React from 'react';

import ColorControl from 'components/visualizations/common/controls/ColorControl';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import ToggleSwitchControl from 'components/visualizations/common/controls/ToggleSwitchControl';
import type TableStyleTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/TableStyleTheme';

type Props = {
  onThemeChange: TableStyleTheme => void,
  theme: TableStyleTheme,
};

function TableStyleSection({ onThemeChange, theme }: Props): React.Node {
  // TODO(david): Just pass this down directly instead of having it in every controls section
  const onControlValueChange = (controlKey: string, value: mixed) => {
    const newTheme = theme.set(controlKey, value);
    onThemeChange(newTheme);
  };

  return (
    <Group.Vertical spacing="l">
      <ColorControl
        controlKey="backgroundColor"
        enableNoColor
        label={I18N.text('Background color')}
        onValueChange={onControlValueChange}
        value={theme.backgroundColor()}
      />
      <ColorControl
        controlKey="borderColor"
        enableNoColor
        label={I18N.text('Table border color')}
        onValueChange={onControlValueChange}
        value={theme.borderColor()}
      />
      <ToggleSwitchControl
        controlKey="roundCorners"
        label={I18N.text('Round table corners')}
        onValueChange={onControlValueChange}
        value={theme.roundCorners()}
      />
      <ColorControl
        controlKey="rowBandingColor"
        enableNoColor
        label={I18N.text('Row banding')}
        onValueChange={onControlValueChange}
        value={theme.rowBandingColor()}
      />
    </Group.Vertical>
  );
}

export default (React.memo<Props>(
  TableStyleSection,
): React.AbstractComponent<Props>);
