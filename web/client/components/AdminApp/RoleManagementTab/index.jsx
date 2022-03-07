// @flow
import * as React from 'react';

import AuthorizationService from 'services/AuthorizationService';
import Button from 'components/ui/Button';
import Group from 'components/ui/Group';
import InfoTooltip from 'components/ui/InfoTooltip';
import InputText from 'components/ui/InputText';
import InteractiveRoleCard from 'components/AdminApp/RoleManagementTab/InteractiveRoleCard';
import RoleViewModal from 'components/AdminApp/RoleViewModal';
import StringMatcher from 'lib/StringMatcher';
import autobind from 'decorators/autobind';
import {
  EMPTY_POLICY_MAP,
  disaggregateQueryPolicies,
} from 'components/AdminApp/disaggregateQueryPolicies';
import type RoleDefinition from 'services/models/RoleDefinition';
import type SecurityGroup from 'services/models/SecurityGroup';
import type User from 'services/models/User';
import type { DisaggregatedQueryPolicies } from 'components/AdminApp/disaggregateQueryPolicies';

const TEXT = t('admin_app.RoleManagement');

type State = {
  availablePoliciesMap: DisaggregatedQueryPolicies,
  roleToDisplay: RoleDefinition | void | null,
  searchText: string,
  searchTextResults: $ReadOnlyArray<RoleDefinition>,
};

type Props = {
  groups: $ReadOnlyArray<SecurityGroup>,
  loadRoles: () => void,
  loadUsers: () => void,
  roles: $ReadOnlyArray<RoleDefinition>,
  users: $ReadOnlyArray<User>,

  getQueryPolicies: typeof AuthorizationService.getQueryPolicies,
};

type DefaultProps = {
  getQueryPolicies: typeof AuthorizationService.getQueryPolicies,
};

export default class RoleManagementTab extends React.Component<Props, State> {
  _searchInputRef: $ElementRefObject<
    typeof InputText.Uncontrolled,
  > = React.createRef();

  static defaultProps: DefaultProps = {
    getQueryPolicies: AuthorizationService.getQueryPolicies,
  };

  state: State = {
    availablePoliciesMap: { ...EMPTY_POLICY_MAP },
    roleToDisplay: null,
    searchText: '',
    searchTextResults: [],
  };

  componentDidMount() {
    this.props.getQueryPolicies().then(policies => {
      const dimensionToPoliciesMap = disaggregateQueryPolicies(policies);
      this.setState({
        availablePoliciesMap: dimensionToPoliciesMap,
      });
    });
  }

  componentDidUpdate(prevProps: Props) {
    const { searchText } = this.state;
    if (searchText !== '' && this._searchInputRef.current) {
      this._searchInputRef.current.focus();
    }

    if (prevProps.roles !== this.props.roles) {
      this.setState({ searchTextResults: this.getSearchResults(searchText) });
    }
  }

  getCleanedRoleLabels(roleNameToExclude: string = ''): $ReadOnlyArray<string> {
    return this.props.roles
      .filter(role => role.name() !== roleNameToExclude)
      .map(role =>
        role
          .label()
          .trim()
          .toLowerCase(),
      );
  }

  @autobind
  getSearchResults(searchText: string): $ReadOnlyArray<RoleDefinition> {
    const { roles } = this.props;

    const searchTerms = searchText
      .split(' ')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    const matcher = new StringMatcher(searchTerms, false, true, 20000);
    return roles.filter(role => matcher.matchesAll(role.label()));
  }

  @autobind
  onRoleViewOpen(role?: RoleDefinition | void = undefined) {
    this.setState({ roleToDisplay: role });
  }

  @autobind
  onRoleViewClose() {
    this.setState({ roleToDisplay: null });
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

  maybeRenderRoleView(): React.Node {
    const { availablePoliciesMap, roleToDisplay } = this.state;
    return roleToDisplay !== null ? (
      <RoleViewModal
        availablePoliciesMap={availablePoliciesMap}
        onCloseModal={this.onRoleViewClose}
        role={roleToDisplay}
        roleLabels={this.getCleanedRoleLabels()}
        show={roleToDisplay !== null}
        updateRolesTab={this.props.loadRoles}
      />
    ) : null;
  }

  renderCreateRoleSection(): React.Node {
    return (
      <Group.Horizontal>
        <InfoTooltip text={TEXT.createTooltip} />
        <Button
          onClick={() => this.onRoleViewOpen()}
          testId="create-role-button"
        >
          {TEXT.createRole}
        </Button>
      </Group.Horizontal>
    );
  }

  renderRoleCards(): React.Node {
    const { searchText, searchTextResults } = this.state;
    const { groups, loadRoles, loadUsers, roles, users } = this.props;
    const searchResults = searchText === '' ? roles : searchTextResults;
    const roleArr = searchResults.map(role => (
      <InteractiveRoleCard
        key={role.name()}
        groups={groups}
        onRoleViewOpen={() => this.onRoleViewOpen(role)}
        role={role}
        updateRolesTab={loadRoles}
        updateUsersTab={loadUsers}
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
        {roleArr}
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
        id="role-tab__search-box"
      />
    );
  }

  render(): React.Node {
    return (
      <Group.Vertical spacing="l">
        <Group.Horizontal flex lastItemStyle={{ marginLeft: 'auto' }}>
          {this.renderSearchBar()}
          {this.renderCreateRoleSection()}
        </Group.Horizontal>
        {this.renderRoleCards()}
        {this.maybeRenderRoleView()}
      </Group.Vertical>
    );
  }
}
