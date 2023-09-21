// @flow
import * as React from 'react';

import DashboardService from 'services/DashboardBuilderApp/DashboardService';
import I18N from 'lib/I18N';
import InputModal from 'components/common/InputModal';
import Toaster from 'components/ui/Toaster';
import { localizeUrl, onLinkClicked } from 'components/Navbar/util';
import type DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import type ZenHTTPError from 'util/ZenHTTPError';

type Props = {
  onCreatePost?: (dashbord: DashboardMeta, dashboardName: string) => void,
  onRequestClose: () => void,
  show: boolean,
};

export default function CreateDashboardModal({
  onRequestClose,
  show,
  onCreatePost = undefined,
}: Props): React.Node {
  const [isCreationPending, setIsCreationPending] = React.useState<boolean>(
    false,
  );

  const onClickCreateDashboard = (dashboardName: string) => {
    if (dashboardName === '') {
      Toaster.error(I18N.text('Cannot create dashboard with empty name'));
      return;
    }

    setIsCreationPending(true);
    DashboardService.createDashboard(dashboardName)
      .then(dashboard => {
        // redirect to the new dashboard
        if (!onCreatePost) {
          onLinkClicked(localizeUrl(`/dashboard/${dashboard.slug()}`), {});
        } else {
          onCreatePost(dashboard, dashboardName);
        }
      })
      .catch((error: ZenHTTPError) => {
        Toaster.error(error.standardErrorMessage());
        console.error(error);
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
      primaryButtonText={I18N.text('Create')}
      show={show}
      textElement={I18N.text('What would you like to name your new dashboard?')}
      title={I18N.textById('Create')}
    />
  );
}
