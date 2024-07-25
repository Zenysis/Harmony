// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import LabelWrapper from 'components/ui/LabelWrapper';
import QueryPolicy from 'services/models/QueryPolicy';
import RadioGroup from 'components/ui/RadioGroup';
import useDatasourceLookup from 'components/common/useDatasourceLookup';
import { SOURCE_NAME } from 'services/models/QueryPolicy/constants';
import { getFullDimensionName } from 'models/core/wip/Dimension';

type Props = {
  availablePolicies: $ReadOnlyArray<QueryPolicy>,
  dimensionName: string,
  isAllSelected: boolean,
  onRadioSelect: (dimensionName: string, newValue: boolean) => void,
  onSinglePolicySelect: (
    dimensionName: string,
    newValues: $ReadOnlyArray<string>,
  ) => void,
  selectedPolicies: $ReadOnlyArray<string>,
};

const ALL_RADIO_VALUE = 'all';
const SPECIFIC_RADIO_VALUE = 'specific';

export default function QueryPolicySelector({
  availablePolicies,
  dimensionName,
  isAllSelected,
  onRadioSelect,
  onSinglePolicySelect,
  selectedPolicies,
}: Props): React.Element<typeof LabelWrapper> {
  const datasourceLookup = useDatasourceLookup();

  const optionNames = availablePolicies
    .map(policy => ({
      key: policy.uri(),
      name:
        dimensionName === SOURCE_NAME
          ? datasourceLookup(policy.dimensionValue() || '')
          : policy.dimensionValue() || '',
    }))
    // Sort by the display name
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(({ key, name }) => (
      <Dropdown.Option key={key} value={key}>
        {name}
      </Dropdown.Option>
    ));

  const onSinglePolicyClick = (newValues: $ReadOnlyArray<string>) => {
    onSinglePolicySelect(dimensionName, newValues);
  };

  const dropdown = isAllSelected ? null : (
    // Hard coded margin to align with text above dropdown.
    <Group.Item style={{ marginLeft: '21px' }}>
      <Dropdown.Multiselect
        defaultDisplayContent={I18N.textById('0 selected')}
        onSelectionChange={onSinglePolicyClick}
        value={selectedPolicies}
      >
        {optionNames}
      </Dropdown.Multiselect>
    </Group.Item>
  );

  const onRadioClick = (newRadioValue: string) => {
    onRadioSelect(dimensionName, newRadioValue === ALL_RADIO_VALUE);
  };

  // NOTE: This is attempting to pluralize dimension names by just sticking
  // an 's' on the end, which has mixed success. Union Council -> Union Councils
  // works, but Country -> Countrys does not.
  const dimensionText =
    dimensionName === SOURCE_NAME
      ? I18N.text('data sources')
      : `${getFullDimensionName(dimensionName).toLowerCase()}s`;

  const label = I18N.text('Select %(dimensionText)s', { dimensionText });
  const allValuesRadioLabel = I18N.text(
    'Allow access to all %(dimensionText)s',
    { dimensionText },
  );
  const specificValueRadioLabel = I18N.text(
    'Select specific %(dimensionText)s',
    { dimensionText },
  );

  return (
    <LabelWrapper
      className="create-role-modal__data-access-label"
      label={label}
    >
      <RadioGroup
        direction="vertical"
        onChange={onRadioClick}
        value={isAllSelected ? ALL_RADIO_VALUE : SPECIFIC_RADIO_VALUE}
      >
        <RadioGroup.Item
          testId={`${dimensionName}-all-radio-button`}
          value={ALL_RADIO_VALUE}
        >
          {allValuesRadioLabel}
        </RadioGroup.Item>
        <RadioGroup.Item
          testId={`${dimensionName}-specific-radio-button`}
          value={SPECIFIC_RADIO_VALUE}
        >
          {specificValueRadioLabel}
        </RadioGroup.Item>
      </RadioGroup>
      {dropdown}
    </LabelWrapper>
  );
}
