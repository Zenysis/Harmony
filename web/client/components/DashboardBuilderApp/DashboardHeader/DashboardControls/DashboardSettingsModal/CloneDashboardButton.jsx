// @flow
import * as React from 'react';

import Button from 'components/ui/Button';
import CloneDashboardModal from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/CloneDashboardModal';
import Dashboard from 'models/core/Dashboard';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import useBoolean from 'lib/hooks/useBoolean';

type Props = {
  dashboardModel: Dashboard,
};

function CloneDashboardButton({ dashboardModel }: Props) {
  const [
    isCloneDashboardModalVisible,
    openCloneDashboardModal,
    closeCloneDashboardModal,
  ] = useBoolean(false);

  const maybeRenderCloneDashboardModal = () => {
    if (!isCloneDashboardModalVisible) {
      return null;
    }

    return (
      <CloneDashboardModal
        dashboardModel={dashboardModel}
        closeModal={closeCloneDashboardModal}
      />
    );
  };

  return (
    <Group.Vertical spacing="s">
      <Heading.Small underlined>
        <I18N>Clone Dashboard</I18N>
      </Heading.Small>
      <Button
        intent={Button.Intents.PRIMARY}
        onClick={openCloneDashboardModal}
        testId="btn-clone-dashboard"
      >
        <I18N.Ref id="Clone Dashboard" />
      </Button>
      {maybeRenderCloneDashboardModal()}
    </Group.Vertical>
  );
}

export default (React.memo(
  CloneDashboardButton,
): React.AbstractComponent<Props>);
