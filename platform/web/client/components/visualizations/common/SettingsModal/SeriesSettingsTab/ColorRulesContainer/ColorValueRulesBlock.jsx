// @flow
import * as React from 'react';

import ColorBlock from 'components/ui/ColorBlock';
import Group from 'components/ui/Group';
import TransformedTextBlock from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/TransformedTextBlock';

export const COLOR_BLOCK_SIZE = 20;

type Props = {
  color: string,
  onColorChange: (color: string) => void,
  onTextValueChange: (textValue: string | void) => void,
  transformedText: string | void,
};

export default function ColorValueRulesBlock({
  color,
  onColorChange,
  onTextValueChange,
  transformedText,
}: Props): React.Node {
  return (
    <Group.Horizontal
      className="color-value-rules-block"
      marginRight="s"
      padding="s"
      spacing="s"
    >
      <div className="color-value-rules-block__border">
        <ColorBlock
          color={color}
          enableColorPicker
          onColorChange={c => onColorChange(c.hex)}
          onColorRemove={() => onColorChange('')}
          shape="circle"
          size={COLOR_BLOCK_SIZE}
          testId="color-rule-color-block"
        />
      </div>
      <div className="color-value-rules-block__divider" />
      <TransformedTextBlock
        onTextValueChange={onTextValueChange}
        transformedText={transformedText}
      />
    </Group.Horizontal>
  );
}
