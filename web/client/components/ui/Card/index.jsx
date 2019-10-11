// @flow
import * as React from 'react';
import classNames from 'classnames';

import InfoTooltip from 'components/ui/InfoTooltip';
import type { StyleObject } from 'types/jsCore';

type HeadingColor = 'white' | 'purple' | 'offwhite';

type Props = {|
  children: React.Node,

  className: string,

  /** Use `Card.HeadingColors.OFFWHITE | WHITE | PURPLE` */
  headingBackground: HeadingColor,
  title: React.Node,

  /** Text to render in an info tooltip next to the card title */
  helpText: string,
  style: StyleObject | void,
|};

const HEADING_COLORS: { [string]: HeadingColor } = {
  WHITE: 'white',
  OFFWHITE: 'offwhite',
  PURPLE: 'purple',
};

export default class Card extends React.PureComponent<Props> {
  static defaultProps = {
    className: '',
    headingBackground: 'offwhite',
    title: null,
    helpText: '',
    style: undefined,
  };

  static HeadingColors = HEADING_COLORS;

  maybeRenderInfoButton() {
    const { helpText } = this.props;
    if (!helpText) {
      return null;
    }

    return <InfoTooltip text={helpText} />;
  }

  maybeRenderHeading() {
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

  renderBody() {
    return <div className="zen-card__body">{this.props.children}</div>;
  }

  render() {
    const { className, style } = this.props;
    const divClassName = classNames('zen-card', className);
    return (
      <div className={divClassName} style={style}>
        {this.maybeRenderHeading()}
        {this.renderBody()}
      </div>
    );
  }
}
