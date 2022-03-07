// @flow
import * as React from 'react';

import Card from 'components/ui/Card';
import Group from 'components/ui/Group';
import Icon from 'components/ui/Icon';
import RoleCardContents from 'components/AdminApp/RoleManagementTab/RoleCardContents';
import { IMMUTABLE_ROLES } from 'services/models/RoleDefinition';
import type RoleDefinition from 'services/models/RoleDefinition';

type Props = {
  role: RoleDefinition,
};

function StaticRoleCard({ role }: Props) {
  // NOTE(all): We treat the site admin card special
  const isImmutableCard = IMMUTABLE_ROLES.includes(role.name());
  const titleSection = isImmutableCard ? (
    <Group.Horizontal spacing="xs">
      <Icon className="admin-app-card__admin-icon" type="svg-star-in-circle" />
      {role.label()}
    </Group.Horizontal>
  ) : (
    role.label()
  );

  return (
    <Card className="admin-app-card" title={titleSection}>
      <RoleCardContents role={role} />
    </Card>
  );
}

export default (React.memo(StaticRoleCard): React.AbstractComponent<Props>);
