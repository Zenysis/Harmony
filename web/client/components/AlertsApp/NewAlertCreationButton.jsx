// @flow
import * as React from 'react';

import Button from 'components/ui/Button';
import ComposeAlertDefinitionModal from 'components/AlertsApp/ComposeAlertDefinitionModal';
import I18N from 'lib/I18N';
import useBoolean from 'lib/hooks/useBoolean';
import { noop } from 'util/util';

type Props = {
  onAlertDefinitionPost?: () => void,
};

export default function NewAlertCreationButton({
  onAlertDefinitionPost = noop,
}: Props): React.Node {
  const [isModalVisible, showModal, hideModal] = useBoolean(false);

  const openModal = () => {
    showModal();
  };

  return (
    <div className="alerts-app__new-alert-btn-container">
      <Button onClick={openModal}>{I18N.textById('Create Alert')}</Button>
      {isModalVisible && (
        <ComposeAlertDefinitionModal
          onAlertDefinitionPost={onAlertDefinitionPost}
          onRequestClose={hideModal}
          showModal={isModalVisible}
        />
      )}
    </div>
  );
}
