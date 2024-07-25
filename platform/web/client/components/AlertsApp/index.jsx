// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';
import invariant from 'invariant';

import AlertDefsTab from 'components/AlertsApp/AlertDefsTab';
import AlertNotifsTab from 'components/AlertsApp/AlertNotifsTab';
import AlertsService from 'services/AlertsService';
import I18N from 'lib/I18N';
import Tab from 'components/ui/Tabs/Tab';
import Tabs from 'components/ui/Tabs';
import autobind from 'decorators/autobind';
import type AlertDefinition from 'models/AlertsApp/AlertDefinition';
import type AlertNotification from 'models/AlertsApp/AlertNotification';

type State = {
  alertDefs: $ReadOnlyArray<AlertDefinition>,
  alertNotifs: $ReadOnlyArray<AlertNotification>,
};

export default class AlertsApp extends React.Component<{}, State> {
  state: State = {
    alertDefs: [],
    alertNotifs: [],
  };

  static renderToDOM(elementId?: string = 'app') {
    const elt: ?HTMLElement = document.getElementById(elementId);
    invariant(elt, `Element ID does not exist: ${elementId}`);
    ReactDOM.render(<AlertsApp />, elt);
  }

  componentDidMount() {
    this.fetchAlerts();
  }

  @autobind
  fetchAlerts() {
    this.fetchAlertDefinitions();
    this.fetchAlertNotifications();
  }

  fetchAlertNotifications() {
    AlertsService.getLatestAlertNotifications().then(alertNotifs =>
      this.setState({ alertNotifs }),
    );
  }

  fetchAlertDefinitions() {
    AlertsService.getAlertDefinitions().then(alertDefs =>
      this.setState({ alertDefs }),
    );
  }

  renderAlertDefsTab(): React.Element<typeof Tab> {
    const { alertDefs } = this.state;

    return (
      <Tab className="alerts-app__tab" name={I18N.text('Alert Definitions')}>
        <AlertDefsTab
          alertDefs={alertDefs}
          onAlertsDefsUpdated={this.fetchAlerts}
        />
      </Tab>
    );
  }

  renderAlertNotifsTab(): React.Element<typeof Tab> {
    const { alertDefs, alertNotifs } = this.state;

    return (
      <Tab className="alerts-app__tab" name={I18N.text('Alert Notifications')}>
        <AlertNotifsTab alertDefs={alertDefs} alertNotifs={alertNotifs} />
      </Tab>
    );
  }

  render(): React.Element<'div'> {
    return (
      <div className="alerts-app" data-testid="alerts-app">
        <Tabs initialTab={I18N.textById('Alert Definitions')}>
          {this.renderAlertDefsTab()}
          {this.renderAlertNotifsTab()}
        </Tabs>
      </div>
    );
  }
}
