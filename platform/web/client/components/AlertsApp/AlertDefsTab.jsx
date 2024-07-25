// @flow
import * as React from 'react';

import AlertDefActionIcon, {
  Modes,
} from 'components/AlertsApp/AlertDefActionIcon';
import AlertsService from 'services/AlertsService';
import AuthorizationService from 'services/AuthorizationService';
import BaseModal from 'components/ui/BaseModal';
import ComposeAlertDefinitionModal from 'components/AlertsApp/ComposeAlertDefinitionModal';
import I18N from 'lib/I18N';
import NewAlertCreationButton from 'components/AlertsApp/NewAlertCreationButton';
import Table from 'components/ui/Table';
import Toaster from 'components/ui/Toaster';
import { DASHBOARD_PERMISSIONS } from 'services/AuthorizationService/registry';
import type AlertDefinition from 'models/AlertsApp/AlertDefinition';

const TABLE_HEADERS = [
  {
    displayContent: I18N.textById('Name'),
    id: 'name',
    searchable: alertDef => alertDef.title(),
  },
  {
    displayContent: I18N.text('Group By'),
    id: 'dimension',
    searchable: alertDef => alertDef.getReadableDimension(),
  },
  {
    displayContent: I18N.textById('Filters'),
    id: 'filters',
    searchable: alertDef => alertDef.getFiltersLabel(),
  },
  {
    displayContent: I18N.text('Time Frequency'),
    headerClassName: 'alerts-app__table-frequency-header',
    id: 'timeGranularity',
    searchable: alertDef => alertDef.getReadableGranularity(),
  },
  {
    displayContent: I18N.text('Created by'),
    id: 'createdBy',
    searchable: alertDef => alertDef.getUserFullName(),
  },
  { displayContent: '', id: 'actions' },
];

type Props = {
  alertDefs: $ReadOnlyArray<AlertDefinition>,
  onAlertsDefsUpdated: () => void,
};

export default function AlertDefsTab(props: Props): React.Node {
  const { alertDefs } = props;

  const [
    alertToDelete,
    setAlertToDelete,
  ] = React.useState<AlertDefinition | void>();
  const [
    alertToEdit,
    setAlertToEdit,
  ] = React.useState<AlertDefinition | void>();
  const [canCreateAlert, setCanCreateAlert] = React.useState<boolean>(false);

  function onAlertsDefsUpdated() {
    props.onAlertsDefsUpdated();
    setAlertToDelete(undefined);
  }

  React.useEffect(() => {
    AuthorizationService.isAuthorized(
      DASHBOARD_PERMISSIONS.CREATE,
      'ALERT',
      null,
    ).then(value => setCanCreateAlert(value));
  }, []);

  function onEditIconClick(
    alertDef: AlertDefinition,
    event: SyntheticEvent<HTMLSpanElement>,
  ) {
    setAlertToEdit(alertDef);

    // The delete icon is inside the table row, so we need to stop the event
    // propagation, otherwise the click event will propagate up the tree and
    // trigger a row click
    event.stopPropagation();
  }

  function onDeleteIconClick(
    alertDef: AlertDefinition,
    event: SyntheticEvent<HTMLSpanElement>,
  ) {
    setAlertToDelete(alertDef);

    // The delete icon is inside the table row, so we need to stop the event
    // propagation, otherwise the click event will propagate up the tree and
    // trigger a row click
    event.stopPropagation();
  }

  function onRequestCloseModal() {
    setAlertToDelete(undefined);
    setAlertToEdit(undefined);
  }

  function onDeleteModalPrimaryAction() {
    if (alertToDelete === undefined) {
      return;
    }
    AlertsService.deleteAlertDefinition(alertToDelete.uri()).then(() => {
      Toaster.success(I18N.text('Successfully deleted alert'));

      // NOTE: Clearing on state.alertToDelete is done in onAlertsDefsUpdated()
      onAlertsDefsUpdated();
    });
  }

  function maybeRenderDeleteAlertModal(): React.Node {
    if (!alertToDelete) {
      return null;
    }
    return (
      <BaseModal
        maxWidth={350}
        onPrimaryAction={onDeleteModalPrimaryAction}
        onRequestClose={onRequestCloseModal}
        primaryButtonIntent={BaseModal.Intents.DANGER}
        primaryButtonText={I18N.text('Delete Alert')}
        show
        title={I18N.text('Delete this alert?')}
      />
    );
  }

  function maybeRenderEditModalBody(): React.Node {
    if (!alertToEdit) {
      return null;
    }

    return (
      <ComposeAlertDefinitionModal
        alertToEdit={alertToEdit}
        onAlertDefinitionPost={onAlertsDefsUpdated}
        onRequestClose={onRequestCloseModal}
        showModal
      />
    );
  }

  function maybeRenderAlertCreateButton(): React.Node {
    if (!canCreateAlert) {
      return null;
    }

    return (
      <NewAlertCreationButton onAlertDefinitionPost={onAlertsDefsUpdated} />
    );
  }

  function renderSingleAlertDefRow(
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
            mode={Modes.EDIT}
            onClick={onEditIconClick}
          />
          <AlertDefActionIcon
            alertDef={alertDef}
            mode={Modes.DELETE}
            onClick={onDeleteIconClick}
          />
        </Table.Cell>
      </Table.Row>
    );
  }

  function renderAlertDefTable(): React.Node {
    return (
      <Table
        adjustWidthsToContent
        data={alertDefs}
        headers={TABLE_HEADERS}
        noDataText={I18N.text('There are no Alert Definitions')}
        renderRow={renderSingleAlertDefRow}
      />
    );
  }

  return (
    <div>
      {maybeRenderAlertCreateButton()}
      {renderAlertDefTable()}
      {maybeRenderDeleteAlertModal()}
      {maybeRenderEditModalBody()}
    </div>
  );
}
