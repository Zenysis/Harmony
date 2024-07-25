// @flow
import * as React from 'react';

import Colors from 'components/ui/Colors';
import I18N from 'lib/I18N';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import { getScoreColor } from 'components/DataQualityApp/util';

type DefaultProps = {
  className: string,
  loading: boolean,
  onClick: (() => void) | void,
};

type Props = {
  ...DefaultProps,
  metricMaxValue: number,
  metricName: string,
  metricValue: number,
};

export default class MetricBox extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    className: '',
    loading: false,
    onClick: undefined,
  };

  render(): React.Node {
    const {
      className,
      loading,
      metricMaxValue,
      metricName,
      metricValue,
      onClick,
    } = this.props;

    const isValidMetricValue = metricMaxValue !== 0;

    const scoreColor = isValidMetricValue
      ? getScoreColor(metricValue, metricMaxValue)
      : Colors.GRAY;

    const boxStyles = loading ? {} : { borderTop: `5px solid ${scoreColor}` };

    const scoreStyle = { color: scoreColor };

    let metricValueContent;

    if (loading) {
      metricValueContent = <LoadingSpinner />;
    } else if (!isValidMetricValue) {
      metricValueContent = I18N.textById('N/A');
    } else {
      metricValueContent = `${metricValue}/${metricMaxValue}`;
    }

    const content = (
      <React.Fragment>
        <span className="dq-metric-box__metric-name">{metricName}</span>
        <span className="dq-metric-box__metric-value" style={scoreStyle}>
          {metricValueContent}
        </span>
      </React.Fragment>
    );

    if (onClick) {
      return (
        <div
          className={`dq-metric-box ${className}`}
          onClick={onClick}
          role="button"
          style={boxStyles}
        >
          {content}
        </div>
      );
    }

    return (
      <div className={`dq-metric-box ${className}`} style={boxStyles}>
        {content}
      </div>
    );
  }
}
