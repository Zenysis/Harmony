// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import BaseAccessSelectionView from 'components/AdminApp/AccessSelectionView/BaseAccessSelectionView';
import Checkbox from 'components/ui/Checkbox';
import InteractivePill from 'components/AdminApp/InteractivePill';
import Table from 'components/ui/Table';
import type SecurityGroup from 'services/models/SecurityGroup';

type Props = {
  allGroups: $ReadOnlyArray<SecurityGroup>,
  enabledGroups: $ReadOnlyArray<SecurityGroup>,
  onClickSave: (groups: $ReadOnlyArray<SecurityGroup>) => void,
  onRequestClose: () => void,
  show: boolean,
};

const TEXT_PATH = 'admin_app.AccessSelectionView.AddGroupView';
const TEXT = t(TEXT_PATH);

const HEADERS = [
  { id: 'checkbox', displayContent: '' },
  {
    id: 'name',
    displayContent: TEXT.groupName,
    searchable: d => d.name(),
    sortFn: Table.Sort.string(d => d.name()),
  },
  { id: 'memberCount', displayContent: TEXT.memberCount },
];

export default function AddGroupView({
  allGroups,
  enabledGroups,
  onClickSave,
  onRequestClose,
  show,
}: Props): React.Element<typeof BaseAccessSelectionView> {
  const [selectedGroups, setSelectedGroups] = React.useState<
    $ReadOnlyArray<SecurityGroup>,
  >(enabledGroups);
  const [selectedGroupsMap, setSelectedGroupsMap] = React.useState(
    Zen.Map.create<boolean>(),
  );
  const [checkAllGroups, setCheckAllGroups] = React.useState(false);

  // Creates a mapping of group name to whether they are selected
  React.useEffect(() => {
    const enabledGroupNames = new Set(enabledGroups.map(g => g.name()));
    setSelectedGroupsMap(
      allGroups.reduce(
        (map, group) =>
          map.set(group.name(), enabledGroupNames.has(group.name())),
        Zen.Map.create(),
      ),
    );
    setSelectedGroups(enabledGroups);
  }, [allGroups, enabledGroups]);

  const onPrimaryAction = () => {
    onClickSave(selectedGroups);
    onRequestClose();
  };

  const onSelectCheckAllGroups = isSelected => {
    setSelectedGroups(isSelected ? allGroups : []);
    setSelectedGroupsMap(prevSelectedGroupsMap =>
      prevSelectedGroupsMap.fill(isSelected),
    );
    setCheckAllGroups(isSelected);
  };

  const toggleCheckBox = (isSelected, group) => {
    setSelectedGroups(prevSelectedGroups =>
      isSelected
        ? [...prevSelectedGroups, group]
        : prevSelectedGroups.filter(g => g.name() !== group.name()),
    );
    setSelectedGroupsMap(prevSelectedGroupsMap =>
      prevSelectedGroupsMap.set(group.name(), isSelected),
    );
  };

  const renderTableRow = group => {
    const totalMembers = t('totalMembers', {
      count: group.users().size(),
      scope: TEXT_PATH,
    });
    return (
      <Table.Row id={group.name()}>
        <Table.Cell>
          <Checkbox
            className="access-selection-view__checkbox"
            value={selectedGroupsMap.get(group.name()) || false}
            onChange={isSelected => toggleCheckBox(isSelected, group)}
          />
        </Table.Cell>
        <Table.Cell>
          <InteractivePill pillType="group" group={group} />
        </Table.Cell>
        <Table.Cell>{totalMembers}</Table.Cell>
      </Table.Row>
    );
  };

  return (
    <BaseAccessSelectionView
      checkAllValue={checkAllGroups}
      initialColumnToSort="name"
      onCheckAllChange={onSelectCheckAllGroups}
      onPrimaryAction={onPrimaryAction}
      onRequestClose={onRequestClose}
      renderTableRow={renderTableRow}
      sectionDescription={TEXT.description}
      sectionHeading={TEXT.addGroups}
      showModal={show}
      tableData={allGroups}
      tableHeaders={HEADERS}
    />
  );
}
