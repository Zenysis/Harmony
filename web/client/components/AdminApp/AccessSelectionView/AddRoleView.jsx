// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import BaseAccessSelectionView from 'components/AdminApp/AccessSelectionView/BaseAccessSelectionView';
import Checkbox from 'components/ui/Checkbox';
import InteractivePill from 'components/AdminApp/InteractivePill';
import Table from 'components/ui/Table';
import type RoleDefinition from 'services/models/RoleDefinition';

type Props = {
  enabledRoles: $ReadOnlyArray<RoleDefinition>,
  onClickSave: (roles: $ReadOnlyArray<RoleDefinition>) => void,
  onRequestClose: () => void,
  roleMemberCounts: {
    +[roleId: string]: number,
    ...,
  },
  roles: $ReadOnlyArray<RoleDefinition>,
  show: boolean,
};

const TEXT_PATH = 'admin_app.AccessSelectionView.AddRoleView';
const TEXT = t(TEXT_PATH);

const HEADERS = [
  { id: 'Checkbox', displayContent: '' },
  {
    id: 'name',
    displayContent: TEXT.name,
    searchable: d => d.label(),
    sortFn: Table.Sort.string(d => d.label()),
  },
  { id: 'memberCount', displayContent: TEXT.memberCount },
];

export default function AddRoleView({
  enabledRoles,
  onClickSave,
  onRequestClose,
  roleMemberCounts,
  roles,
  show,
}: Props): React.Element<typeof BaseAccessSelectionView> {
  const [selectedRoles, setSelectedRoles] = React.useState<
    $ReadOnlyArray<RoleDefinition>,
  >(enabledRoles);
  const [selectedRolesMap, setSelectedRolesMap] = React.useState(
    Zen.Map.create(),
  );
  const [checkAllRoles, setCheckAllRoles] = React.useState(false);

  // Creates a mapping of selected roles and a mapping between role name and
  // role member count.
  React.useEffect(() => {
    const enabledRoleNames = new Set(enabledRoles.map(role => role.name()));
    setSelectedRolesMap(
      roles.reduce(
        (map, role) => map.set(role.name(), enabledRoleNames.has(role.name())),
        Zen.Map.create(),
      ),
    );
    setSelectedRoles(enabledRoles);
  }, [roles, enabledRoles]);

  const onPrimaryAction = () => {
    onClickSave(selectedRoles);
    onRequestClose();
  };

  const onSelectCheckAllRoles = isSelected => {
    setSelectedRoles(isSelected ? roles : []);
    setSelectedRolesMap(prevSelectedRolesMap =>
      prevSelectedRolesMap.fill(isSelected),
    );
    setCheckAllRoles(isSelected);
  };

  const toggleCheckBox = (isSelected, role) => {
    setSelectedRoles(prevSelectedRoles =>
      isSelected
        ? [...prevSelectedRoles, role]
        : prevSelectedRoles.filter(r => r.name() !== role.name()),
    );
    setSelectedRolesMap(prevSelectedRolesMap =>
      prevSelectedRolesMap.set(role.name(), isSelected),
    );
  };

  const renderTableRow = role => {
    const totalMembers = t('totalMembers', {
      count: roleMemberCounts[role.name()] || 0,
      scope: TEXT_PATH,
    });
    return (
      <Table.Row id={role.name()}>
        <Table.Cell>
          <Checkbox
            className="access-selection-view__checkbox"
            value={selectedRolesMap.get(role.name()) || false}
            onChange={isSelected => toggleCheckBox(isSelected, role)}
          />
        </Table.Cell>
        <Table.Cell>
          <InteractivePill pillType="role" role={role} />
        </Table.Cell>
        <Table.Cell>{totalMembers}</Table.Cell>
      </Table.Row>
    );
  };

  return (
    <BaseAccessSelectionView
      checkAllValue={checkAllRoles}
      initialColumnToSort="name"
      onCheckAllChange={onSelectCheckAllRoles}
      onPrimaryAction={onPrimaryAction}
      onRequestClose={onRequestClose}
      renderTableRow={renderTableRow}
      sectionDescription={TEXT.description}
      sectionHeading={TEXT.addRoles}
      showModal={show}
      tableData={roles}
      tableHeaders={HEADERS}
    />
  );
}
