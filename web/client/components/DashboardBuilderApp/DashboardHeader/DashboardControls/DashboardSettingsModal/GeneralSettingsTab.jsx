// @flow
import * as React from 'react';

import AuthorizationResource from 'services/models/AuthorizationResource';
import BaseModal from 'components/ui/BaseModal';
import Button from 'components/ui/Button';
import Checkbox from 'components/ui/Checkbox';
import CloneDashboardButton from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/CloneDashboardButton';
import ConfigurationService, {
  CONFIGURATION_KEY,
} from 'services/ConfigurationService';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import InputText from 'components/ui/InputText';
import Moment from 'models/core/wip/DateTime/Moment';
import useBoolean from 'lib/hooks/useBoolean';
import type Dashboard from 'models/core/Dashboard';

type Props = {
  allowOfficialStatusChange: boolean,
  authorizationResource: AuthorizationResource,
  dashboard: Dashboard,
  onDashboardChange: Dashboard => void,
  onDeleteDashboard: () => void,
};

// The date the modern dashboard experience launches and when users will no
// longer be building legacy dashboards.
const M1_LAUNCH_DATE = '2021-10-06';
const LEGACY_REMOVAL_DATE = '2021-12-01';

export default function GeneralSettingsTab({
  allowOfficialStatusChange,
  authorizationResource,
  dashboard,
  onDashboardChange,
  onDeleteDashboard,
}: Props): React.Element<typeof Group.Vertical> {
  const sitewideAcl = authorizationResource.roles().sitewideResourceAcl();
  const isApplyToUnregistered = sitewideAcl.unregisteredResourceRole !== '';

  const { useState } = React;
  const [
    showDeleteDashboardModal,
    openDeleteDashboardModal,
    closeDeleteDashboardModal,
  ] = useBoolean(false);

  const onDeleteDashboardClick = React.useCallback(() => {
    onDeleteDashboard();
    closeDeleteDashboardModal();
  }, [closeDeleteDashboardModal, onDeleteDashboard]);

  const [publicAccessEnabled, setPublicAccessEnabled] = useState<boolean>(
    false,
  );

  React.useEffect(() => {
    ConfigurationService.getConfiguration(CONFIGURATION_KEY.PUBLIC_ACCESS).then(
      setting => {
        setPublicAccessEnabled(setting.value());
      },
    );
  }, [dashboard]);

  const onOfficialStatusChange = React.useCallback(
    isOfficial => {
      if (allowOfficialStatusChange) {
        onDashboardChange(dashboard.isOfficial(isOfficial));
      }
    },
    [allowOfficialStatusChange, dashboard, onDashboardChange],
  );

  const onRegisteredUsersDownloadPermissionsChange = React.useCallback(
    permissionStatus => {
      onDashboardChange(
        dashboard.registeredUsersCanDownloadData(permissionStatus),
      );
    },
    [dashboard, onDashboardChange],
  );

  const onUnregisteredUsersDownloadPermissionsChange = React.useCallback(
    permissionStatus => {
      if (publicAccessEnabled) {
        onDashboardChange(
          dashboard.unregisteredUsersCanDownloadData(permissionStatus),
        );
      }
    },
    [publicAccessEnabled, dashboard, onDashboardChange],
  );

  // NOTE: If the user really wants to, we will let them view their
  // legacy dashboard in a new tab. This only is possible when the user's
  // dashboard was created before the M1 launch date.
  const created = dashboard.created();
  const onOpenLegacyDashboard = React.useMemo(() => {
    // If today is after the legacy dashboard removal date, we don't need to
    // show the button anymore.
    if (Moment.utc().isAfter(Moment.utc(LEGACY_REMOVAL_DATE))) {
      return undefined;
    }

    if (!created.isBefore(Moment.utc(M1_LAUNCH_DATE))) {
      return undefined;
    }
    return () => {
      const url = `${document.location.pathname}?legacy=1`;
      window.open(url, '_blank');
    };
  }, [created]);

  const onTitleChange = React.useCallback(
    newTitle =>
      onDashboardChange(
        dashboard
          .deepUpdate()
          .specification()
          .dashboardOptions()
          .title(newTitle),
      ),
    [dashboard, onDashboardChange],
  );

  const title = dashboard
    .specification()
    .dashboardOptions()
    .title();

  // TODO: Update class names to use `gd-` prefix that is
  // standard for the GridDashboardApp.
  return (
    <Group.Vertical className="general-settings-tab" spacing="m">
      <Group.Vertical spacing="s">
        <Heading.Small underlined>{I18N.text('Title')}</Heading.Small>
        <InputText onChange={onTitleChange} value={title} />
      </Group.Vertical>
      {allowOfficialStatusChange && (
        <Group.Vertical spacing="s">
          <Heading.Small underlined>
            <I18N>Official Dashboard</I18N>
          </Heading.Small>
          <Checkbox
            label={I18N.text('Make Dashboard Official')}
            labelPlacement="right"
            onChange={onOfficialStatusChange}
            testId="checkbox-official-mark-change"
            value={dashboard.isOfficial()}
          />
        </Group.Vertical>
      )}
      <Group.Vertical spacing="s">
        <Heading.Small underlined>
          <I18N>Download Permissions</I18N>
        </Heading.Small>
        <Checkbox
          label={I18N.text(
            'Enable dashboard viewers to download analyses on this dashboard',
          )}
          labelPlacement="right"
          onChange={onRegisteredUsersDownloadPermissionsChange}
          testId="checkbox-dashboard-viewers-change"
          value={dashboard.registeredUsersCanDownloadData()}
        />
        {publicAccessEnabled && isApplyToUnregistered && (
          <Checkbox
            label={I18N.text(
              'Enable unregistered viewers to download analyses on this dashboard',
            )}
            labelPlacement="right"
            onChange={onUnregisteredUsersDownloadPermissionsChange}
            testId="checkbox-unregistered-dashboard-viewers-change"
            value={dashboard.unregisteredUsersCanDownloadData()}
          />
        )}
      </Group.Vertical>
      <CloneDashboardButton dashboardModel={dashboard} />
      {onOpenLegacyDashboard !== undefined && (
        <Group.Vertical spacing="s">
          <Heading.Small underlined>
            <I18N>Legacy dashboard</I18N>
          </Heading.Small>
          <Button onClick={onOpenLegacyDashboard} outline>
            <I18N>View legacy dashboard</I18N>
          </Button>
        </Group.Vertical>
      )}
      <Group.Vertical spacing="s">
        <Heading.Small underlined>
          {I18N.text('Delete Dashboard')}
        </Heading.Small>
        <Button
          intent={Button.Intents.DANGER}
          onClick={openDeleteDashboardModal}
          testId="btn-delete-dashboard"
        >
          {I18N.textById('Delete Dashboard')}
        </Button>
      </Group.Vertical>
      <BaseModal
        onPrimaryAction={onDeleteDashboardClick}
        onRequestClose={closeDeleteDashboardModal}
        primaryButtonIntent="danger"
        show={showDeleteDashboardModal}
        title={I18N.textById('Delete Dashboard')}
        width="auto"
      >
        <p>
          <I18N id="deleteDashboardWarning">
            Are you sure you wish to delete this entire dashboard permanently?
          </I18N>
        </p>
      </BaseModal>
    </Group.Vertical>
  );
}
