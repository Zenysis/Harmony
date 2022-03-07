// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import type Configuration from 'services/models/Configuration';

const TEXT = t('admin_app.configuration.resetModal');

function computeResetText(configuration: Configuration): string {
  const { key, defaultValue } = configuration.modelValues();

  return t('admin_app.configuration.resetModal.resetWarningFormat', {
    key: t('admin_app.configuration.keys')[key],
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

  primaryButtonText?: string,
  title?: string,
};

export default function ResetConfigurationModal({
  configuration,
  onResetAcknowledged,
  onResetCancelled,
  show,
  primaryButtonText = TEXT.primaryButtonText,
  title = TEXT.title,
}: Props): React.Element<typeof BaseModal> {
  const resetText = computeResetText(configuration);
  return (
    <BaseModal
      onPrimaryAction={onResetAcknowledged}
      onRequestClose={onResetCancelled}
      title={title}
      primaryButtonText={primaryButtonText}
      show={show}
      width={600}
    >
      <p>{resetText}</p>
    </BaseModal>
  );
}
