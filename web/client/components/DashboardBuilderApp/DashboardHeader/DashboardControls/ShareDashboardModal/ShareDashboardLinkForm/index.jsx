// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import LabelWrapper from 'components/ui/LabelWrapper';
import ShareWithCurrentSettingsCheckbox from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/ShareDashboardModal/FormControls/ShareWithCurrentSettingsCheckbox';
import StaticSelectableTextbox from 'components/common/StaticSelectableTextbox';
import { noop } from 'util/util';

type Props = {
  linkToShare: string,
  shouldDisplayExtraSettings: boolean,

  isShareCurrentSettings?: boolean,
  onToggleShareCurrentSettings?: boolean => void,
};

export default function ShareDashboardLinkForm({
  linkToShare,
  shouldDisplayExtraSettings,
  isShareCurrentSettings = false,
  onToggleShareCurrentSettings = noop,
}: Props): React.Node {
  const maybeShareCurrentFilterCheckbox = shouldDisplayExtraSettings ? (
    <ShareWithCurrentSettingsCheckbox
      isShareCurrentSettings={isShareCurrentSettings}
      onToggleShareCurrentSettings={onToggleShareCurrentSettings}
    />
  ) : null;

  return (
    <Group.Vertical spacing="xxl">
      <LabelWrapper className="url-link-label" label={I18N.text('URL Link:')}>
        <StaticSelectableTextbox text={linkToShare} />
      </LabelWrapper>
      {maybeShareCurrentFilterCheckbox}
    </Group.Vertical>
  );
}
