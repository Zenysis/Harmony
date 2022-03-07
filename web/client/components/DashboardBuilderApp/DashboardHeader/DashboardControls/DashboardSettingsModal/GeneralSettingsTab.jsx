// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import Button from 'components/ui/Button';
import Checkbox from 'components/ui/Checkbox';
import CloneDashboardButton from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/CloneDashboardButton';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import InputText from 'components/ui/InputText';
import Moment from 'models/core/wip/DateTime/Moment';
import RadioGroup from 'components/ui/RadioGroup';
import useBoolean from 'lib/hooks/useBoolean';
import type Dashboard from 'models/core/Dashboard';

type Props = {
  allowOfficialStatusChange: boolean,
  dashboard: Dashboard,
  onDashboardChange: Dashboard => void,
  onDeleteDashboard: () => void,
};

const TEXT = t('dashboard_builder.dashboard_settings');

// The date the modern dashboard experience launches and when users will no
// longer be building legacy dashboards.
const M1_LAUNCH_DATE = '2021-10-06';
const LEGACY_REMOVAL_DATE = '2021-12-01';

export default function GeneralSettingsTab({
  allowOfficialStatusChange,
  dashboard,
  onDashboardChange,
  onDeleteDashboard,
}: Props): React.Element<typeof Group.Vertical> {
  const [
    showDeleteDashboardModal,
    openDeleteDashboardModal,
    closeDeleteDashboardModal,
  ] = useBoolean(false);
  const onDeleteDashboardClick = React.useCallback(() => {
    onDeleteDashboard();
    closeDeleteDashboardModal();
  }, [closeDeleteDashboardModal, onDeleteDashboard]);

  const onOfficialStatusChange = React.useCallback(
    isOfficial => {
      if (allowOfficialStatusChange) {
        onDashboardChange(dashboard.isOfficial(isOfficial));
      }
    },
    [allowOfficialStatusChange, dashboard, onDashboardChange],
  );

  // HACK(stephen): If the user really wants to, we will let them view their
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

  // TODO(stephen,david): Update class names to use `gd-` prefix that is
  // standard for the GridDashboardApp.
  return (
    <Group.Vertical className="general-settings-tab" spacing="m">
      <Group.Vertical spacing="s">
        <Heading.Small underlined>
          {TEXT.settings_tab.title_section.heading}
        </Heading.Small>
        <InputText onChange={onTitleChange} value={title} />
      </Group.Vertical>
      {allowOfficialStatusChange && (
        <Group.Vertical spacing="s">
          <Heading.Small underlined>Grid Behavior</Heading.Small>
          <Checkbox
            label={TEXT.settings_tab.official_section.subtitle}
            labelPlacement="left"
            onChange={onOfficialStatusChange}
            testId="checkbox-official-mark-change"
            value={dashboard.isOfficial()}
          />
        </Group.Vertical>
      )}
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
        <Heading.Small underlined>{TEXT.delete_dashboard.title}</Heading.Small>
        <Button
          intent={Button.Intents.DANGER}
          onClick={openDeleteDashboardModal}
          testId="btn-delete-dashboard"
        >
          {TEXT.delete_dashboard.title}
        </Button>
      </Group.Vertical>
      <BaseModal
        onPrimaryAction={onDeleteDashboardClick}
        onRequestClose={closeDeleteDashboardModal}
        primaryButtonIntent="danger"
        show={showDeleteDashboardModal}
        title={TEXT.delete_dashboard.title}
        width="auto"
      >
        <p>{TEXT.delete_dashboard.warning_label}</p>
      </BaseModal>
    </Group.Vertical>
  );
}
