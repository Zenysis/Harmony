// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import InfoTooltip from 'components/ui/InfoTooltip';
import ToggleSwitch from 'components/ui/ToggleSwitch';

type Props = {
  hideUnsupportedItems: boolean | void,
  onToggleChange: (() => void) | void,
};

export default function UnsupportedDimensionsToggle({
  hideUnsupportedItems,
  onToggleChange,
}: Props): React.Node {
  if (hideUnsupportedItems === undefined || onToggleChange === undefined) {
    return null;
  }

  return (
    <Group.Horizontal alignItems="center" paddingRight="xs" spacing="none">
      <ToggleSwitch
        displayLabels="right"
        label={I18N.text('Hide unsupported dimensions')}
        onChange={onToggleChange}
        value={hideUnsupportedItems}
      />
      <InfoTooltip
        text={I18N.text(
          'This feature automatically removes dimensions that are not compatible with the selected indicators in your query, streamlining your selection process and ensuring results with data.',
        )}
      />
    </Group.Horizontal>
  );
}
