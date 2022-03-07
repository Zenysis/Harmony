// @flow
import * as React from 'react';

import ColorControl from 'components/visualizations/common/controls/ColorControl';
import ControlsGroup from 'components/visualizations/common/controls/ControlsGroup';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import NumericDropdownControl from 'components/visualizations/common/controls/NumericDropdownControl';
import ToggleSwitchControl from 'components/visualizations/common/controls/ToggleSwitchControl';
import type HeaderGeneralTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/HeaderGeneralTheme';

type Props = {
  onThemeChange: HeaderGeneralTheme => void,
  theme: HeaderGeneralTheme,
};

function HeaderGeneralThemeControls({
  onThemeChange,
  theme,
}: Props): React.Node {
  // TODO(david): Just pass this down directly instead of having it in every controls section
  const onControlValueChange = (controlKey: string, value: mixed) => {
    const newTheme = theme.set(controlKey, value);
    onThemeChange(newTheme);
  };

  return (
    <Group.Vertical spacing="m">
      <ToggleSwitchControl
        controlKey="displayHeaderLine"
        label={I18N.text('Add header line')}
        onValueChange={onControlValueChange}
        value={theme.displayHeaderLine()}
      />
      {theme.displayHeaderLine() && (
        <ControlsGroup>
          <div className="table-themes-settings-tab__header-general-theme-controls">
            <NumericDropdownControl
              buttonWidth="100%"
              controlKey="headerLineThickness"
              label={I18N.textById('Line thickness')}
              maxValue={10}
              minValue={0}
              onValueChange={onControlValueChange}
              value={theme.headerLineThickness()}
            />
            <ColorControl
              controlKey="headerLineColor"
              enableNoColor
              label={I18N.text('Line color')}
              onValueChange={onControlValueChange}
              value={theme.headerLineColor()}
            />
          </div>
        </ControlsGroup>
      )}
    </Group.Vertical>
  );
}

export default (React.memo<Props>(
  HeaderGeneralThemeControls,
): React.AbstractComponent<Props>);
