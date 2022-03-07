// @flow
import * as React from 'react';

import DashboardControlButton from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardControlButton';
import Dropdown from 'components/ui/Dropdown';
import I18N from 'lib/I18N';
import QueryFilterItemUtil from 'models/core/wip/QueryFilterItem/QueryFilterItemUtil';
import ShareDashboardModal from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/ShareDashboardModal';
import { arrayEquality } from 'util/arrayUtil';
import { noop } from 'util/util';
import type Dashboard from 'models/core/Dashboard';

type Props = {
  currentDashboard: Dashboard,
  lastSavedDashboard: Dashboard,
};

const IS_AUTHENTICATED_USER = window.__JSON_FROM_BACKEND.user.isAuthenticated;

/**
 * The DashboardShareButton shows options that the user can choose for sharing
 * the dashboard. When they choose an option, the ShareDashboardModal will open.
 *
 * NOTE(stephen, nina): Unlike other modals used on the site, the
 * ShareDashboardModal requires being remounted when its visibility changes.
 * The component does not handle changes to the dashboard prop passed in after
 * the component first mounts. The component also fetches data from the
 * server, so we only want that behavior to happen when it is actually being
 * opened.
 */
export default function DashboardShareButton({
  currentDashboard,
  lastSavedDashboard,
}: Props): React.Node {
  const [sharingType, setSharingType] = React.useState<string | void>();
  const onCloseShareModal = React.useCallback(
    () => setSharingType(undefined),
    [],
  );

  // Test if the current dashboard has any unsaved dashboard level modifiers.
  const savedCommonSettings = lastSavedDashboard
    .specification()
    .commonSettings();
  const savedFilters = savedCommonSettings.filterSettings().items;
  const savedGroupings = savedCommonSettings.groupingSettings().items;

  const currentCommonSettings = currentDashboard
    .specification()
    .commonSettings();
  const currentFilters = currentCommonSettings.filterSettings().items;
  const currentGroupings = currentCommonSettings.groupingSettings().items;

  const hasUnsavedDashboardModifiers = React.useMemo(() => {
    return (
      !arrayEquality(
        QueryFilterItemUtil.removeEmptyItems(currentFilters),
        QueryFilterItemUtil.removeEmptyItems(savedFilters),
      ) || !arrayEquality(currentGroupings, savedGroupings)
    );
  }, [currentFilters, currentGroupings, savedFilters, savedGroupings]);

  const dropdownButton = (
    <DashboardControlButton
      className="gd-dashboard-share-button"
      iconType="svg-share"
      onClick={noop}
      title={I18N.textById('Share')}
    />
  );

  // Disable email and schedule report options for unregistered users.
  return (
    <React.Fragment>
      <Dropdown
        buttonClassName="gd-dashboard-controls-dropdown-button"
        defaultDisplayContent={dropdownButton}
        hideCaret
        onSelectionChange={setSharingType}
        value={undefined}
      >
        <Dropdown.Option value={I18N.textById('Link')}>
          {I18N.textById('Link')}
        </Dropdown.Option>
        {IS_AUTHENTICATED_USER && (
          <Dropdown.Option value={I18N.textById('Email')}>
            {I18N.textById('Email')}
          </Dropdown.Option>
        )}
        <Dropdown.Option value={I18N.textById('Download')}>
          {I18N.textById('Download')}
        </Dropdown.Option>
        {IS_AUTHENTICATED_USER && (
          <Dropdown.Option value={I18N.text('Schedule Report')}>
            {I18N.textById('Schedule Report')}
          </Dropdown.Option>
        )}
      </Dropdown>
      {sharingType !== undefined && (
        <ShareDashboardModal
          dashboard={currentDashboard}
          defaultTabName={sharingType}
          enableScheduleReport={IS_AUTHENTICATED_USER}
          enableShareEmail={IS_AUTHENTICATED_USER}
          hasUnsavedDashboardModifiers={hasUnsavedDashboardModifiers}
          onRequestClose={onCloseShareModal}
          showModal
        />
      )}
    </React.Fragment>
  );
}
