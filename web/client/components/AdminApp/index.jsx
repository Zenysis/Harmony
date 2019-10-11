// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';
import invariant from 'invariant';

import ConfigurationTab from 'components/AdminApp/ConfigurationTab';
import GroupsTab from 'components/AdminApp/GroupsTab';
import Tab from 'components/ui/Tabs/Tab';
import Tabs from 'components/ui/Tabs';
import UsersTab from 'components/AdminApp/UsersTab';
import { autobind } from 'decorators';

const TEXT = t('admin_app');

const TAB_NAMES: { [key: string]: string } = {
  USERS_TAB: TEXT.tabs.users_tab,
  CONFIG_TAB: TEXT.tabs.config_tab,
  GROUPS_TAB: TEXT.tabs.groups_tab,
};

type State = {
  activeTab: string,
};

type Props = {
  initialTab: string,
};

export default class AdminApp extends React.PureComponent<Props, State> {
  static defaultProps = {
    initialTab: TAB_NAMES.USERS_TAB,
  };

  state = {
    activeTab: this.props.initialTab,
  };

  static renderToDOM(elementId: string = 'app') {
    const element: ?HTMLElement = document.getElementById(elementId);
    invariant(element, `Element ID does not exist: ${elementId}`);
    ReactDOM.render(<AdminApp />, element);
  }

  @autobind
  updateActiveTab(activeTab: string) {
    this.setState({ activeTab });
  }

  renderGroupsTab() {
    const isActiveTab: boolean = this.state.activeTab === TAB_NAMES.GROUPS_TAB;
    return (
      <Tab className="admin-app__tab" name={TAB_NAMES.GROUPS_TAB}>
        <GroupsTab isActiveTab={isActiveTab} />
      </Tab>
    );
  }

  renderUsersTab() {
    const isActiveTab: boolean = this.state.activeTab === TAB_NAMES.USERS_TAB;
    return (
      <Tab className="admin-app__tab" name={TAB_NAMES.USERS_TAB}>
        <UsersTab isActiveTab={isActiveTab} />
      </Tab>
    );
  }

  renderConfigurationTab() {
    const isActiveTab: boolean = this.state.activeTab === TAB_NAMES.CONFIG_TAB;
    return (
      <Tab className="admin-app__tab" name={TAB_NAMES.CONFIG_TAB}>
        <ConfigurationTab isActiveTab={isActiveTab} />
      </Tab>
    );
  }

  render() {
    const { activeTab } = this.state;
    return (
      <div className="admin-app">
        <Tabs initialTab={activeTab} onTabChange={this.updateActiveTab}>
          {this.renderUsersTab()}
          {this.renderGroupsTab()}
          {this.renderConfigurationTab()}
        </Tabs>
      </div>
    );
  }
}
