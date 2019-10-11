// @flow
import * as React from 'react';

import BootstrapSelect from 'components/bootstrap_select';
import ZenArray from 'util/ZenModel/ZenArray';
import type RoleDefinition from 'services/models/RoleDefinition';
import type { ResourceType } from 'services/AuthorizationService';

const TEXT = t('common.role_select.new_role_modal');

type Props = {
  onRoleUpdated: (SyntheticEvent<HTMLSelectElement>) => void,

  roles: ZenArray<RoleDefinition>,
  selectedResourceType: ResourceType | void,
  selectedRole: string | void,
  title: string,
};

export default class RoleDropdown extends React.PureComponent<Props> {
  static defaultProps = {
    roles: ZenArray.create<RoleDefinition>(),
    selectedResourceType: undefined,
    selectedRole: undefined,
    title: TEXT.select_role,
  };

  render() {
    const options = this.props.roles.map(role => (
      <option key={role.name()} value={role.name()}>
        {role.label()}
      </option>
    ));

    const disabled = !this.props.selectedResourceType;

    return (
      <BootstrapSelect
        className="role-select-dropdown btn-group-xs input-medium row col-xs-2"
        data-selected-text-format="count"
        data-width="190px"
        title={this.props.title}
        data-live-search
        onChange={this.props.onRoleUpdated}
        value={this.props.selectedRole || ''}
        disabled={disabled}
        multiple={false}
      >
        {options}
      </BootstrapSelect>
    );
  }
}
