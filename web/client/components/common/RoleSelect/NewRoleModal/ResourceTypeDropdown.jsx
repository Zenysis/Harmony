// @flow
import * as React from 'react';

import BootstrapSelect from 'components/bootstrap_select';
import ZenArray from 'util/ZenModel/ZenArray';
import type {
  ResourceType,
  ResourceTypeResponse,
} from 'services/AuthorizationService';

const TEXT = t('common.role_select.new_role_modal');

type Props = {
  onResourceTypeUpdated: (SyntheticEvent<HTMLSelectElement>) => void,

  resourceTypes: ZenArray<ResourceTypeResponse>,
  selectedResourceType: ResourceType | void,
  title: string,
};

export default class ResourceTypeDropdown extends React.PureComponent<Props> {
  static defaultProps = {
    resourceTypes: ZenArray.create<ResourceTypeResponse>(),
    selectedResourceType: undefined,
    title: TEXT.select_resource_type,
  };

  render() {
    const options = this.props.resourceTypes.map(resourceType => (
      <option key={resourceType.name} value={resourceType.name}>
        {resourceType.name}
      </option>
    ));

    return (
      <BootstrapSelect
        className="role-select-dropdown btn-group-xs input-medium row col-xs-2"
        data-selected-text-format="count"
        data-width="190px"
        title={this.props.title}
        data-live-search
        onChange={this.props.onResourceTypeUpdated}
        value={this.props.selectedResourceType || ''}
        multiple={false}
      >
        {options}
      </BootstrapSelect>
    );
  }
}
