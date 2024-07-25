// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import User from 'services/models/User';
import type Resource from 'services/models/Resource';

type Props = {
  onForceDelete: () => void,
  onRequestClose: () => void,
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
      <Heading.Small>{I18N.textById('Dashboards')}</Heading.Small>
      <ul>{dashboardListItems}</ul>
    </div>
  );

  const alertItemsBlock = alertListItems.length > 0 && (
    <div>
      <Heading.Small>{I18N.textById('Alerts')}</Heading.Small>
      <ul>{alertListItems}</ul>
    </div>
  );

  return (
    <BaseModal
      onPrimaryAction={onSafeDelete}
      onRequestClose={onRequestClose}
      onSecondaryAction={onForceDelete}
      primaryButtonText={I18N.text('Transfer and Delete')}
      secondaryButtonIntent={BaseModal.Intents.DANGER}
      secondaryButtonText={I18N.text('Force Delete')}
      show={show}
      showPrimaryButton
      showSecondaryButton
      title={`${I18N.textById('Delete User')}: ${firstName} ${lastName}`}
    >
      <Group.Vertical>
        <p>{I18N.text('Take ownership of the following resources:')}</p>
        {dashboardItemsBlock}
        {alertItemsBlock}
      </Group.Vertical>
    </BaseModal>
  );
}
