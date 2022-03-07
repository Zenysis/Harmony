// @flow
import * as React from 'react';

import I18N from 'lib/I18N';
import Spacing from 'components/ui/Spacing';
import ThemeSelectorRadioButton from 'components/visualizations/Table/TableThemesSettingsTab/ThemeSelector/ThemeSelectorRadioButton';
import { CUSTOM_THEME_ID } from 'components/visualizations/Table/TableThemesSettingsTab/constants';
import { DEFAULT_THEMES } from 'models/visualizations/Table/TableSettings/TableTheme/DefaultThemes';
import type TableTheme from 'models/visualizations/Table/TableSettings/TableTheme';

type Props = {
  activeTheme: string,
  customTheme: TableTheme | void,
  onActiveThemeChange: string => void,
};

function ThemeSelector({
  activeTheme,
  customTheme,
  onActiveThemeChange,
}: Props): React.Node {
  let themes = DEFAULT_THEMES;

  if (customTheme !== undefined) {
    themes = [
      {
        displayName: I18N.text('Custom'),
        imageUrl: '/images/tableThemes/Custom.png',
        themeId: CUSTOM_THEME_ID,
      },
      ...DEFAULT_THEMES,
    ];
  }

  return (
    <Spacing
      className="table-themes-settings-tab__theme-selector"
      marginBottom="l"
      paddingX="l"
    >
      {themes.map(({ displayName, imageUrl, themeId }) => {
        const className =
          themeId === CUSTOM_THEME_ID
            ? 'table-themes-settings-tab__theme-selector-radio-button--custom-theme'
            : undefined;

        const isSelected = activeTheme === themeId;
        return (
          <ThemeSelectorRadioButton
            className={className}
            key={themeId}
            imageUrl={imageUrl}
            isSelected={isSelected}
            label={displayName}
            themeId={themeId}
            onClick={() => onActiveThemeChange(themeId)}
          />
        );
      })}
    </Spacing>
  );
}

export default (React.memo<Props>(
  ThemeSelector,
): React.AbstractComponent<Props>);
