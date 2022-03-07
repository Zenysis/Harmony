// @flow
import * as React from 'react';
import classNames from 'classnames';

import InfoTooltip from 'components/ui/InfoTooltip';
import type { StyleObject } from 'types/jsCore';

// TODO(pablo): deprecate purple color
const HEADING_COLORS = Object.freeze({
  WHITE: 'white',
  OFFWHITE: 'offwhite',
  PURPLE: 'purple',
  RED: 'red',
  GREEN: 'green',
  ORANGE: 'orange',
});

type DefaultProps = {
  className: string,

  /** Use `Card.HeadingColors.OFFWHITE | WHITE | PURPLE` */
  headingBackground:
    | 'white'
    | 'purple'
    | 'offwhite'
    | 'red'
    | 'green'
    | 'orange',
  title: React.Node,

  /** Text to render in an info tooltip next to the card title */
  helpText: string,

  /**
   * Gets called when the button is clicked.
   * @param {SyntheticEvent} event The click event
   */
  onClick?: (event: SyntheticEvent<HTMLDivElement>) => void,
  style: StyleObject | void,
};

type Props = {
  ...DefaultProps,
  children: React.Node,
};

export default class Card extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    className: '',
    headingBackground: 'offwhite',
    title: null,
    helpText: '',
    onClick: undefined,
    style: undefined,
  };

  static HeadingColors: typeof HEADING_COLORS = HEADING_COLORS;

  maybeRenderInfoButton(): React.Element<typeof InfoTooltip> | null {
    const { helpText } = this.props;
    if (!helpText) {
      return null;
    }

    return <InfoTooltip text={helpText} />;
  }

  maybeRenderHeading(): React.Element<'div'> | null {
    const { headingBackground, title } = this.props;

    if (title) {
      // eslint-disable-next-line max-len
      const className = `zen-card__heading zen-card__heading--${headingBackground}`;
      return (
        <div className={className}>
          {title}
          {this.maybeRenderInfoButton()}
        </div>
      );
    }
    return null;
  }

  renderBody(): React.Element<'div'> {
    return <div className="zen-card__body">{this.props.children}</div>;
  }

  render(): React.Element<'div'> {
    const { className, onClick, style } = this.props;
    const divClassName = classNames('zen-card', className);
    /* eslint-disable jsx-a11y/no-static-element-interactions */
    return (
      <div
        className={divClassName}
        onClick={onClick}
        role={onClick === undefined ? undefined : 'button'}
        style={style}
      >
        {this.maybeRenderHeading()}
        {this.renderBody()}
      </div>
    );
  }
}
