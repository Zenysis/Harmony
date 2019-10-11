// @flow
import * as React from 'react';

import AlertDefinition from 'models/AlertsApp/AlertDefinition';
import AlertMessage, { ALERT_TYPE } from 'components/common/AlertMessage';
import BaseModal from 'components/ui/BaseModal';
import DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import User from 'services/models/User';
import ZenArray from 'util/ZenModel/ZenArray';

const TEXT = t('admin_app.deleteUserModal');
const TITLE = TEXT.title;
const DELETE = TEXT.deleteWithoutTransfer;
const TRANSFER_AND_DELETE = TEXT.deleteWithTransfer;
const ALERT_DESCRIPTION = TEXT.alertDescription;
const DASHBOARD_DESCRIPTION = TEXT.dashboardDescription;

type Props = {
  onRequestClose: () => void,
  onForceDelete: () => void,
  onSafeDelete: () => void,
  show: boolean,
  user: User,

  userAlerts: ZenArray<AlertDefinition>,
  userDashboards: ZenArray<DashboardMeta>,
};

const defaultProps = {
  userAlerts: ZenArray.create(),
  userDashboards: ZenArray.create(),
};

export default function DeleteUserModal(props: Props) {
  const {
    onForceDelete,
    onRequestClose,
    onSafeDelete,
    show,
    user,
    userAlerts,
    userDashboards,
  } = props;

  const dashboardListItems = userDashboards.map((dashboard: DashboardMeta) => {
    const key = dashboard.uri();
    const label = `${dashboard.title()} - (URL: ${dashboard.slug()})`;
    return <li key={key}>{label}</li>;
  });

  const alertListItems = userAlerts.map((alertDef: AlertDefinition) => {
    const key = alertDef.uri();
    const fieldName = alertDef.getReadableField();
    const dimensionName = alertDef.dimensionName();
    const text = `${fieldName} - ${dimensionName}`;
    return <li key={key}>{text}</li>;
  });

  const { firstName, lastName } = user.modelValues();

  return (
    <BaseModal
      title={`${TITLE}: ${firstName} ${lastName}`}
      show={show}
      onRequestClose={onRequestClose}
      onPrimaryAction={onSafeDelete}
      primaryButtonText={TRANSFER_AND_DELETE}
      onSecondaryAction={onForceDelete}
      secondaryButtonText={DELETE}
      secondaryButtonIntent={BaseModal.Intents.DANGER}
      height={200}
      showPrimaryButton
      showSecondaryButton
    >
      <AlertMessage type={ALERT_TYPE.WARNING}>
        {DASHBOARD_DESCRIPTION}
      </AlertMessage>
      <ul>{dashboardListItems}</ul>

      <AlertMessage type={ALERT_TYPE.WARNING}>{ALERT_DESCRIPTION}</AlertMessage>
      <ul>{alertListItems}</ul>
    </BaseModal>
  );
}

DeleteUserModal.defaultProps = defaultProps;
