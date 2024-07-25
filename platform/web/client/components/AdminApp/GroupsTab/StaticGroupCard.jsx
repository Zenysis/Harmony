// @flow
import * as React from 'react';

import Card from 'components/ui/Card';
import GroupCardContents from 'components/AdminApp/GroupsTab/GroupCardContents';
import type SecurityGroup from 'services/models/SecurityGroup';

type Props = {
  group: SecurityGroup,
};

function StaticGroupCard({ group }: Props) {
  return (
    <Card className="admin-app-card" title={group.name()}>
      <GroupCardContents group={group} />
    </Card>
  );
}

export default (React.memo(StaticGroupCard): React.AbstractComponent<Props>);
