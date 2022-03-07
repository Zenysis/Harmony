// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import User from 'services/models/User';
import type Resource from 'services/models/Resource';

const TEXT = t('admin_app.deleteUserModal');

type Props = {
  onRequestClose: () => void,
  onForceDelete: () => void,
  onSafeDelete: () => void,
  show: boolean,
  user: User,

  userAlertResources: $ReadOnlyArray<Resource>,
  userDashboardResources: $ReadOnlyArray<Resource>,
};

export default function DeleteUserModal({
  onForceDelete,
  onRequestClose,
  onSafeDelete,
  show,
  user,
  userAlertResources = [],
  userDashboardResources = [],
}: Props): React.Element<typeof BaseModal> {
  const dashboardListItems = userDashboardResources.map(dashboardResource => {
    const key = dashboardResource.uri();
    const label = dashboardResource.label();
    return (
      <li key={key}>
        <p>{label}</p>
      </li>
    );
  });

  const alertListItems = userAlertResources.map(alertResource => {
    const key = alertResource.uri();
    const label = alertResource.label();
    return (
      <li key={key}>
        <p>{label}</p>
      </li>
    );
  });

  const { firstName, lastName } = user.modelValues();

  const dashboardItemsBlock = dashboardListItems.length > 0 && (
    <div>
      <Heading.Small>{TEXT.dashboards}</Heading.Small>
      <ul>{dashboardListItems}</ul>
    </div>
  );

  const alertItemsBlock = alertListItems.length > 0 && (
    <div>
      <Heading.Small>{TEXT.alerts}</Heading.Small>
      <ul>{alertListItems}</ul>
    </div>
  );

  return (
    <BaseModal
      title={`${TEXT.title}: ${firstName} ${lastName}`}
      show={show}
      onRequestClose={onRequestClose}
      onPrimaryAction={onSafeDelete}
      primaryButtonText={TEXT.deleteWithTransfer}
      onSecondaryAction={onForceDelete}
      secondaryButtonText={TEXT.deleteWithoutTransfer}
      secondaryButtonIntent={BaseModal.Intents.DANGER}
      showPrimaryButton
      showSecondaryButton
    >
      <Group.Vertical>
        <p>{TEXT.takeOwnershipMessage}</p>
        {dashboardItemsBlock}
        {alertItemsBlock}
      </Group.Vertical>
    </BaseModal>
  );
}
