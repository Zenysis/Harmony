// @flow
import * as React from 'react';

import Button from 'components/ui/Button';
import Group from 'components/ui/Group';
import Icon from 'components/ui/Icon';
import type { IconType } from 'components/ui/Icon/types';

const buttonContentsStyle = {
  fontSize: '11px',
  textTransform: 'none',
};

type DefaultProps = {
  className: string,
  icon: IconType | void,
};

type ButtonData = {
  onButtonClick: (event: SyntheticMouseEvent<HTMLButtonElement>) => void,
  text: string,
};

type Props = {
  ...DefaultProps,
  buttons: $ReadOnlyArray<ButtonData>,
  summary: string,
  title: string,
};

const defaultProps = {
  className: '',
  icon: undefined,
};

export default function InsightsActionCard(props: Props): React.Element<'div'> {
  const { buttons, className, icon, summary, title } = props;

  function maybeRenderIcon(): React.Element<typeof Icon> | null {
    return icon ? (
      <Icon className="insights-action-card__icon" type={icon} />
    ) : null;
  }

  function renderButtons(): $ReadOnlyArray<React.Element<typeof Button>> {
    return buttons.map(button => (
      <Button
        key={button.text}
        buttonContentsStyle={buttonContentsStyle}
        className="insights-action-card__button"
        intent={Button.Intents.PRIMARY}
        onClick={button.onButtonClick}
        outline
      >
        {button.text}
      </Button>
    ));
  }

  function renderBody(): React.Element<typeof Group.Vertical> {
    // NOTE: Give the main content of the card left padding if
    // we have an icon so that it is aligned with the card title
    const mainContentStyle = icon ? { paddingLeft: 32 } : {};
    return (
      <Group.Vertical spacing="xs">
        <Group.Horizontal alignItems="center" flex>
          {maybeRenderIcon()}
          <div className="insights-action-card__title">{title}</div>
        </Group.Horizontal>
        <Group.Vertical spacing="m" style={mainContentStyle}>
          <div className="insights-action-card__summary">{summary}</div>
          {renderButtons()}
        </Group.Vertical>
      </Group.Vertical>
    );
  }

  return (
    <div className={`insights-action-card ${className}`}>{renderBody()}</div>
  );
}

InsightsActionCard.defaultProps = defaultProps;
