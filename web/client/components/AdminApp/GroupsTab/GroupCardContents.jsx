// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
// NOTE: There's no way to avoid this dependency cycle without duplicating
// code unfortunately.
// eslint-disable-next-line import/no-cycle
import InteractivePill from 'components/AdminApp/InteractivePill';
import LabelWrapper from 'components/ui/LabelWrapper';
import type SecurityGroup from 'services/models/SecurityGroup';

type Props = {
  group: SecurityGroup,
};

function GroupCardContents({
  group,
}: Props): React.Element<typeof Group.Vertical> {
  const renderRoles = () => {
    const rolePills = group.roles().mapValues((role, index) => (
      <div key={index}>
        <InteractivePill
          className="role-card__pill"
          pillType="role"
          role={role}
        />
      </div>
    ));
    const roleSection =
      rolePills.length === 0 ? (
        <div className="role-card__no-tools-text">
          {I18N.text('No roles added to this group')}
        </div>
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
        label={I18N.textById('Roles')}
        labelClassName="role-card__tool-section-label"
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
          {I18N.text('total members')}
        </Group.Horizontal>
        <Group.Horizontal spacing="xxs">
          <b>{numDashboards}</b>
          {I18N.text('dashboards')}
        </Group.Horizontal>
        <Group.Horizontal spacing="xxs">
          <b>{numAlerts}</b>
          {I18N.text('alerts')}
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
