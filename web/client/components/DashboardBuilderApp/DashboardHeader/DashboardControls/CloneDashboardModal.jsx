// @flow
import * as React from 'react';

import Dashboard from 'models/core/Dashboard';
import DashboardService from 'services/DashboardBuilderApp/DashboardService';
import I18N from 'lib/I18N';
import InputModal from 'components/common/InputModal';
import Toaster from 'components/ui/Toaster';
import useBoolean from 'lib/hooks/useBoolean';
import { localizeUrl } from 'components/Navbar/util';
import type ZenHTTPError from 'util/ZenHTTPError';

type Props = {
  closeModal: () => void,
  dashboardModel: Dashboard,

  createDashboard?: typeof DashboardService.createDashboardFromSpecification,
};

function CloneDashboardModal({
  closeModal,
  dashboardModel,
  createDashboard = DashboardService.createDashboardFromSpecification,
}: Props) {
  const [
    isCloningDashboard,
    setIsCloningDashboard,
    setIsNotCloningDashboard,
  ] = useBoolean(false);

  const onCloneDasboardClicked = (newDashboardTitle: string) => {
    setIsCloningDashboard();
    const specification = dashboardModel.specification();
    const updatedSpecification = specification
      .deepUpdate()
      .dashboardOptions()
      .title(newDashboardTitle);

    createDashboard(updatedSpecification)
      .then(createdDashboard => {
        closeModal();
        const newDashboardName = createdDashboard.slug();
        window.location.href = localizeUrl(`/dashboard/${newDashboardName}`);
        window.analytics.track('Dashboard cloned', {
          oldDashboardName: dashboardModel.slug(),
          newDashboardName,
        });
      })
      .catch((error: ZenHTTPError) => {
        closeModal();
        if (error.isConflict()) {
          Toaster.error(
            I18N.text('Dashboard cannot be cloned with the same name'),
          );
        } else {
          Toaster.error(
            I18N.text(
              'An error occurred while saving dashboard specification. Details were written to the console.',
              'cloneDashboardError',
            ),
          );
        }
      })
      .finally(setIsNotCloningDashboard);
  };

  return (
    <InputModal
      show
      title={I18N.textById('Clone Dashboard')}
      textElement={I18N.text('Provide a name for your new dashboard')}
      onRequestClose={closeModal}
      primaryButtonText={I18N.text('Save')}
      onPrimaryAction={onCloneDasboardClicked}
      disablePrimaryButton={isCloningDashboard}
    />
  );
}

export default (React.memo(
  CloneDashboardModal,
): React.AbstractComponent<Props>);
