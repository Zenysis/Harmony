// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import I18N from 'lib/I18N';

type Props = {
  onRequestClose: () => void,
  onConfirmSwitchCalculation: () => void,
  show: boolean,
};

export default function SwitchCalculationConfirmationModal({
  onRequestClose,
  onConfirmSwitchCalculation,
  show,
}: Props): React.Node {
  return (
    <BaseModal
      disableSecondaryButton
      onRequestClose={onRequestClose}
      onPrimaryAction={onConfirmSwitchCalculation}
      primaryButtonText={I18N.text('Continue', 'Cohort-Warning-Modal-Button')}
      show={show}
      title={I18N.text('Warning', 'Cohort-Warning-Modal')}
    >
      <I18N id="Cohort-Warning-Modal-Text">
        Switching operations will result in the Cohort not being saved. Do you
        wish to continue?
      </I18N>
    </BaseModal>
  );
}
