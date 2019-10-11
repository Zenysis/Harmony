// @flow
import * as React from 'react';

import BootstrapSelect from 'components/bootstrap_select';
import ZenArray from 'util/ZenModel/ZenArray';
import { RESOURCE_TYPES } from 'services/AuthorizationService';
import { SITEWIDE_LABEL } from 'components/common/RoleSelect/constants';
import type {
  ResourceResponse,
  ResourceType,
} from 'services/AuthorizationService';

const TEXT = t('common.role_select.new_role_modal');

type Props = {
  onResourceUpdated: (SyntheticEvent<HTMLSelectElement>) => void,
  selectedResourceType: ResourceType | void,
  selectedResource: string | void,
  selectedRole: string | void,

  resources: ZenArray<ResourceResponse>,
  sitewideResourceLabel: string,
  title: string,
};

export default class ResourceDropdown extends React.PureComponent<Props> {
  static defaultProps = {
    resources: ZenArray.create<ResourceResponse>(),
    sitewideResourceLabel: SITEWIDE_LABEL,
    title: TEXT.select_resource_type,
  };

  render() {
    const {
      resources,
      sitewideResourceLabel,
      selectedRole,
      selectedResource,
      selectedResourceType,
    } = this.props;
    let options = resources.map(({ label, name }) => (
      <option key={name} value={name}>
        {label}
      </option>
    ));

    if (
      selectedResourceType !== RESOURCE_TYPES.SITE &&
      selectedResourceType !== RESOURCE_TYPES.QUERY_POLICY
    ) {
      options = options.push(
        <option key={null} value={sitewideResourceLabel}>
          {sitewideResourceLabel}
        </option>,
      );
    }

    const disabled = !selectedRole;
    const value =
      selectedResource === '' ? sitewideResourceLabel : selectedResource;

    return (
      <BootstrapSelect
        className="role-select-dropdown btn-group-xs input-medium row col-xs-2"
        data-selected-text-format="count"
        data-width="185px"
        title={this.props.title}
        data-live-search
        onChange={this.props.onResourceUpdated}
        value={value || ''}
        disabled={disabled}
        multiple={false}
      >
        {options}
      </BootstrapSelect>
    );
  }
}
