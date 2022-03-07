// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import BaseAccessSelectionView from 'components/AdminApp/AccessSelectionView/BaseAccessSelectionView';
import Checkbox from 'components/ui/Checkbox';
import DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import Dropdown from 'components/ui/Dropdown';
import ItemLevelACL from 'services/models/ItemLevelACL';
import Resource from 'services/models/Resource';
import ResourceRole from 'services/models/ResourceRole';
import Table from 'components/ui/Table';
import { RESOURCE_TYPES } from 'services/AuthorizationService/registry';
import {
  createDropOptions,
  SINGLE_DASHBOARD_OPTIONS_MAP,
} from 'components/AdminApp/constants';
import { localizeUrl, onLinkClicked } from 'components/Navbar/util';
import type Moment from 'models/core/wip/DateTime/Moment';

type Props = {
  dashboards: $ReadOnlyArray<DashboardMeta>,
  enabledDashboardACLsMap: Map<string, string>,
  onClickSave: (itemACLs: $ReadOnlyArray<ItemLevelACL>) => void,
  onRequestClose: () => void,
  show: boolean,
};

const TEXT = t('admin_app.AccessSelectionView.AddDashboardView');

const DATE_FORMAT: string = 'MMM D, YYYY';

export function formatDate(date: Moment): string {
  if (date.isValid()) {
    return date.format(DATE_FORMAT);
  }
  return '';
}

const HEADERS = [
  { id: 'Checkbox', displayContent: '' },
  {
    id: 'name',
    displayContent: TEXT.name,
    searchable: d => d.title(),
    sortFn: Table.Sort.string(d => d.title()),
  },
  {
    id: 'views',
    displayContent: TEXT.views,
    searchable: d => `${d.totalViews()}`,
    sortFn: Table.Sort.number(d => d.totalViews()),
  },
  {
    id: 'dateCreated',
    displayContent: TEXT.dateCreated,
    searchable: d => formatDate(d.created()),
    sortFn: Table.Sort.string(d => formatDate(d.created())),
  },
  { id: 'accessControl', displayContent: TEXT.accessControl },
];

const ACCESS_CONTROL_OPTIONS = createDropOptions(SINGLE_DASHBOARD_OPTIONS_MAP);

export default function AddDashboardView({
  dashboards,
  enabledDashboardACLsMap,
  onClickSave,
  onRequestClose,
  show,
}: Props): React.Element<typeof BaseAccessSelectionView> {
  const [selectedDashboardsMap, setSelectedDashboardsMap] = React.useState(
    Zen.Map.create<boolean>(),
  );
  const [
    dashboardToResourceRoleMap,
    setDashboardToResourceRoleMap,
  ] = React.useState(Zen.Map.create<{ label: string, resourceRole: string }>());
  const [checkAllDashboards, setCheckAllDashboards] = React.useState(false);

  // Creates a mapping of selected dashboards and a mapping between dashboard
  // slug and its corresponding dashboard acl.
  React.useEffect(() => {
    setSelectedDashboardsMap(
      dashboards.reduce(
        (map, dashboard) =>
          map.set(
            dashboard.slug(),
            enabledDashboardACLsMap.has(dashboard.slug()),
          ),
        Zen.Map.create(),
      ),
    );
    // TODO(yitian): update default resource role.
    const view = (Object.values(SINGLE_DASHBOARD_OPTIONS_MAP)[0]: $Cast);
    setDashboardToResourceRoleMap(
      dashboards.reduce((map, dashboard) => {
        const dashboardSlug = dashboard.slug();
        const resourceRole = enabledDashboardACLsMap.get(dashboardSlug);
        return map.set(dashboardSlug, {
          label: dashboard.title(),
          resourceRole: resourceRole !== undefined ? resourceRole : view,
        });
      }, Zen.Map.create()),
    );
  }, [dashboards, enabledDashboardACLsMap]);

  const onSelectCheckAllDashboards = isSelected => {
    setSelectedDashboardsMap(prevSelectedDashboardsMap =>
      prevSelectedDashboardsMap.fill(isSelected),
    );
    setCheckAllDashboards(isSelected);
  };

  const toggleCheckBox = (isSelected, dashboard) => {
    setSelectedDashboardsMap(prevSelectedDashboardsMap =>
      prevSelectedDashboardsMap.set(dashboard.slug(), isSelected),
    );
  };

  const onDropdownSelectionChange = (dashboard, selectedResourceRole: string) =>
    setDashboardToResourceRoleMap(prevDashboardToResourceRoleMap =>
      prevDashboardToResourceRoleMap.set(dashboard.slug(), {
        label: (dashboard.title(): string),
        resourceRole: selectedResourceRole,
      }),
    );

  const renderTableRow = dashboard => {
    const dashboardResourceRole = dashboardToResourceRoleMap.get(
      dashboard.slug(),
    );
    const accessControlValue =
      dashboardResourceRole !== undefined
        ? dashboardResourceRole.resourceRole
        : (Object.values(SINGLE_DASHBOARD_OPTIONS_MAP)[0]: $Cast);
    return (
      <Table.Row id={dashboard.uri()}>
        <Table.Cell>
          <Checkbox
            className="access-selection-view__checkbox"
            value={selectedDashboardsMap.get(dashboard.slug()) || false}
            onChange={isSelected => toggleCheckBox(isSelected, dashboard)}
          />
        </Table.Cell>
        <Table.Cell>
          <div
            className="access-selection-view__dashboard-label-link"
            onClick={(_, event) =>
              onLinkClicked(
                localizeUrl(`/dashboard/${dashboard.slug()}`),
                event,
                undefined,
                undefined,
                true,
              )
            }
            role="button"
          >
            {dashboard.title()}
          </div>
        </Table.Cell>
        <Table.Cell>{`${dashboard.totalViews()}`}</Table.Cell>
        <Table.Cell>{formatDate(dashboard.created())}</Table.Cell>
        <Table.Cell>
          <Dropdown
            onSelectionChange={val => onDropdownSelectionChange(dashboard, val)}
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
    selectedDashboardsMap.keys().forEach(dashboardSlug => {
      const dashboardResourceRole = dashboardToResourceRoleMap.get(
        dashboardSlug,
      );
      const isDashboardSelected = selectedDashboardsMap.get(
        dashboardSlug,
        undefined,
      );
      if (isDashboardSelected === true && dashboardResourceRole !== undefined) {
        const resource = Resource.create({
          label: dashboardResourceRole.label,
          name: dashboardSlug,
          resourceType: RESOURCE_TYPES.DASHBOARD,
        });
        const resourceRole = ResourceRole.create({
          name: dashboardResourceRole.resourceRole,
          resourceType: RESOURCE_TYPES.DASHBOARD,
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

  return (
    <BaseAccessSelectionView
      checkAllValue={checkAllDashboards}
      initialColumnToSort="name"
      onCheckAllChange={onSelectCheckAllDashboards}
      onPrimaryAction={onPrimaryAction}
      onRequestClose={onRequestClose}
      renderTableRow={renderTableRow}
      sectionDescription={TEXT.description}
      sectionHeading={TEXT.addDashboards}
      showModal={show}
      tableData={dashboards}
      tableHeaders={HEADERS}
    />
  );
}
