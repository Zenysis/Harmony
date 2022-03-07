// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import AuthorizationService from 'services/AuthorizationService';
import BaseModal from 'components/ui/BaseModal';
import Checkbox from 'components/ui/Checkbox';
import DeleteConfirmationModal from 'components/AdminApp/DeleteConfirmationModal';
import Dropdown from 'components/ui/Dropdown';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import InfoTooltip from 'components/ui/InfoTooltip';
import InputText from 'components/ui/InputText';
import LabelWrapper from 'components/ui/LabelWrapper';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import QueryPolicySelector from 'components/AdminApp/QueryPolicySelector';
import RoleDefinition, {
  SELECTABLE_TOOLS,
} from 'services/models/RoleDefinition';
import Toaster from 'components/ui/Toaster';
import useBoolean from 'lib/hooks/useBoolean';
import useSavedChangesTracker from 'components/AdminApp/hooks/useSavedChangesTracker';
import {
  ALERT_SITEWIDE_OPTIONS_MAP,
  DASHBOARD_SITEWIDE_OPTIONS_MAP,
} from 'components/AdminApp/constants';
import { SOURCE_NAME } from 'services/models/QueryPolicy/constants';
import { disaggregateQueryPolicies } from 'components/AdminApp/disaggregateQueryPolicies';
import type QueryPolicy from 'services/models/QueryPolicy';
import type { DisaggregatedQueryPolicies } from 'components/AdminApp/disaggregateQueryPolicies';
import type { RoleTools } from 'services/models/RoleDefinition';

type Props = {
  availablePoliciesMap: DisaggregatedQueryPolicies,
  onCloseModal: () => void,
  role?: RoleDefinition | void,
  roleLabels: $ReadOnlyArray<string>,
  show: boolean,
  updateRolesTab: () => void,
};

const TEXT = t('admin_app.RoleViewModal');
const SITEWIDE_OPTION_TEXT = t('admin_app.constants');

const DASHBOARD_SITEWIDE_OPTIONS_ZEN_MAP = Zen.Map.create(
  DASHBOARD_SITEWIDE_OPTIONS_MAP,
);

const ALERT_SITEWIDE_OPTIONS_ZEN_MAP = Zen.Map.create(
  ALERT_SITEWIDE_OPTIONS_MAP,
);

const { enableDataQualityLab } = window.__JSON_FROM_BACKEND.ui;
const isCasemanagementEnabled =
  window.__JSON_FROM_BACKEND.caseManagementAppOptions.appEnabled;
const isAlertsEnabled = window.__JSON_FROM_BACKEND.alertsEnabled;

const DEFAULT_TOOLS_SELECTED = {};
SELECTABLE_TOOLS.forEach(toolName => {
  if (
    (toolName === 'alertsApp' && !isAlertsEnabled) ||
    (toolName === 'dataQualityLab' && !enableDataQualityLab) ||
    (toolName === 'caseManagementApp' && !isCasemanagementEnabled)
  ) {
    return;
  }
  DEFAULT_TOOLS_SELECTED[toolName] = false;
});

const TOOLS_ICON_MAP = {
  alertsApp: 'svg-alerts',
  analyzeTool: 'svg-analyze-with-background',
  caseManagementApp: 'svg-case-management',
  dashboardCreator: 'svg-dashboard-with-background',
  dataQualityLab: 'svg-data-quality',
};

const policyDimensions = Object.keys(
  window.__JSON_FROM_BACKEND.queryPolicyDimensions,
);

