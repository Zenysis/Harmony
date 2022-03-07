// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import AlertDefinition from 'models/AlertsApp/AlertDefinition';
import BaseAccessSelectionView from 'components/AdminApp/AccessSelectionView/BaseAccessSelectionView';
import Checkbox from 'components/ui/Checkbox';
import Dropdown from 'components/ui/Dropdown';
import ItemLevelACL from 'services/models/ItemLevelACL';
import Resource from 'services/models/Resource';
import ResourceRole from 'services/models/ResourceRole';
import Table from 'components/ui/Table';
import { RESOURCE_TYPES } from 'services/AuthorizationService/registry';
import {
  createDropOptions,
  SINGLE_ALERT_OPTIONS_MAP,
} from 'components/AdminApp/constants';

type Props = {
  alerts: $ReadOnlyArray<AlertDefinition>,
  alertResources: $ReadOnlyArray<Resource>,
  enabledAlertACLsMap: Map<string, string>,
  onRequestClose: () => void,
  onClickSave: (itemACLs: $ReadOnlyArray<ItemLevelACL>) => void,
  show: boolean,
};

const TEXT = t('admin_app.AccessSelectionView.AddAlertView');

const HEADERS = [
  { id: 'Checkbox', displayContent: '' },
  {
    id: 'name',
    displayContent: TEXT.name,
    searchable: d => d.label,
    sortFn: Table.Sort.string(d => d.label),
  },
  {
    id: 'dimension',
    displayContent: TEXT.dimension,
    searchable: d => d.alert.getReadableDimension(),
    sortFn: Table.Sort.string(d => d.alert.getReadableDimension()),
  },
  {
    id: 'duration',
    displayContent: TEXT.duration,
    searchable: d => d.alert.getReadableGranularity(),
    sortFn: Table.Sort.string(d => d.alert.getReadableGranularity()),
  },
  {
    id: 'accessControl',
    displayContent: TEXT.accessControl,
    searchable: d => d.accessControl,
    sortFn: Table.Sort.string(d => d.accessControl),
  },
];

const ACCESS_CONTROL_OPTIONS = createDropOptions(SINGLE_ALERT_OPTIONS_MAP);

type MergedAlertResourceDataType = {
  accessControl: string,
  label: string,
  alert: AlertDefinition,
};

function mergeAlertResourceData(
  alerts: $ReadOnlyArray<AlertDefinition>,
  resourceURIToAlertResources: $ReadOnlyMap<string, Resource>,
  alertToResourceRoleMap: Zen.Map<string>,
): Array<MergedAlertResourceDataType> {
  return alerts.map(alert => {
    const resourceURI = alert.resourceURI();
    const resource = resourceURIToAlertResources.get(resourceURI);
    const resourceRole = alertToResourceRoleMap.get(resourceURI);
    // TODO(yitian): update default resource role.
    return {
      accessControl:
        resourceRole !== undefined
          ? resourceRole
          : (Object.values(SINGLE_ALERT_OPTIONS_MAP)[0]: $Cast),
      label: resource !== undefined ? resource.label() : '',
      alert,
    };
  });
}

