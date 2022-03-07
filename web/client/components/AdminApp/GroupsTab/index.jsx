// @flow
import * as React from 'react';

import Button from 'components/ui/Button';
import Group from 'components/ui/Group';
import GroupViewModal from 'components/AdminApp/GroupsTab/GroupViewModal';
import Heading from 'components/ui/Heading';
import Icon from 'components/ui/Icon';
import InfoTooltip from 'components/ui/InfoTooltip';
import InputText from 'components/ui/InputText';
import InteractiveGroupCard from 'components/AdminApp/GroupsTab/InteractiveGroupCard';
import StringMatcher from 'lib/StringMatcher';
import autobind from 'decorators/autobind';
import type AlertDefinition from 'models/AlertsApp/AlertDefinition';
import type DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import type Resource from 'services/models/Resource';
import type RoleDefinition from 'services/models/RoleDefinition';
import type SecurityGroup from 'services/models/SecurityGroup';
import type User from 'services/models/User';

const TEXT = t('admin_app.GroupsTab');

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

type State = {
  groupToDisplay: SecurityGroup | void | null,
  searchText: string,
  searchTextResults: $ReadOnlyArray<SecurityGroup>,
};

export default class GroupsTab extends React.PureComponent<Props, State> {
  _searchInputRef: $ElementRefObject<
    typeof InputText.Uncontrolled,
  > = React.createRef();

  state: State = {
    groupToDisplay: null,
    searchText: '',
    searchTextResults: [],
  };

  componentDidUpdate(prevProps: Props) {
    const { searchText } = this.state;
    if (searchText !== '' && this._searchInputRef.current) {
      this._searchInputRef.current.focus();
    }

    if (prevProps.groups !== this.props.groups) {
      this.setState({ searchTextResults: this.getSearchResults(searchText) });
    }
  }

  getCleanedGroupNames(
    groupNameToExclude: string = '',
  ): $ReadOnlyArray<string> {
    return this.props.groups
      .filter(group => group.name() !== groupNameToExclude)
      .map(group =>
        group
          .name()
          .trim()
          .toLowerCase(),
      );
  }

  @autobind
  getSearchResults(searchText: string): $ReadOnlyArray<SecurityGroup> {
    const { groups } = this.props;

    const searchTerms = searchText
      .split(' ')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    const matcher = new StringMatcher(searchTerms, false, true, 20000);
    return groups.filter(group => matcher.matchesAll(group.name()));
  }

  @autobind
  onGroupViewOpen(group?: SecurityGroup | void = undefined) {
    this.setState({ groupToDisplay: group });
  }

  @autobind
  onGroupViewClose() {
    this.setState({ groupToDisplay: null });
  }

  @autobind
  onSearchTextChange(searchText: string) {
    this.setState(() => {
      if (searchText === '') {
        return { searchText };
      }
      return {
        searchText,
        searchTextResults: this.getSearchResults(searchText),
      };
    });
  }

  maybeRenderGroupView(): React.Node {
    const { groupToDisplay } = this.state;
    const {
      alertDefinitions,
      alertResources,
      dashboards,
      groups,
      loadGroups,
      roleMemberCounts,
      roles,
      users,
    } = this.props;
    return groupToDisplay !== null ? (
      <GroupViewModal
        alertDefinitions={alertDefinitions}
        alertResources={alertResources}
        dashboards={dashboards}
        group={groupToDisplay}
        groupNames={this.getCleanedGroupNames()}
        groups={groups}
        onGroupViewClose={this.onGroupViewClose}
        roles={roles}
        roleMemberCounts={roleMemberCounts}
        updateGroupsTab={loadGroups}
        users={users}
      />
    ) : null;
  }

  renderCreateGroupSection(): React.Node {
    return (
      <Group.Horizontal>
        <InfoTooltip text={TEXT.createTooltip} />
        <Button
          onClick={() => this.onGroupViewOpen()}
          testId="create-group-button"
        >
          {TEXT.createGroup}
        </Button>
      </Group.Horizontal>
    );
  }

  renderEmptyState(): React.Node {
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
              {TEXT.emptyStateTitle}
            </Heading.Large>
            <div className="groups-tab-empty-state__subtitle">
              {TEXT.emptyStateSubtitle}
            </div>
            <div className="groups-tab-empty-state__description">
              {TEXT.emptyStateDescription}
            </div>
            {this.renderCreateGroupSection()}
          </Group.Vertical>
        </Group.Horizontal>
      </div>
    );
  }

  renderGroupCards(): React.Node {
    const { searchText, searchTextResults } = this.state;
    const { groups, loadGroups, users } = this.props;
    const searchResults = searchText === '' ? groups : searchTextResults;
    const groupCards = searchResults.map(group => (
      <InteractiveGroupCard
        key={group.name()}
        allGroups={groups}
        group={group}
        onGroupViewOpen={() => this.onGroupViewOpen(group)}
        updateGroupsTab={loadGroups}
        users={users}
      />
    ));

    // Setting flex to a very specific number such that the group card can
    // expand to 1000px.
    return (
      <Group.Horizontal
        flex
        itemStyle={{ paddingBottom: '24px', flex: '0 1 49%' }}
        justifyContent="space-between"
        spacing="none"
        style={{ flexWrap: 'wrap' }}
      >
        {groupCards}
      </Group.Horizontal>
    );
  }

  renderSearchBar(): React.Node {
    const { searchText } = this.state;
    return (
      <InputText.Uncontrolled
        debounce
        debounceTimeoutMs={300}
        icon="search"
        initialValue={searchText}
        onChange={this.onSearchTextChange}
        placeholder={TEXT.searchPlaceholder}
        ref={this._searchInputRef}
        id="groups-tab__search-box"
      />
    );
  }

  render(): React.Element<'div'> {
    const { groups, groupsLoaded } = this.props;
    const content =
      groupsLoaded && groups.length === 0 ? (
        this.renderEmptyState()
      ) : (
        <Group.Vertical spacing="l">
          <Group.Horizontal flex lastItemStyle={{ marginLeft: 'auto' }}>
            {this.renderSearchBar()}
            {this.renderCreateGroupSection()}
          </Group.Horizontal>
          {this.renderGroupCards()}
        </Group.Vertical>
      );
    return (
      <div>
        {this.maybeRenderGroupView()}
        {content}
      </div>
    );
  }
}
