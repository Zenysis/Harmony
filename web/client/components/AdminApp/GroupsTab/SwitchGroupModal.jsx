// @flow
import * as React from 'react';

import AlertMessage, { ALERT_TYPE } from 'components/common/AlertMessage';
import BaseModal from 'components/ui/BaseModal';

const TEXT = t('admin_app.groups.switch_group_modal');

type Props = {
  /**
   * The callback that is invoked when the user is acknowledging that they
   * wish to switch groups and discard any unsaved changes.
   */
  onGroupChangeAcknowledged: () => void,

  /**
   * The callback that is invoked when the user does not want to switch
   * groups.
   */
  onGroupChangeCancelled: () => void,
  show: boolean,

  primaryButtonText: string,
  title: string,

  /** The warning text displayed to the user */
  warningText: string,
};

export default class SwitchGroupModal extends React.PureComponent<Props> {
  static defaultProps = {
    primaryButtonText: TEXT.primary_button_text,
    title: TEXT.title,
    warningText: TEXT.warning_text,
  };

  renderWarningControl() {
    return (
      <div className="switch-group-modal-body">
        <AlertMessage type={ALERT_TYPE.INFO}>
          {this.props.warningText}
        </AlertMessage>
      </div>
    );
  }

  render() {
    const {
      onGroupChangeAcknowledged,
      onGroupChangeCancelled,
      title,
      primaryButtonText,
      show,
    } = this.props;

    return (
      <BaseModal
        onPrimaryAction={onGroupChangeAcknowledged}
        onRequestClose={onGroupChangeCancelled}
        width={600}
        defaultHeight={350}
        show={show}
        title={title}
        primaryButtonText={primaryButtonText}
      >
        {this.renderWarningControl()}
      </BaseModal>
    );
  }
}
