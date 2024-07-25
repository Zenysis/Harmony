// @flow
import * as React from 'react';

import BatchPublishModal from 'components/FieldSetupApp/FieldSetupPageHeaderActions/BatchPublishAction/BatchPublishModal';
import Button from 'components/ui/Button';
import I18N from 'lib/I18N';
import useBoolean from 'lib/hooks/useBoolean';

// Wrapper component for the batch publish action. Wraps the button and the
// modal component.
export default function BatchPublishAction(): React.Element<'div'> {
  const [isModalOpen, openModal, closeModal] = useBoolean(false);
  return (
    <div>
      <Button intent={Button.Intents.PRIMARY} onClick={openModal}>
        <I18N id="publish">Publish</I18N>
      </Button>
      {isModalOpen && <BatchPublishModal onModalClose={closeModal} />}
    </div>
  );
}
