// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import I18N from 'lib/I18N';
import { CONFIGURATION_DISPLAY_TEXT } from 'services/ConfigurationService';
import type Configuration from 'services/models/Configuration';

function computeResetText(configuration: Configuration): string {
  const { defaultValue, key } = configuration.modelValues();

  return I18N.text(
    "Are you certain you wish to reset the configuration for '%(key)s'? The value will be reset to '%(defaultValue)s'.",
    {
      defaultValue,
      key: CONFIGURATION_DISPLAY_TEXT[key],
    },
  );
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
  primaryButtonText?: string,

  show: boolean,
  title?: string,
};

export default function ResetConfigurationModal({
  configuration,
  onResetAcknowledged,
  onResetCancelled,
  show,
  primaryButtonText = I18N.textById('Reset'),
  title = I18N.text('Reset Configuration'),
}: Props): React.Element<typeof BaseModal> {
  const resetText = computeResetText(configuration);
  return (
    <BaseModal
      onPrimaryAction={onResetAcknowledged}
      onRequestClose={onResetCancelled}
      primaryButtonText={primaryButtonText}
      show={show}
      title={title}
      width={600}
    >
      <p>{resetText}</p>
    </BaseModal>
  );
}
