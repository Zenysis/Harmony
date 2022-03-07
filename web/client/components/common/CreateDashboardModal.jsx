// @flow
import * as React from 'react';

import DashboardService from 'services/DashboardBuilderApp/DashboardService';
import InputModal from 'components/common/InputModal';
import Toaster from 'components/ui/Toaster';
import { localizeUrl, onLinkClicked } from 'components/Navbar/util';
import type DashboardMeta from 'models/core/Dashboard/DashboardMeta';

type Props = {
  onRequestClose: () => void,
  show: boolean,
  createNewDashboard?: typeof DashboardService.createDashboard,
  onCreatePost?: (dashbord: DashboardMeta, dashboardName: string) => void,
};

// TODO(david): Move the translations out of navbar and to somewhere sensible
const TEXT = t('Navbar');

export default function CreateDashboardModal({
  onRequestClose,
  show,
  createNewDashboard = DashboardService.createDashboard,
  onCreatePost = undefined,
}: Props): React.Node {
  const [isCreationPending, setIsCreationPending] = React.useState<boolean>(
    false,
  );

  const onClickCreateDashboard = (dashboardName: string) => {
    if (dashboardName === '') {
      Toaster.error(TEXT.emptyDashboardNameError);
      return;
    }

    setIsCreationPending(true);
    createNewDashboard(dashboardName)
      .then(dashboard => {
        // redirect to the new dashboard
        if (!onCreatePost) {
          onLinkClicked(
            localizeUrl(`/dashboard/${dashboard.slug()}`),
            {},
            'Dashboard created',
            { dashboardName, createdInSaveToDashboardModal: false },
          );
        } else {
          onCreatePost(dashboard, dashboardName);
        }
      })
      .catch(error => {
        Toaster.error(error.message);
        console.error(error);
        analytics.track('Dashboard creation error', error);
      })
      .finally(() => {
        setIsCreationPending(false);
      });
  };

  return (
    <InputModal
      disablePrimaryButton={isCreationPending}
      onPrimaryAction={onClickCreateDashboard}
      onRequestClose={onRequestClose}
      primaryButtonText={TEXT.create}
      show={show}
      textElement={TEXT.createDashboardTitlePrompt}
      title={TEXT.createNewDashboard}
    />
  );
}
