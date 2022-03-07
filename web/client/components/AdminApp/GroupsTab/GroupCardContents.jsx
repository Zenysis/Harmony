// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
// NOTE(yitian): There's no way to avoid this dependency cycle without duplicating
// code unfortunately.
// eslint-disable-next-line import/no-cycle
import InteractivePill from 'components/AdminApp/InteractivePill';
import LabelWrapper from 'components/ui/LabelWrapper';
import type SecurityGroup from 'services/models/SecurityGroup';

type Props = {
  group: SecurityGroup,
};

const TEXT = t('admin_app.GroupCard');

function GroupCardContents({
  group,
}: Props): React.Element<typeof Group.Vertical> {
  const renderRoles = () => {
    const rolePills = group.roles().mapValues((role, index) => (
      <div key={index}>
        <InteractivePill
          className="role-card__pill"
          role={role}
          pillType="role"
        />
      </div>
    ));
    const roleSection =
      rolePills.length === 0 ? (
        <div className="role-card__no-tools-text">{TEXT.noRoles}</div>
      ) : (
        <Group.Horizontal
          className="role-card__tool-section-content"
          flex
          spacing="xxs"
        >
          {rolePills}
        </Group.Horizontal>
      );
    return (
      <LabelWrapper
        labelClassName="role-card__tool-section-label"
        label={TEXT.roles}
      >
        {roleSection}
      </LabelWrapper>
    );
  };

  const renderGroupStats = () => {
    const numUsers = group.users().size();
    const acls = group.acls();
    const numDashboards = acls
      .filter(acl => {
        const resource = acl.resource();
        return (
          resource !== undefined && resource.resourceType() === 'DASHBOARD'
        );
      })
      .size();
    const numAlerts = acls
      .filter(acl => {
        const resource = acl.resource();
        return resource !== undefined && resource.resourceType() === 'ALERT';
      })
      .size();
    return (
      <Group.Horizontal>
        <Group.Horizontal spacing="xxs">
          <b>{numUsers}</b>
          {TEXT.totalMembers}
        </Group.Horizontal>
        <Group.Horizontal spacing="xxs">
          <b>{numDashboards}</b>
          {TEXT.dashboards}
        </Group.Horizontal>
        <Group.Horizontal spacing="xxs">
          <b>{numAlerts}</b>
          {TEXT.alerts}
        </Group.Horizontal>
      </Group.Horizontal>
    );
  };

  return (
    <Group.Vertical spacing="l">
      {renderRoles()}
      {renderGroupStats()}
    </Group.Vertical>
  );
}

export default (React.memo(GroupCardContents): React.AbstractComponent<Props>);
