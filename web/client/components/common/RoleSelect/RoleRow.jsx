// @flow
import * as React from 'react';

import RemoveButtonCol from 'components/common/RemoveButtonCol';
import Table from 'components/ui/Table';
import { SITEWIDE_LABEL } from 'components/common/RoleSelect/constants';
import type Role from 'services/models/Role';
import type { ResourceType } from 'services/AuthorizationService';

type Props = {
  data: Role,
  onRemoveClick: Role => void,
  resourceName: string,
  resourceType: ResourceType,
  roleName: string,
  sitewideResourceLabel: string,
};

export default class RoleRow extends React.PureComponent<Props> {
  static defaultProps = {
    sitewideResourceLabel: SITEWIDE_LABEL,
  };

  render() {
    const {
      onRemoveClick,
      resourceName,
      resourceType,
      roleName,
      sitewideResourceLabel,
      data,
    } = this.props;
    const displayableResourceName = resourceName || sitewideResourceLabel;

    return [
      <Table.Cell key="resourceType">{resourceType}</Table.Cell>,
      <Table.Cell key="roleName">{roleName}</Table.Cell>,
      <Table.Cell key="displayableResourceName">
        {displayableResourceName}
      </Table.Cell>,
      <RemoveButtonCol
        key="removeButtonCol"
        columnId={data}
        onRemoveClick={onRemoveClick}
      />,
    ];
  }
}
