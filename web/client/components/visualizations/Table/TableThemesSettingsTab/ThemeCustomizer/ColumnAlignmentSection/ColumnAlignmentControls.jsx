// @flow
import * as React from 'react';

import I18N from 'lib/I18N';
import RadioControl from 'components/visualizations/common/controls/RadioControl';
import RadioGroup from 'components/ui/RadioGroup';
import Spacing from 'components/ui/Spacing';
import type ColumnTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/ColumnTheme';
import type { ThemeControlsProps } from 'components/visualizations/Table/TableThemesSettingsTab/types';

type Props = ThemeControlsProps<ColumnTheme>;

function ColumnThemeControls({
  onThemeChange,
  theme,
  header = '',
}: Props): React.Node {
  const onControlValueChange = (controlKey: string, value: string) => {
    onThemeChange(theme.set(controlKey, value));
  };

  return (
    <React.Fragment>
      {header !== '' && (
        <Spacing className="u-paragraph-text" marginBottom="m" flex>
          {header}
        </Spacing>
      )}
      <RadioControl
        controlKey="alignment"
        onValueChange={onControlValueChange}
        value={theme.alignment()}
      >
        <RadioGroup.Item value="left">
          <I18N>Left-aligned</I18N>
        </RadioGroup.Item>
        <RadioGroup.Item value="center">
          <I18N>Centered</I18N>
        </RadioGroup.Item>
        <RadioGroup.Item value="right">
          <I18N>Right-aligned</I18N>
        </RadioGroup.Item>
      </RadioControl>
    </React.Fragment>
  );
}

export default (React.memo<Props>(
  ColumnThemeControls,
): React.AbstractComponent<Props>);
