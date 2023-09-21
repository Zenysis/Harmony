// @flow
import * as React from 'react';

import AuthorizationService from 'services/AuthorizationService';
import ConfigurationService, {
  CONFIGURATION_KEY,
} from 'services/ConfigurationService';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import LabelWrapper from 'components/ui/LabelWrapper';
import ShareWithCurrentSettingsCheckbox from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/ShareDashboardModal/FormControls/ShareWithCurrentSettingsCheckbox';
import StaticSelectableTextbox from 'components/common/StaticSelectableTextbox';
import Toaster from 'components/ui/Toaster';
import { cancelPromises } from 'util/promiseUtil';
import { noop } from 'util/util';
import type Dashboard from 'models/core/Dashboard';

type Props = {
  dashboard: Dashboard,
  iframeLinkToShare: string,
  isShareCurrentSettings?: boolean,
  linkToShare: string,
  onToggleShareCurrentSettings?: boolean => void,
  shouldDisplayExtraSettings: boolean,
};

export default function ShareDashboardLinkForm({
  dashboard,
  linkToShare,
  iframeLinkToShare,
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

  // define state for a public dashboard
  const [isPublicDashboard, setIsPublicDashboard] = React.useState(false);

  // set state
  React.useEffect(() => {
    const getAccessPromises = Promise.all([
      ConfigurationService.getConfiguration(CONFIGURATION_KEY.PUBLIC_ACCESS),
      AuthorizationService.getResourceWithRolesByUri(
        dashboard.authorizationUri(),
      ),
    ]).then(([setting, resource]) => {
      if (!resource || !resource.roles) {
        Toaster.error(I18N.text('Failed to get dashboard configuration.'));
        return;
      }

      const sitewideAcl = resource.roles().sitewideResourceAcl();
      const isApplyToUnregistered = sitewideAcl.unregisteredResourceRole !== '';

      setIsPublicDashboard(isApplyToUnregistered && setting.value());
    });
    cancelPromises(getAccessPromises);
  }, [dashboard]);

  return (
    <Group.Vertical spacing="xxl">
      <LabelWrapper className="url-link-label" label={I18N.text('URL Link:')}>
        <StaticSelectableTextbox text={linkToShare} />
      </LabelWrapper>

      {isPublicDashboard && iframeLinkToShare && (
        <LabelWrapper
          className="url-link-label"
          label={I18N.text('Iframe URL Link:')}
        >
          <StaticSelectableTextbox text={iframeLinkToShare} />
        </LabelWrapper>
      )}

      {maybeShareCurrentFilterCheckbox}
    </Group.Vertical>
  );
}
