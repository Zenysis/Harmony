// @flow
import * as React from 'react';
import Promise from 'bluebird';

import AuthorizationResource from 'services/models/AuthorizationResource';
import AuthorizationService from 'services/AuthorizationService';
import DashboardService from 'services/DashboardBuilderApp/DashboardService';
import GeneralSettingsTab from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/GeneralSettingsTab';
import I18N from 'lib/I18N';
import QueryPanelTab from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/QueryPanelTab';
import RawSpecificationTab from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/RawSpecificationTab';
import Tab from 'components/ui/Tabs/Tab';
import TabbedModal from 'components/ui/TabbedModal';
import Toaster from 'components/ui/Toaster';
import UserManagementTab from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardSettingsModal/UserManagementTab';
import {
  RESOURCE_TYPES,
  DASHBOARD_PERMISSIONS,
} from 'services/AuthorizationService/registry';
import { cancelPromise } from 'util/promiseUtil';
import { localizeUrl } from 'components/Navbar/util';
import type Dashboard from 'models/core/Dashboard';
import type DashboardSpecification from 'models/core/Dashboard/DashboardSpecification';

const TAB_NAMES = {
  FILTER_CONFIG_TAB: I18N.text('Filter Configuration'),
  SETTINGS_TAB: I18N.text('General Settings'),
  SPEC_TAB: I18N.text('Edit Specification'),
  USER_TAB: I18N.text('Dashboard Users'),
};

const INITIAL_TAB = TAB_NAMES.SETTINGS_TAB;

type Props = {
  initialDashboard: Dashboard,
  onDashboardChange: Dashboard => void,
  onRequestClose: () => void,
  show: boolean,
};

function logDashboardDeleteAndRedirect(dashboardSlug: string) {}

// Convert the raw JSON specification string into a full DashboardSpecification
// and validate that it works. Upgrade the spec to the latest version.
function upgradeDashboardSpecification(
  rawSpecification: string,
): Promise<DashboardSpecification> {
  return new Promise((resolve, reject) =>
    Promise.resolve()
      .then(() => JSON.parse(rawSpecification))
      .catch(error => {
        Toaster.error(
          I18N.text(
            'The provided specification was not valid JSON. Additional details were written to the console.',
            'updateModalBadJson',
          ),
        );
        reject(error);
      })
      .then(DashboardService.upgradeDashboard)
      .then(resolve)
      .catch(error => {
        Toaster.error(
          I18N.text(
            'The specification had errors. They have been written to the console.',
            'updateModalInvalidSpec',
          ),
        );
        reject(error);
      }),
  );
}

/**
 * The DashboardSettingsModal contains all the dashboard-level settings that a
 * user can control. It is essentially an *uncontrolled* input component. All
 * changes are stored locally in state until the user presses "Save". When the
 * user saves the settings, all changes are committed at the same time. This
 * might include changes to a dashboard model and changes to the users of that
 * model.
 */
