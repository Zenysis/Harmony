// @flow
import * as React from 'react';

import Button from 'components/ui/Button';
import Group from 'components/ui/Group';
import GroupViewModal from 'components/AdminApp/GroupsTab/GroupViewModal';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import InfoTooltip from 'components/ui/InfoTooltip';
import InputText from 'components/ui/InputText';
import InteractiveGroupCard from 'components/AdminApp/GroupsTab/InteractiveGroupCard';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import Spacing from 'components/ui/Spacing';
import StringMatcher from 'lib/StringMatcher';
import type AlertDefinition from 'models/AlertsApp/AlertDefinition';
import type DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import type Resource from 'services/models/Resource';
import type RoleDefinition from 'services/models/RoleDefinition';
import type SecurityGroup from 'services/models/SecurityGroup';
import type User from 'services/models/User';

type Props = {
  alertDefinitions: $ReadOnlyArray<AlertDefinition>,
  alertResources: $ReadOnlyArray<Resource>,
  dashboards: $ReadOnlyArray<DashboardMeta>,
  groups: $ReadOnlyArray<SecurityGroup>,
  groupsLoaded: boolean,
  loadGroups: () => void,
  roleMemberCounts: {
    +[roleId: string]: number,
    ...,
  },
  roles: $ReadOnlyArray<RoleDefinition>,
  users: $ReadOnlyArray<User>,
};

export default function GroupsTab({
  alertDefinitions,
  alertResources,
  dashboards,
  groups,
  groupsLoaded,
  loadGroups,
  roleMemberCounts,
  roles,
  users,
}: Props): React.Node {
  const [
    groupToDisplay,
    setGroupToDisplay,
  ] = React.useState<SecurityGroup | void>(undefined);
  const [showGroupView, setShowGroupView] = React.useState<boolean>(false);
  const [searchText, setSearchText] = React.useState<string>('');
  const [searchTextResults, setSearchTextResults] = React.useState<
    $ReadOnlyArray<SecurityGroup>,
  >([]);

  React.useEffect(() => {
    function getSearchResults(value: string): $ReadOnlyArray<SecurityGroup> {
      const searchTerms = value
        .split(' ')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      const matcher = new StringMatcher(searchTerms, false, true, 20000);
      return groups.filter(group => matcher.matchesAll(group.name()));
    }
    setSearchTextResults(getSearchResults(searchText));
  }, [searchText, groups]);

  const getCleanedGroupNames = (
    groupNameToExclude: string = '',
  ): $ReadOnlyArray<string> => {
    return groups
      .filter(group => group.name() !== groupNameToExclude)
      .map(group =>
        group
          .name()
          .trim()
          .toLowerCase(),
      );
  };

  const onGroupViewOpen = (group?: SecurityGroup | void = undefined) => {
    setGroupToDisplay(group);
    setShowGroupView(true);
  };

  const onGroupViewClose = () => {
    setShowGroupView(false);
  };

  const maybeRenderGroupView = (): React.Node => {
    return showGroupView ? (
      <GroupViewModal
        alertDefinitions={alertDefinitions}
        alertResources={alertResources}
        dashboards={dashboards}
        group={groupToDisplay}
        groupNames={getCleanedGroupNames()}
        groups={groups}
        onGroupViewClose={onGroupViewClose}
        roleMemberCounts={roleMemberCounts}
        roles={roles}
        updateGroupsTab={loadGroups}
        users={users}
      />
    ) : null;
  };

  const renderCreateGroupSection = (): React.Node => {
    return (
      <Group.Horizontal>
        <InfoTooltip
          text={I18N.text(
            'Groups make it easy to manage the access rights for many users at a time. All users in a group will get access to all of the roles, dashboards and alerts that are assigned to the group.',
          )}
        />
        <Button onClick={() => onGroupViewOpen()} testId="create-group-button">
          {I18N.text('Create group')}
        </Button>
      </Group.Horizontal>
    );
  };

  const renderEmptyState = (): React.Node => {
    return (
      <div className="groups-tab-empty-state">
        <Group.Horizontal
          className="groups-tab-empty-state__content"
          flex
          spacing="xl"
        >
          <Icon
            className="groups-tab-empty-state__icon"
            type="svg-people-with-background"
          />
          <Group.Vertical spacing="none">
            <Heading.Large className="groups-tab-empty-state__title">
              {I18N.text('No groups yet')}
            </Heading.Large>
            <div className="groups-tab-empty-state__subtitle">
              {I18N.text('Seems like no one has created any groups')}
            </div>
            <div className="groups-tab-empty-state__description">
              {I18N.text(
                'Create your first group to efficiently manage access to platform resource for groups of users',
              )}
            </div>
            {renderCreateGroupSection()}
          </Group.Vertical>
        </Group.Horizontal>
      </div>
    );
  };

  const renderGroupCards = (): React.Node => {
    const searchResults = searchText === '' ? groups : searchTextResults;
    const groupCards = searchResults.map(group => (
      <InteractiveGroupCard
        key={group.name()}
        allGroups={groups}
        group={group}
        onGroupViewOpen={() => onGroupViewOpen(group)}
        updateGroupsTab={loadGroups}
        users={users}
      />
    ));

    // Setting flex to a very specific number such that the group card can
    // expand to 1000px.
    return (
      <Group.Horizontal
        flex
        itemStyle={{ flex: '0 1 49%', paddingBottom: '24px' }}
        justifyContent="space-between"
        spacing="none"
        style={{ flexWrap: 'wrap' }}
      >
        {groupCards}
      </Group.Horizontal>
    );
  };

  const renderSearchBar = (): React.Node => {
    return (
      <InputText.Uncontrolled
        debounce
        debounceTimeoutMs={300}
        icon="search"
        id="groups-tab__search-box"
        initialValue={searchText}
        onChange={setSearchText}
        placeholder={I18N.text('Search group by name')}
      />
    );
  };

  const content =
    groupsLoaded && groups.length === 0 ? (
      renderEmptyState()
    ) : (
      <Group.Vertical spacing="l">
        <Group.Horizontal flex lastItemStyle={{ marginLeft: 'auto' }}>
          {renderSearchBar()}
          {renderCreateGroupSection()}
        </Group.Horizontal>
        {renderGroupCards()}
      </Group.Vertical>
    );
  return groupsLoaded ? (
    <div>
      {maybeRenderGroupView()}
      {content}
    </div>
  ) : (
    <Spacing flex justifyContent="center">
      <LoadingSpinner />
    </Spacing>
  );
}
