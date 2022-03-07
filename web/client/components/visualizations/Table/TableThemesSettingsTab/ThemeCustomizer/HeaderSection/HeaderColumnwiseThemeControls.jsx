// @flow
import * as React from 'react';

import CheckboxControl from 'components/visualizations/common/controls/CheckboxControl';
import ColorControl from 'components/visualizations/common/controls/ColorControl';
import FontFamilyControl from 'components/visualizations/common/controls/FontFamilyControl';
import I18N from 'lib/I18N';
import NumericDropdownControl from 'components/visualizations/common/controls/NumericDropdownControl';
import Spacing from 'components/ui/Spacing';
import type HeaderColumnwiseTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/HeaderColumnwiseTheme';
import type { ThemeControlsProps } from 'components/visualizations/Table/TableThemesSettingsTab/types';

type Props = ThemeControlsProps<HeaderColumnwiseTheme>;

function HeaderThemeControls({
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
      <div className="table-themes-settings-tab__header-theme-controls">
        <FontFamilyControl
          buttonWidth="100%"
          controlKey="textFont"
          label={I18N.text('Text font')}
          onValueChange={onControlValueChange}
          value={theme.textFont()}
        />
        <NumericDropdownControl
          buttonWidth="100%"
          controlKey="textSize"
          label={I18N.text('Text size')}
          maxValue={24}
          minValue={6}
          onValueChange={onControlValueChange}
          value={theme.textSize()}
        />
        <ColorControl
          controlKey="textColor"
          enableNoColor={false}
          label={I18N.text('Text color')}
          onValueChange={onControlValueChange}
          value={theme.textColor()}
        />
        <CheckboxControl
          controlKey="boldText"
          label={I18N.text('Bold text')}
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
        <CheckboxControl
          controlKey="rotateHeader"
          label={I18N.text('Rotate header')}
          labelAfter={false}
          labelInline={false}
          onValueChange={onControlValueChange}
          value={theme.rotateHeader()}
        />
      </div>
    </React.Fragment>
  );
}

export default (React.memo<Props>(
  HeaderThemeControls,
): React.AbstractComponent<Props>);
