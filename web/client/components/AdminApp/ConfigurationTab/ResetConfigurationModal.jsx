// @flow
import * as React from 'react';

import AlertMessage, { ALERT_TYPE } from 'components/common/AlertMessage';
import BaseModal from 'components/ui/BaseModal';
import Configuration from 'services/models/Configuration';

const TEXT = t('admin_app.configuration.resetModal');

function computeResetText(configuration) {
  const { key, defaultValue } = configuration.modelValues();

  return t('admin_app.configuration.resetModal.resetWarningFormat', {
    key,
    defaultValue,
  });
}

type Props = {
  /** The configuration entity for which the reset modal is being displayed */
  configuration: Configuration,

  /**
   * The callback that is invoked when the user is acknowledging that they
   * wish to reset the configuration value back to its default.
   */
  onResetAcknowledged: () => void,

  /**
   * The callback that is invoked when the user does not want to reset the
   * configuration value.
   */
  onResetCancelled: () => void,
  show: boolean,

  primaryButtonText: string,
  title: string,
};

export default class ResetConfigurationModal extends React.PureComponent<Props> {
  static defaultProps = {
    primaryButtonText: TEXT.primaryButtonText,
    title: TEXT.title,
  };

  renderWarningControl() {
    const { configuration } = this.props;
    const resetText = computeResetText(configuration);

    return (
      <div className="switch-group-modal-body">
        <AlertMessage type={ALERT_TYPE.INFO}>{resetText}</AlertMessage>
      </div>
    );
  }

  render() {
    const {
      onResetAcknowledged,
      onResetCancelled,
      show,
      title,
      primaryButtonText,
    } = this.props;

    return (
      <BaseModal
        onPrimaryAction={onResetAcknowledged}
        onRequestClose={onResetCancelled}
        width={600}
        defaultHeight={350}
        title={title}
        primaryButtonText={primaryButtonText}
        show={show}
      >
        {this.renderWarningControl()}
      </BaseModal>
    );
  }
}