export default function DashboardSettingsModal({
  initialDashboard,
  onDashboardChange,
  onRequestClose,
  show,
}: Props): React.Element<'span'> {
  const [dashboard, setDashboard] = React.useState<Dashboard>(initialDashboard);
  const [currentTab, setCurrentTab] = React.useState<string>(INITIAL_TAB);
  const [
    authorizationResource,
    setAuthorizationResource,
  ] = React.useState<AuthorizationResource | void>(undefined);
  const [
    canUserPublishDashboard,
    setCanUserPublishDashboard,
  ] = React.useState<boolean>(false);

  // Set up the raw specification to be in an empty state. If the value is
  // undefined, that means the user has not modified the raw specification.
  const [rawSpecification, setRawSpecification] = React.useState<string | void>(
    undefined,
  );

  // Every time the dashboard spec is modified, we must clear the raw
  // specification that might have been set by the user. This is because we
  // cannot keep user-specific changes to the raw spec *in sync* with a
  // dashboard spec that was modified somewhere else.
  // NOTE: This might be non-obvious to the user, however the dashboard
  // spec editing tab is a very advanced feature that most users will never mess
  // with. It's ok for the behavior to be slightly different.
  const specification = dashboard.specification();
  React.useEffect(() => setRawSpecification(undefined), [specification]);

  const initialAuthorizationResource = React.useRef();

  // On initial mount, determine if the user has publishing permissions for this
  // dashboard.
  React.useEffect(() => {
    const promise = AuthorizationService.isAuthorized(
      DASHBOARD_PERMISSIONS.PUBLISH,
      RESOURCE_TYPES.DASHBOARD,
      dashboard.slug(),
    ).then(setCanUserPublishDashboard);

    return () => cancelPromise(promise);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // On initial mount, retrieve the authorization resource that represents this
  // dashboard resource in the permissions system.
  React.useEffect(() => {
    const promise = AuthorizationService.getResourceWithRolesByUri(
      dashboard.authorizationUri(),
    ).then(resource => {
      if (!resource || !resource.roles) {
        Toaster.error(
          I18N.text(
            'Failed to find the list of current users for the dashboard.',
            'fetchCurrentUsersFail',
          ),
        );
        return;
      }

      setAuthorizationResource(resource);
      initialAuthorizationResource.current = resource;
    });

    return () => cancelPromise(promise);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When the modal changes visibility, reset the user selection state to the
  // initial values passed in through props. This ensures that no unsaved
  // changes will be preserved inside the modal.
  React.useEffect(() => {
    setCurrentTab(INITIAL_TAB);
    setAuthorizationResource(initialAuthorizationResource.current);
    setDashboard(initialDashboard);
    setRawSpecification(undefined);
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

  // Compare the user's current state to the intitial values for the dashboard,
  // raw specification, and authorization resource. If any have changed from
  // their initial value, save them.
  const onSaveClick = React.useCallback(() => {
    // NOTE: To avoid bombarding users with multiple toasts upon
    // saving, we track whether `onDashboardChange` was called. We rely on the
    // unspoken knowledge that `onDashboardChange` will display a toast when the
    // dashboard has been successfully saved.
    let shouldTriggerSuccessToast = false;

    // If a non-empty value exists for the raw specification, it means the user
    // has manually edited the raw specification and this is now the version we
    // must use. Any changes to non-specification parts of the dashboard model
    // will be included.
    if (rawSpecification !== undefined) {
      upgradeDashboardSpecification(rawSpecification)
        .then(newSpecification => {
          onDashboardChange(dashboard.specification(newSpecification));
        })
        .catch(error => console.error(error));
    } else if (dashboard !== initialDashboard) {
      // Otherwise, check if the user has changed the dashboard at all.
      onDashboardChange(dashboard);
    } else {
      shouldTriggerSuccessToast = true;
    }

    if (
      initialAuthorizationResource.current &&
      authorizationResource !== undefined &&
      initialAuthorizationResource.current !== authorizationResource
    ) {
      // If the authorization resource has changed, publish the changes to the
      // server.
      AuthorizationService.updateResourcePermissions(authorizationResource)
        .then(() => {
          if (shouldTriggerSuccessToast) {
            Toaster.success(
              I18N.text(
                'Dashboard was successfully saved. ',
                'SaveDashboardSuccess',
              ),
            );
          }
          initialAuthorizationResource.current = authorizationResource;
        })
        .catch(error => {
          Toaster.error(
            I18N.text(
              'Failed to update users for the Dashboard. Additional details were written to the console.',
            ),
          );
          console.error(error);
        });
    }

    onRequestClose();
  }, [
    authorizationResource,
    dashboard,
    initialDashboard,
    onDashboardChange,
    onRequestClose,
    rawSpecification,
  ]);

  const onCommonSettingsUpdate = React.useCallback(
    newCommonSettings =>
      setDashboard(
        dashboard
          .deepUpdate()
          .specification()
          .commonSettings(newCommonSettings),
      ),
    [dashboard],
  );

  const onDeleteDashboard = React.useCallback(() => {
    DashboardService.deleteDashboard(dashboard).then(() => {
      logDashboardDeleteAndRedirect(dashboard.slug());
    });
  }, [dashboard]);

  return (
    <span className="dashboard-settings">
      <TabbedModal
        initialTab={INITIAL_TAB}
        onPrimaryAction={onSaveClick}
        onRequestClose={onRequestClose}
        onTabChange={setCurrentTab}
        primaryButtonText={I18N.textById('Save')}
        show={show}
        showPrimaryButton
        width="80%"
      >
        <Tab
          name={TAB_NAMES.SETTINGS_TAB}
          testId="dashboard-general-settings-tab"
        >
          {authorizationResource !== undefined && (
            <GeneralSettingsTab
              allowOfficialStatusChange={canUserPublishDashboard}
              authorizationResource={authorizationResource}
              dashboard={dashboard}
              onDashboardChange={setDashboard}
              onDeleteDashboard={onDeleteDashboard}
            />
          )}
        </Tab>
        <Tab
          name={TAB_NAMES.FILTER_CONFIG_TAB}
          testId="dashboard-filter-configurations-tab"
        >
          <QueryPanelTab
            commonSettings={dashboard.specification().commonSettings()}
            onCommonSettingsUpdate={onCommonSettingsUpdate}
          />
        </Tab>
        <Tab name={TAB_NAMES.USER_TAB} testId="dashboard-users-tab">
          {authorizationResource !== undefined && (
            <UserManagementTab
              authorizationResource={authorizationResource}
              dashboard={dashboard}
              isActiveTab={currentTab === TAB_NAMES.USER_TAB}
              onPermissionsChanged={setAuthorizationResource}
            />
          )}
        </Tab>
        <Tab lazyLoad name={TAB_NAMES.SPEC_TAB}>
          <RawSpecificationTab
            active={currentTab === TAB_NAMES.SPEC_TAB}
            dashboard={dashboard}
            onRawSpecificationChange={setRawSpecification}
            rawSpecification={rawSpecification}
          />
        </Tab>
      </TabbedModal>
    </span>
  );
}
