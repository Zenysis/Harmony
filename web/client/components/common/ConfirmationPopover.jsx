// @flow
import * as React from 'react';

import Intents from 'components/ui/LegacyIntents';
import LegacyButton from 'components/ui/LegacyButton';
import autobind from 'decorators/autobind';
import type { ButtonClickEvent } from 'components/ui/LegacyButton';
import type { Intent } from 'components/ui/LegacyIntents';

type Props = {
  onPrimaryAction: $NonMaybeType<$Prop<LegacyButton, 'onClick'>>,
  onSecondaryAction: $NonMaybeType<$Prop<LegacyButton, 'onClick'>>,

  show: boolean,
  primaryIntent: Intent,
  primaryText: string,
  secondaryIntent: Intent,
  secondaryText: string,
  text: string,
};

const TEXT = t('common.confirmation_popover');

export default class ConfirmationPopover extends React.PureComponent<Props> {
  static defaultProps = {
    show: true,
    text: TEXT.prompt,
    primaryIntent: Intents.DANGER,
    secondaryIntent: Intents.DEFAULT,
    primaryText: TEXT.confirm,
    secondaryText: TEXT.cancel,
  };

  @autobind
  onSecondaryClick(e: ButtonClickEvent) {
    e.stopPropagation();
    this.props.onSecondaryAction(e);
  }

  @autobind
  onPrimaryClick(e: ButtonClickEvent) {
    e.stopPropagation();
    this.props.onPrimaryAction(e);
  }

  render() {
    const {
      show,
      text,
      primaryIntent,
      secondaryIntent,
      primaryText,
      secondaryText,
    } = this.props;

    if (!show) {
      return null;
    }

    return (
      <div className="confirmation-popover">
        <div className="confirmation-popover__text">{text}</div>
        <div className="confirmation-popover__inner">
          <LegacyButton
            className="confirmation-popover__button"
            type={primaryIntent}
            onClick={this.onPrimaryClick}
          >
            {primaryText}
          </LegacyButton>
          <LegacyButton
            className="confirmation-popover__button"
            type={secondaryIntent}
            onClick={this.onSecondaryClick}
          >
            {secondaryText}
          </LegacyButton>
        </div>
      </div>
    );
  }
}
