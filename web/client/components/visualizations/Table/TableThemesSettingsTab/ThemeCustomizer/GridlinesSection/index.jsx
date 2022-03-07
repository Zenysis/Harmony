// @flow
import * as React from 'react';

import ColorControl from 'components/visualizations/common/controls/ColorControl';
import ControlsGroup from 'components/visualizations/common/controls/ControlsGroup';
import I18N from 'lib/I18N';
import LabelWrapper from 'components/ui/LabelWrapper';
import NumericDropdownControl from 'components/visualizations/common/controls/NumericDropdownControl';
import type GridlinesTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/GridlinesTheme';

type Props = {
  onThemeChange: GridlinesTheme => void,
  theme: GridlinesTheme,
};

function GridlinesSection({ onThemeChange, theme }: Props): React.Node {
  // TODO(david): Just pass this down directly instead of having it in every controls section
  const onControlValueChange = (controlKey: string, value: mixed) => {
    const newTheme = theme.set(controlKey, value);
    onThemeChange(newTheme);
  };

  return (
    <LabelWrapper
      labelClassName="table-themes-settings-tab__controls-block-label"
      label="Horizontal gridlines"
    >
      <ControlsGroup>
        <div className="table-themes-settings-tab__gridlines-theme-controls">
          <NumericDropdownControl
            buttonWidth="100%"
            controlKey="thickness"
            label={I18N.text('Line thickness')}
            maxValue={10}
            minValue={0}
            onValueChange={onControlValueChange}
            value={theme.thickness()}
          />
          <ColorControl
            controlKey="color"
            enableNoColor
            label={I18N.text('Color')}
            onValueChange={onControlValueChange}
            value={theme.color()}
          />
        </div>
      </ControlsGroup>
    </LabelWrapper>
  );
}

export default (React.memo<Props>(
  GridlinesSection,
): React.AbstractComponent<Props>);
