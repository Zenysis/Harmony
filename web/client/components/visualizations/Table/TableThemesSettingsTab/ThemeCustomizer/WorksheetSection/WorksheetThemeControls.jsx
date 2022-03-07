// @flow
import * as React from 'react';

import CheckboxControl from 'components/visualizations/common/controls/CheckboxControl';
import ColorControl from 'components/visualizations/common/controls/ColorControl';
import FontFamilyControl from 'components/visualizations/common/controls/FontFamilyControl';
import I18N from 'lib/I18N';
import NumericDropdownControl from 'components/visualizations/common/controls/NumericDropdownControl';
import Spacing from 'components/ui/Spacing';
import type WorksheetTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/WorksheetTheme';
import type { ThemeControlsProps } from 'components/visualizations/Table/TableThemesSettingsTab/types';

type Props = ThemeControlsProps<WorksheetTheme>;

function WorksheetThemeControls({
  onThemeChange,
  theme,
  header = '',
}: Props): React.Node {
  const onControlValueChange = (controlKey: string, value: mixed) => {
    onThemeChange(theme.set(controlKey, value));
  };

  return (
    <React.Fragment>
      {header !== '' && (
        <Spacing className="u-paragraph-text" marginBottom="m" flex>
          {header}
        </Spacing>
      )}
      <div className="table-themes-settings-tab__worksheet-theme-controls">
        <FontFamilyControl
          buttonWidth="100%"
          controlKey="textFont"
          label={I18N.textById('Text font')}
          onValueChange={onControlValueChange}
          value={theme.textFont()}
        />
        <NumericDropdownControl
          buttonWidth="100%"
          controlKey="textSize"
          label={I18N.textById('Text size')}
          maxValue={24}
          minValue={6}
          onValueChange={onControlValueChange}
          value={theme.textSize()}
        />
        <ColorControl
          controlKey="textColor"
          enableNoColor={false}
          label={I18N.textById('Text color')}
          onValueChange={onControlValueChange}
          value={theme.textColor()}
        />
        <CheckboxControl
          controlKey="boldText"
          label={I18N.textById('Bold text')}
          labelAfter={false}
          labelInline={false}
          onValueChange={onControlValueChange}
          value={theme.boldText()}
        />
        <ColorControl
          controlKey="backgroundColor"
          enableNoColor
          label={I18N.textById('Background color')}
          onValueChange={onControlValueChange}
          value={theme.backgroundColor()}
        />
      </div>
    </React.Fragment>
  );
}

export default (React.memo<Props>(
  WorksheetThemeControls,
): React.AbstractComponent<Props>);
