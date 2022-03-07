// @flow
import * as React from 'react';

import AlertDefActionIcon from 'components/AlertsApp/AlertDefActionIcon';
import AlertsService from 'services/AlertsService';
import AuthorizationService from 'services/AuthorizationService';
import BaseModal from 'components/ui/BaseModal';
import ComposeAlertDefinitionModal from 'components/AlertsApp/ComposeAlertDefinitionModal';
import I18N from 'lib/I18N';
import NewAlertCreationButton from 'components/AlertsApp/NewAlertCreationButton';
import Table from 'components/ui/Table';
import Toaster from 'components/ui/Toaster';
import autobind from 'decorators/autobind';
import { DASHBOARD_PERMISSIONS } from 'services/AuthorizationService/registry';
import type AlertDefinition from 'models/AlertsApp/AlertDefinition';
import type {
  AuthPermission,
  ResourceType,
} from 'services/AuthorizationService/types';

const TABLE_HEADERS = [
  {
    id: 'name',
    displayContent: I18N.textById('Name'),
    searchable: alertDef => alertDef.title(),
  },
  {
    id: 'dimension',
    displayContent: I18N.text('Group By'),
    searchable: alertDef => alertDef.getReadableDimension(),
  },
  {
    id: 'filters',
    displayContent: I18N.textById('Filters'),
    searchable: alertDef => alertDef.getFiltersLabel(),
  },
  {
    id: 'timeGranularity',
    displayContent: I18N.text('Time Frequency'),
    headerClassName: 'alerts-app__table-frequency-header',
    searchable: alertDef => alertDef.getReadableGranularity(),
  },
  {
    id: 'createdBy',
    displayContent: I18N.text('Created by'),
    searchable: alertDef => alertDef.getUserFullName(),
  },
  { id: 'actions', displayContent: '' },
];

type DefaultProps = {
  deleteAlertDefinition: string => Promise<void>,
  isAuthorized: (
    AuthPermission,
    ResourceType,
    string | null,
  ) => Promise<boolean>,
};

type Props = {
  alertDefs: $ReadOnlyArray<AlertDefinition>,
  onAlertsDefsUpdated: () => void,
  ...DefaultProps,
};

type State = {
  alertToDelete: AlertDefinition | void,
  alertToEdit: AlertDefinition | void,
  canCreateAlert: boolean,
};

export default class AlertDefsTab extends React.Component<Props, State> {
  static defaultProps: DefaultProps = {
    deleteAlertDefinition: AlertsService.deleteAlertDefinition,
    isAuthorized: AuthorizationService.isAuthorized,
  };

  state: State = {
    alertToDelete: undefined,
    alertToEdit: undefined,
    canCreateAlert: false,
  };

  componentDidMount() {
    this.props
      .isAuthorized(DASHBOARD_PERMISSIONS.CREATE, 'ALERT', null)
      .then(canCreateAlert => this.setState({ canCreateAlert }));
  }

  @autobind
  onAlertsDefsUpdated() {
    this.props.onAlertsDefsUpdated();
    this.setState({ alertToDelete: undefined });
  }

  @autobind
  onEditIconClick(
    alertDef: AlertDefinition,
    event: SyntheticEvent<HTMLSpanElement>,
  ) {
    this.setState({ alertToEdit: alertDef });

    // The delete icon is inside the table row, so we need to stop the event
    // propagation, otherwise the click event will propagate up the tree and
    // trigger a row click
    event.stopPropagation();
  }

  @autobind
  onDeleteIconClick(
    alertDef: AlertDefinition,
    event: SyntheticEvent<HTMLSpanElement>,
  ) {
    this.setState({ alertToDelete: alertDef });

    // The delete icon is inside the table row, so we need to stop the event
    // propagation, otherwise the click event will propagate up the tree and
    // trigger a row click
    event.stopPropagation();
  }

  @autobind
  onRequestCloseModal() {
    this.setState({
      alertToDelete: undefined,
      alertToEdit: undefined,
    });
  }

  @autobind
  onDeleteModalPrimaryAction() {
    const { alertToDelete } = this.state;
    if (alertToDelete === undefined) {
      return;
    }
    analytics.track('Alert Definition deleted', {
      alertToDelete: alertToDelete.serialize(),
    });
    this.props.deleteAlertDefinition(alertToDelete.uri()).then(() => {
      Toaster.success(I18N.text('Successfully deleted alert'));

      // NOTE(toshi): Clearing on state.alertToDelete is done in onAlertsDefsUpdated()
      this.onAlertsDefsUpdated();
    });
  }

  maybeRenderDeleteAlertModal(): React.Node {
    if (!this.state.alertToDelete) {
      return null;
    }
    return (
      <BaseModal
        maxWidth={350}
        onRequestClose={this.onRequestCloseModal}
        onPrimaryAction={this.onDeleteModalPrimaryAction}
        primaryButtonIntent={BaseModal.Intents.DANGER}
        primaryButtonText={I18N.text('Delete Alert')}
        show
        title={I18N.text('Delete this alert?')}
      />
    );
  }

  maybeRenderEditModalBody(): React.Node {
    const { alertToEdit } = this.state;
    if (!alertToEdit) {
      return null;
    }

    return (
      <ComposeAlertDefinitionModal
        alertToEdit={alertToEdit}
        showModal
        onRequestClose={this.onRequestCloseModal}
        onAlertDefinitionPost={this.onAlertsDefsUpdated}
      />
    );
  }

  maybeRenderAlertCreateButton(): React.Node {
    const { canCreateAlert } = this.state;
    if (!canCreateAlert) {
      return null;
    }

    return (
      <NewAlertCreationButton
        onAlertDefinitionPost={this.onAlertsDefsUpdated}
      />
    );
  }

  @autobind
  renderSingleAlertDefRow(
    alertDef: AlertDefinition,
  ): React.Element<typeof Table.Row> {
    const alertDefUri = alertDef.uri();

    return (
      <Table.Row id={alertDefUri}>
        <Table.Cell>{alertDef.title()}</Table.Cell>
        <Table.Cell>{alertDef.getReadableDimension()}</Table.Cell>
        <Table.Cell>{alertDef.getFiltersLabel()}</Table.Cell>
        <Table.Cell>{alertDef.getReadableGranularity()}</Table.Cell>
        <Table.Cell>{alertDef.getUserFullName()}</Table.Cell>
        <Table.Cell className="alerts-app__definition-table-action-column">
          <AlertDefActionIcon
            alertDef={alertDef}
            mode={AlertDefActionIcon.Modes.EDIT}
            onClick={this.onEditIconClick}
          />
          <AlertDefActionIcon
            alertDef={alertDef}
            mode={AlertDefActionIcon.Modes.DELETE}
            onClick={this.onDeleteIconClick}
          />
        </Table.Cell>
      </Table.Row>
    );
  }

  renderAlertDefTable(): React.Node {
    return (
      <Table
        adjustWidthsToContent
        data={this.props.alertDefs}
        renderRow={this.renderSingleAlertDefRow}
        headers={TABLE_HEADERS}
        noDataText={I18N.text('There are no Alert Definitions')}
      />
    );
  }

  render(): React.Node {
    return (
      <div>
        {this.maybeRenderAlertCreateButton()}
        {this.renderAlertDefTable()}
        {this.maybeRenderDeleteAlertModal()}
        {this.maybeRenderEditModalBody()}
      </div>
    );
  }
}
