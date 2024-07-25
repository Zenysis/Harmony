// @flow
import * as React from 'react';

import BatchPublishAction from 'components/FieldSetupApp/FieldSetupPageHeaderActions/BatchPublishAction';
import Group from 'components/ui/Group';
import InputText from 'components/ui/InputText';
import UpdateCalculationAction from 'components/FieldSetupApp/FieldSetupPageHeaderActions/UpdateCalculationAction';
import UpdateCategoryAction from 'components/FieldSetupApp/FieldSetupPageHeaderActions/UpdateCategoryAction';

type Props = {
  hierarchyRoot: $PropertyType<
    React.ElementConfig<typeof UpdateCategoryAction>,
    'hierarchyRoot',
  >,
  onSearchTextChange: (searchText: string) => void,
  searchText: string,
  selectedFieldIds: $ReadOnlySet<string>,
};

export default function FieldSetupPageHeaderActions({
  hierarchyRoot,
  onSearchTextChange,
  searchText,
  selectedFieldIds,
}: Props): React.Element<'div'> {
  const headerButtons = (
    <Group flex>
      <InputText
        icon="search"
        onChange={onSearchTextChange}
        placeholder="Search"
        value={searchText}
      />
      <BatchPublishAction />
    </Group>
  );

  const batchButtons = (
    <Group flex>
      <UpdateCalculationAction selectedFieldIds={selectedFieldIds} />
      <UpdateCategoryAction
        hierarchyRoot={hierarchyRoot}
        selectedFieldIds={selectedFieldIds}
      />
    </Group>
  );

  const className =
    selectedFieldIds.size > 0
      ? 'field-setup-page-header-actions__batch-buttons'
      : 'field-setup-page-header-actions__default-buttons';

  return (
    <div className={className}>
      {selectedFieldIds.size > 0 ? batchButtons : headerButtons}
    </div>
  );
}
