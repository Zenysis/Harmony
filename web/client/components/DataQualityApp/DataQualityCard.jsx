// @flow
import * as React from 'react';

import Icon from 'components/ui/Icon';
import type { IconType } from 'components/ui/Icon/types';

type DefaultProps = {
  /**
   * Optional color for card's top border. If no color is provided then no top
   * border is drawn
   */
  borderTopColor: string | void,
  className: string,
  metric: string,
  metricColor: string | void,
  smallprint: React.Node,
};

type Props = {
  ...DefaultProps,
  explanation: React.Node,
  icon: IconType,
  title: string,
};

export default class DataQualityCard extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    borderTopColor: undefined,
    className: '',
    metric: '',
    metricColor: undefined,
    smallprint: '',
  };

  render(): React.Node {
    const {
      borderTopColor,
      className,
      explanation,
      icon,
      metric,
      metricColor,
      smallprint,
      title,
    } = this.props;

    const cardStyle = borderTopColor
      ? {
          borderTop: `5px solid ${borderTopColor}`,
        }
      : {};
    const textStyle = { color: metricColor };

    return (
      <div className={`dq-card ${className}`} style={cardStyle}>
        <Icon type={icon} className="dq-card__icon" />
        <h3 className="dq-card__title">{title}</h3>
        <span className="dq-card__explanation">{explanation}</span>
        <span className="dq-card__metric-text" style={textStyle}>
          {metric}
        </span>
        <span className="dq-card__smallprint">{smallprint}</span>
      </div>
    );
  }
}
