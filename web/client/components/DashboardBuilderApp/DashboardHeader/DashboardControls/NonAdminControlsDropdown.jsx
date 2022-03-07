// @flow
import * as React from 'react';

import CloneDashboardModal from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/CloneDashboardModal';
import DashboardControlButton from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardControlButton';
import Dropdown from 'components/ui/Dropdown';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import useBoolean from 'lib/hooks/useBoolean';
import { noop } from 'util/util';
import type Dashboard from 'models/core/Dashboard';

type Props = {
  /** Dashboard currently being viewed */
  dashboard: Dashboard,
};

/**
 * The NonAdminControlsDropdown, when clicked, will show a list of options that
 * the user can perform with a dashboard that they are not an administrator for.
 * Admin users would be able to access these options through the settings modal.
 * Currently this is just the option to clone a dashboard.
 */
function NonAdminControlsDropdown({ dashboard }: Props): React.Node {
  const [showModal, onShowModal, onCloseModal] = useBoolean(false);
  const dropdownButton = (
    <DashboardControlButton
      iconType="option-horizontal"
      onClick={noop}
      title=""
    />
  );

  const { user } = window.__JSON_FROM_BACKEND;
  const { isAuthenticated } = user;
  if (!isAuthenticated) {
    return null;
  }
  return (
    <>
      <Dropdown
        buttonClassName="gd-dashboard-controls-dropdown-button"
        defaultDisplayContent={dropdownButton}
        hideCaret
        onSelectionChange={onShowModal}
        value={undefined}
      >
        <Dropdown.Option value="">
          <Group.Horizontal alignItems="center" flex>
            <Icon type="duplicate" />
            {I18N.textById('Clone Dashboard')}
          </Group.Horizontal>
        </Dropdown.Option>
      </Dropdown>
      {showModal && (
        <CloneDashboardModal
          closeModal={onCloseModal}
          dashboardModel={dashboard}
        />
      )}
    </>
  );
}

export default (React.memo(
  NonAdminControlsDropdown,
): React.AbstractComponent<Props>);
