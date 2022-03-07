// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import Button from 'components/ui/Button';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';

type Props = {
  /**
   * The content to render inside the fullscreen modal.
   */
  children: React.Node,
  onRequestClose: () => void,
  onSaveClick: () => void,
  title: string,

  disableSave?: boolean,
};

/**
 * The FullscreenEditContainer provides a fullscreen experience for editing a
 * dashboard tile. A fullscreen modal will be opened with a save/cancel button
 * at the top.
 */
function FullscreenEditContainer({
  children,
  onRequestClose,
  onSaveClick,
  title,

  disableSave = false,
}: Props) {
  return (
    <BaseModal
      className="gd-fullscreen-edit-container"
      fullScreen
      show
      showCloseButton={false}
      showFooter={false}
      showHeader={false}
      showPrimaryButton={false}
      showXButton={false}
    >
      <div className="gd-fullscreen-edit-container__navbar">
        <div
          className="gd-fullscreen-edit-container__title-container"
          onClick={onRequestClose}
          role="button"
        >
          <Icon type="svg-arrow-back" />
          <Heading.Medium className="gd-fullscreen-edit-container__title">
            {title}
          </Heading.Medium>
        </div>
        <Group spacing="s">
          <Button intent="success" onClick={onSaveClick} disabled={disableSave}>
            {I18N.text('Save changes')}
          </Button>
          <Button intent="danger" onClick={onRequestClose}>
            {I18N.textById('Cancel')}
          </Button>
        </Group>
      </div>
      <div className="gd-fullscreen-edit-container__content">{children}</div>
    </BaseModal>
  );
}

export default (React.memo(
  FullscreenEditContainer,
): React.AbstractComponent<Props>);
