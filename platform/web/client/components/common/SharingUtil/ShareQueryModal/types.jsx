// @flow
import * as React from 'react';

import TabbedModal from 'components/ui/TabbedModal';

type TabbedModalProps = React.ElementConfig<typeof TabbedModal>;

type PrimaryButtonModalProps = {
  closeButtonText?: $PropertyType<TabbedModalProps, 'closeButtonText'>,
  disablePrimaryButton: $PropertyType<TabbedModalProps, 'disablePrimaryButton'>,
  onPrimaryAction: $PropertyType<TabbedModalProps, 'onPrimaryAction'>,
  onRequestClose?: $PropertyType<TabbedModalProps, 'onRequestClose'>,
  primaryButtonText: $PropertyType<TabbedModalProps, 'primaryButtonText'>,
  showCloseButton?: $PropertyType<TabbedModalProps, 'showCloseButton'>,
  showPrimaryButton?: $PropertyType<TabbedModalProps, 'showPrimaryButton'>,
};

type SecondaryButtonModalProps = {
  ...PrimaryButtonModalProps,
  disableSecondaryButton: $PropertyType<
    TabbedModalProps,
    'disableSecondaryButton',
  >,
  onSecondaryAction: $PropertyType<TabbedModalProps, 'onSecondaryAction'>,
  secondaryButtonIntent: $PropertyType<
    TabbedModalProps,
    'secondaryButtonIntent',
  >,
  secondaryButtonText: $PropertyType<TabbedModalProps, 'secondaryButtonText'>,
  showSecondaryButton: $PropertyType<TabbedModalProps, 'showSecondaryButton'>,
};

export type {
  TabbedModalProps,
  PrimaryButtonModalProps,
  SecondaryButtonModalProps,
};