export default function RoleViewModal({
  availablePoliciesMap,
  onCloseModal,
  role,
  roleLabels,
  show,
  updateRolesTab,
}: Props): React.Element<typeof React.Fragment> {
  const [policyRadioMap, setPolicyRadioMap] = React.useState<Zen.Map<boolean>>(
    policyDimensions.reduce(
      (acc, dimensionName) => acc.set(dimensionName, false),
      Zen.Map.create(),
    ),
  );
  const [selectedPoliciesMap, setSelectedPoliciesMap] = React.useState<
    Zen.Map<$ReadOnlyArray<string>>,
  >(
    policyDimensions.reduce(
      (acc, dimensionName) => acc.set(dimensionName, []),
      Zen.Map.create(),
    ),
  );
  const [dataExport, setDataExport] = React.useState(
    role !== undefined ? role.dataExport() : false,
  );
  const [label, setLabel] = React.useState<string>(
    role !== undefined ? role.label() : '',
  );
  const [showSiteWide, setSiteWide] = React.useState(false);
  const [
    siteWideDashboardPermission,
    setSiteWideDashboardPermission,
  ] = React.useState<string>(
    role !== undefined
      ? DASHBOARD_SITEWIDE_OPTIONS_ZEN_MAP.filter(
          permission => permission === role.dashboardResourceRoleName(),
        ).keys()[0]
      : SITEWIDE_OPTION_TEXT.dashboardRequireInvite,
  );
  const [
    siteWideAlertPermission,
    setSiteWideAlertPermission,
  ] = React.useState<string>(
    role !== undefined
      ? ALERT_SITEWIDE_OPTIONS_ZEN_MAP.filter(
          permission => permission === role.alertResourceRoleName(),
        ).keys()[0]
      : SITEWIDE_OPTION_TEXT.alertRequireInvite,
  );
  const [toolsSelected, setToolsSelected] = React.useState<Zen.Map<boolean>>(
    role !== undefined
      ? role
          .tools()
          .reduce(
            (map, tool) => map.set(tool, true),
            Zen.Map.create(DEFAULT_TOOLS_SELECTED),
          )
      : Zen.Map.create(DEFAULT_TOOLS_SELECTED),
  );
  const [
    showConfirmationModal,
    openConfirmationModal,
    closeConfirmationModal,
  ] = useBoolean(false);

  // loadedData is used as a way to determine when all state variables are
  // initialized and when we can begin tracking unsavedChanges
  const [loadedData, setLoadedDataTrue] = useBoolean(false);
  const [unsavedChanges] = useSavedChangesTracker({
    isDataLoaded: loadedData,
    markAsSavedWhen: [role],
    markAsUnsavedWhen: [
      label,
      dataExport,
      label,
      policyRadioMap,
      selectedPoliciesMap,
      siteWideDashboardPermission,
      siteWideAlertPermission,
      toolsSelected,
    ],
  });

  const loadQueryPolicies = React.useCallback(() => {
    if (role !== undefined) {
      const dimensionToPoliciesMap = disaggregateQueryPolicies(
        role.queryPolicies().arrayView(),
      );
      const newPolicyRadioMap = Object.keys(dimensionToPoliciesMap).reduce(
        (acc, dimensionName) =>
          acc.set(
            dimensionName,
            dimensionToPoliciesMap[dimensionName].all !== undefined,
          ),
        Zen.Map.create(),
      );
      setPolicyRadioMap(newPolicyRadioMap);
      const newSelectedPoliciesMap = Object.keys(dimensionToPoliciesMap).reduce(
        (acc, dimensionName) =>
          acc.set(
            dimensionName,
            dimensionToPoliciesMap[dimensionName].policies.map(policy =>
              policy.name(),
            ),
          ),
        Zen.Map.create(),
      );
      setSelectedPoliciesMap(newSelectedPoliciesMap);
    }
  }, [role]);

  // NOTE(yitian): The loadedData is used to check when the state has been
  // initialized (refreshState) and when we are ready to start checking for
  // unsavedChanges. Otherwise, the state updates in refreshState will trigger
  // unsavedChanges data checks.
  React.useEffect(() => {
    loadQueryPolicies();
    setLoadedDataTrue();
  }, [loadQueryPolicies, setLoadedDataTrue]);

  const onConfirmConfirmationModal = () => {
    closeConfirmationModal();
    onCloseModal();
  };

  const onPrimaryAction = () => {
    // TODO(pablo): when ZenMaps allow non-string keys this cast won't be necessary
    const tools = ((toolsSelected
      .filter(isSelected => isSelected)
      .keys(): $Cast): Array<RoleTools>);

    const zenTools = Zen.Array.create<RoleTools>(tools);

    const selectedQueryPolicies = [];
    policyDimensions.forEach(policyDimension => {
      const dimensionPolicies = availablePoliciesMap[policyDimension];
      const selectedPolicies = selectedPoliciesMap.get(policyDimension) || [];
      // We either select the 'all' policy or the individually selected ones
      if (policyRadioMap.get(policyDimension)) {
        // NOTE(stephen): Since the `all` property is initialized to `undefined`
        // in `disaggregateQueryPolicies`, we must check that it is not
        // `undefined` here.
        if (dimensionPolicies.all !== undefined) {
          selectedQueryPolicies.push(dimensionPolicies.all);
        }
      } else {
        dimensionPolicies.policies.forEach(policy => {
          if (selectedPolicies.includes(policy.name())) {
            selectedQueryPolicies.push(policy);
          }
        });
      }
    });

    // Retrieve alert and dashboard resource roles.
    const alertResourceRoleName = ((ALERT_SITEWIDE_OPTIONS_ZEN_MAP.get(
      siteWideAlertPermission,
    ): $Cast): string);

    const dashboardResourceRoleName = ((DASHBOARD_SITEWIDE_OPTIONS_ZEN_MAP.get(
      siteWideDashboardPermission,
    ): $Cast): string);

    const cleanedLabel = label.trim();
    if (cleanedLabel === '') {
      Toaster.error(
        I18N.text('Cannot add or update role without a name.', 'noRoleName'),
      );
      return;
    }

    if (role === undefined && roleLabels.includes(cleanedLabel.toLowerCase())) {
      Toaster.error(
        I18N.textById('duplicateNameError', { label: cleanedLabel }),
      );
      return;
    }

    // If role is undefined, create a new role. Otherwise, update existing role.
    const roleToUpdate =
      role !== undefined
        ? role
            .label(cleanedLabel)
            .tools(zenTools)
            .queryPolicies(Zen.Array.create<QueryPolicy>(selectedQueryPolicies))
            .alertResourceRoleName(alertResourceRoleName)
            .dashboardResourceRoleName(dashboardResourceRoleName)
            .dataExport(dataExport)
        : RoleDefinition.create({
            alertResourceRoleName,
            dashboardResourceRoleName,
            dataExport,
            label: cleanedLabel,
            queryPolicies: Zen.Array.create(selectedQueryPolicies),
            tools: zenTools,
          });
    const updateRoleAction =
      role !== undefined
        ? AuthorizationService.updateRole
        : AuthorizationService.createRole;
    updateRoleAction(roleToUpdate).then(() => {
      updateRolesTab();
      onCloseModal();
    });
  };

  const onRequestClose = () =>
    unsavedChanges ? openConfirmationModal() : onCloseModal();

  const onSiteWideClick = () => {
    setSiteWide(prevSiteWideVal => !prevSiteWideVal);
  };

  const onToolClick = (toolName: string) => {
    setToolsSelected(prevStateToolsSelected =>
      prevStateToolsSelected.set(toolName, !toolsSelected.get(toolName)),
    );
  };

  const renderDataExport = () => {
    const displayLabel = (
      <Group.Horizontal spacing="xxxs">
        <I18N>Data export</I18N>
        <InfoTooltip
          text={I18N.text(
            'Note: users with permissions to this role may also gain data export access through another role.',
            'dataExportDisclaimer',
          )}
        />
      </Group.Horizontal>
    );
    return (
      <LabelWrapper
        className="create-role-modal__data-access-label"
        label={displayLabel}
      >
        <Checkbox
          className="create-role-modal__data-export-checkbox"
          label={I18N.text('Allow data exports (CSV, JSON)')}
          labelPlacement="right"
          onChange={setDataExport}
          value={dataExport}
        />
      </LabelWrapper>
    );
  };

  const onPolicyRadioSelect = (dimensionName: string, newValue: boolean) => {
    setPolicyRadioMap(policyRadioMap.set(dimensionName, newValue));
  };

  const onPolicyDropdownSelect = (
    dimensionName: string,
    newValues: $ReadOnlyArray<string>,
  ) => {
    setSelectedPoliciesMap(selectedPoliciesMap.set(dimensionName, newValues));
  };

  const renderPolicySelector = (dimensionName: string) => {
    // Don't render selector if there are no query policies
    if (policyDimensions.length === 0) {
      return null;
    }
    const maybeAvailablePolicies = availablePoliciesMap[dimensionName];
    const availablePolicies = maybeAvailablePolicies
      ? maybeAvailablePolicies.policies
      : [];
    return (
      <React.Suspense fallback={<LoadingSpinner />}>
        <QueryPolicySelector
          key={dimensionName}
          availablePolicies={availablePolicies}
          dimensionName={dimensionName}
          isAllSelected={policyRadioMap.get(dimensionName) || false}
          onRadioSelect={onPolicyRadioSelect}
          onSinglePolicySelect={onPolicyDropdownSelect}
          selectedPolicies={selectedPoliciesMap.get(dimensionName) || []}
        />
      </React.Suspense>
    );
  };

  const nonSourceDimensionSelectors = policyDimensions
    .filter(dimensionName => dimensionName !== SOURCE_NAME)
    .map(dimensionName => renderPolicySelector(dimensionName));

  const dataAccessSection = (
    <div className="create-role-modal__section">
      <div className="create-role-modal__heading">
        <Heading size={Heading.Sizes.SMALL}>
          <I18N.Ref id="Data access" />
        </Heading>
      </div>
      <div className="create-role-modal__description">
        <I18N id="dataAccessDescription">
          Select which data this role will grant access to when assigned to a
          user or group.
        </I18N>
      </div>
      <div className="create-role-modal__data-access-selection">
        {renderPolicySelector(SOURCE_NAME)}
        {nonSourceDimensionSelectors}
        {renderDataExport()}
      </div>
    </div>
  );

  const nameSection = (
    <div className="create-role-modal__section">
      <div className="create-role-modal__heading">
        <Heading size={Heading.Sizes.SMALL}>
          <I18N.Ref id="Name" />
        </Heading>
      </div>
      <div className="create-role-modal__description">
        <I18N id="nameDescription">
          The role name is displayed when selecting roles to assign to users or
          groups and will be displayed besides user and group names throught the
          platform.
        </I18N>
      </div>
      <InputText.Uncontrolled
        debounce
        initialValue={label}
        onChange={setLabel}
        testId="role-name-input"
        width="30%"
      />
    </div>
  );

  const renderSitewideAlerts = () => {
    const options = ALERT_SITEWIDE_OPTIONS_ZEN_MAP.keys().map(option => (
      <Dropdown.Option key={option} testId={option} value={option}>
        {option}
      </Dropdown.Option>
    ));
    return (
      <LabelWrapper
        inline
        label={I18N.textById('Alerts')}
        labelClassName="create-role-modal__sitewide-alerts-label"
      >
        <Dropdown
          defaultDisplayContent=""
          onSelectionChange={setSiteWideAlertPermission}
          testId="sitewide-access-alerts-button"
          value={siteWideAlertPermission}
        >
          {options}
        </Dropdown>
      </LabelWrapper>
    );
  };

  const renderSitewideDashboards = () => {
    const options = DASHBOARD_SITEWIDE_OPTIONS_ZEN_MAP.keys().map(option => (
      <Dropdown.Option key={option} testId={option} value={option}>
        {option}
      </Dropdown.Option>
    ));
    return (
      <LabelWrapper
        className="create-role-modal__sitewide-dashboard"
        inline
        label={I18N.text('Dashboards')}
        labelClassName="create-role-modal__sitewide-dashboard-label"
      >
        <Dropdown
          defaultDisplayContent=""
          onSelectionChange={setSiteWideDashboardPermission}
          testId="sitewide-access-dashboards-button"
          value={siteWideDashboardPermission}
        >
          {options}
        </Dropdown>
      </LabelWrapper>
    );
  };

  const maybeRenderSitewideAccess = () => {
    const button = (
      <div
        className="create-role-modal__sitewide-button"
        data-testid="toggle-role-advancedOptions"
        onClick={onSiteWideClick}
        role="button"
      >
        {showSiteWide
          ? I18N.text('Hide advanced options')
          : I18N.text('Show advanced options')}
      </div>
    );

    if (!showSiteWide) {
      return <div className="create-role-modal__section"> {button} </div>;
    }
    return (
      <div className="create-role-modal__section">
        {button}
        <div className="create-role-modal__heading">
          <Heading size={Heading.Sizes.SMALL}>
            <I18N>Sitewide Item Access</I18N>
          </Heading>
        </div>
        <div className="create-role-modal__description">
          <I18N id="sitewideDescription">
            By default, users need to be invited to individual dashboards or
            alerts to gain access to them. The settings below allow you to make
            this role grant access to all dashboards or alerts in platform when
            assigned to a user or group.
          </I18N>
        </div>
        {renderSitewideDashboards()}
        {isAlertsEnabled && renderSitewideAlerts()}
      </div>
    );
  };

  const renderToolsCards = () => {
    const cards = Object.keys(DEFAULT_TOOLS_SELECTED).map(toolName => {
      const isSelected = toolsSelected.get(toolName);
      const cardClassName = isSelected
        ? 'create-role-modal__card create-role-modal__card--selected'
        : 'create-role-modal__card';
      const checkmark = isSelected ? (
        <Icon className="create-role-modal__checkmark" type="ok" />
      ) : null;
      return (
        <div
          key={toolName}
          className={cardClassName}
          data-testid={`${toolName}-button`}
          onClick={() => onToolClick(toolName)}
          role="button"
        >
          {checkmark}
          <div className="create-role-modal__card-header">{TEXT[toolName]}</div>
          <Icon
            className="create-role-modal__tool-icon"
            type={TOOLS_ICON_MAP[toolName]}
          />
        </div>
      );
    });

    return <div className="create-role-modal__cards">{cards}</div>;
  };

  const toolsSection = (
    <div className="create-role-modal__section">
      <div className="create-role-modal__heading">
        <Heading size={Heading.Sizes.SMALL}>
          <I18N>Tools access</I18N>
        </Heading>
      </div>
      <div className="create-role-modal__description">
        <I18N id="toolsDescription">
          Select which platform tools this role will grant access to when
          assigned to a user or group.
        </I18N>
      </div>
      {renderToolsCards()}
    </div>
  );

  return (
    <React.Fragment>
      <BaseModal
        closeButtonText={I18N.text('Close')}
        height={984}
        onPrimaryAction={onPrimaryAction}
        onRequestClose={onRequestClose}
        primaryButtonText={I18N.textById('Save')}
        show={show}
        title={
          role !== undefined ? I18N.text('Edit role') : I18N.text('Create role')
        }
        width={984}
      >
        <div className="create-role-modal">
          {nameSection}
          {toolsSection}
          {dataAccessSection}
          {maybeRenderSitewideAccess()}
        </div>
      </BaseModal>
      {showConfirmationModal ? (
        <DeleteConfirmationModal
          closeButtonText={I18N.textById('No')}
          description={I18N.text(
            'Closing this will remove any unsaved changes. Do you wish to proceed?',
            'confirmationModalDescription',
          )}
          onClose={closeConfirmationModal}
          onPrimaryAction={onConfirmConfirmationModal}
          primaryButtonText={I18N.textById('Yes')}
          show={showConfirmationModal}
          title={I18N.text('Discard changes')}
        />
      ) : null}
    </React.Fragment>
  );
}
