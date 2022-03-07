// @flow
import * as React from 'react';

import Checkbox from 'components/ui/Checkbox';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import InfoTooltip from 'components/ui/InfoTooltip';

type Props = {
  isShareCurrentSettings: boolean,
  onToggleShareCurrentSettings: boolean => void,
};

export default function ShareWithCurrentSettingsCheckbox({
  isShareCurrentSettings,
  onToggleShareCurrentSettings,
}: Props): React.Node {
  return (
    <Group.Horizontal spacing="xxxs">
      <Checkbox
        value={isShareCurrentSettings}
        label={I18N.text('Share with current filters')}
        onChange={onToggleShareCurrentSettings}
      />
      <InfoTooltip
        text={I18N.text(
          'Check this box to share this dashboard with the current dashboard wide filters and group bys',
        )}
      />
    </Group.Horizontal>
  );
}