export default function AddAlertView({
  alerts,
  alertResources,
  enabledAlertACLsMap,
  onClickSave,
  onRequestClose,
  show,
}: Props): React.Element<typeof BaseAccessSelectionView> {
  const [selectedAlertsMap, setSelectedAlertsMap] = React.useState(
    Zen.Map.create<boolean>(),
  );
  const [alertToResourceRoleMap, setAlertToResourceRoleMap] = React.useState(
    Zen.Map.create<string>(),
  );
  const [checkAllAlerts, setCheckAllAlerts] = React.useState(false);
  const [
    resourceURIToAlertResources,
    setResourceURIToAlertResources,
  ] = React.useState<$ReadOnlyMap<string, Resource>>(new Map());

  // Since there is information that we want to surface from the alert
  // definitions, alert resource items, and alert item acls, we will create
  // mapping that allow for easy retrieval of any of the 3 objects listed earlier.
  // Upon component mount, create a mapping of selected alerts, a mapping from
  // alert uri to selected resource role, and a mapping from resource uri to
  // alert resources.
  React.useEffect(() => {
    setSelectedAlertsMap(
      alerts.reduce(
        (map, alert) =>
          map.set(
            alert.resourceURI(),
            enabledAlertACLsMap.has(alert.resourceURI()),
          ),
        Zen.Map.create(),
      ),
    );
    const view = ((Object.values(SINGLE_ALERT_OPTIONS_MAP)[0]: $Cast): string);
    setAlertToResourceRoleMap(
      alerts.reduce((map, alert) => {
        const uri = alert.resourceURI();
        const resourceRole = enabledAlertACLsMap.get(uri);
        return map.set(
          alert.resourceURI(),
          resourceRole !== undefined ? resourceRole : view,
        );
      }, Zen.Map.create()),
    );
    setResourceURIToAlertResources(
      alertResources.reduce(
        (map, resource) => map.set(resource.uri(), resource),
        new Map<string, Resource>(),
      ),
    );
  }, [alerts, enabledAlertACLsMap, alertResources]);

  const onSelectCheckAllAlerts = isSelected => {
    setSelectedAlertsMap(prevMap => prevMap.fill(isSelected));
    setCheckAllAlerts(isSelected);
  };

  const toggleCheckBox = (isSelected, alert) => {
    setSelectedAlertsMap(prevMap =>
      prevMap.set(alert.resourceURI(), isSelected),
    );
  };

  const onDropdownSelectionChange = (alert, selectedAccessControl) =>
    setAlertToResourceRoleMap(prevAlertToResourceRoleMap =>
      prevAlertToResourceRoleMap.set(
        alert.resourceURI(),
        selectedAccessControl,
      ),
    );

  const renderTableRow = mergedAlertResourceData => {
    const { alert } = mergedAlertResourceData;
    const resourceURI = alert.resourceURI();
    const resourceRole = alertToResourceRoleMap.get(resourceURI);
    // TODO(yitian): update default resource role.
    const accessControlValue =
      resourceRole !== undefined
        ? resourceRole
        : ((Object.values(SINGLE_ALERT_OPTIONS_MAP)[0]: $Cast): string);
    const alertResourceItem = resourceURIToAlertResources.get(resourceURI);
    return (
      <Table.Row id={alert.uri()}>
        <Table.Cell>
          <Checkbox
            className="access-selection-view__checkbox"
            value={selectedAlertsMap.forceGet(resourceURI) || false}
            onChange={isSelected => toggleCheckBox(isSelected, alert)}
          />
        </Table.Cell>
        <Table.Cell>
          {alertResourceItem !== undefined ? alertResourceItem.label() : ''}
        </Table.Cell>
        <Table.Cell>{alert.getReadableDimension()}</Table.Cell>
        <Table.Cell>{alert.getReadableGranularity()}</Table.Cell>
        <Table.Cell>
          <Dropdown
            onSelectionChange={val => onDropdownSelectionChange(alert, val)}
            value={accessControlValue}
          >
            {ACCESS_CONTROL_OPTIONS}
          </Dropdown>
        </Table.Cell>
      </Table.Row>
    );
  };

  const onPrimaryAction = () => {
    const itemACLs = [];
    selectedAlertsMap.keys().forEach((alertResourceURI: string) => {
      const alertResource = resourceURIToAlertResources.get(alertResourceURI);
      const isAlertSelected = selectedAlertsMap.get(
        alertResourceURI,
        undefined,
      );
      if (isAlertSelected === true && alertResource !== undefined) {
        const resource = Resource.create({
          label: alertResource.label(),
          name: alertResource.name(),
          resourceType: RESOURCE_TYPES.ALERT,
          uri: alertResource.uri(),
        });
        const resourceRole = ResourceRole.create({
          name: alertToResourceRoleMap.get(alertResourceURI),
          resourceType: RESOURCE_TYPES.ALERT,
        });
        const itemACL = ItemLevelACL.create({
          resource,
          resourceRole,
        });
        itemACLs.push(itemACL);
      }
    });
    onClickSave(itemACLs);
    onRequestClose();
  };

  const tableData = React.useMemo(
    () =>
      mergeAlertResourceData(
        alerts,
        resourceURIToAlertResources,
        alertToResourceRoleMap,
      ),
    [alerts, resourceURIToAlertResources, alertToResourceRoleMap],
  );

  return (
    <BaseAccessSelectionView
      checkAllValue={checkAllAlerts}
      initialColumnToSort="name"
      onCheckAllChange={onSelectCheckAllAlerts}
      onPrimaryAction={onPrimaryAction}
      onRequestClose={onRequestClose}
      renderTableRow={renderTableRow}
      sectionDescription={TEXT.description}
      sectionHeading={TEXT.addAlerts}
      showModal={show}
      tableData={tableData}
      tableHeaders={HEADERS}
    />
  );
}
