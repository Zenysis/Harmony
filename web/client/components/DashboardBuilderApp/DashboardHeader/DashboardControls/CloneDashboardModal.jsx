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
};

function CloneDashboardModal({ closeModal, dashboardModel }: Props) {
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

    DashboardService.createDashboardFromSpecification(updatedSpecification)
      .then(createdDashboard => {
        closeModal();
        const newDashboardName = createdDashboard.slug();
        window.location.href = localizeUrl(`/dashboard/${newDashboardName}`);
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
      disablePrimaryButton={isCloningDashboard}
      onPrimaryAction={onCloneDasboardClicked}
      onRequestClose={closeModal}
      primaryButtonText={I18N.text('Save')}
      show
      textElement={I18N.text('Provide a name for your new dashboard')}
      title={I18N.textById('Clone Dashboard')}
    />
  );
}

export default (React.memo(
  CloneDashboardModal,
): React.AbstractComponent<Props>);
