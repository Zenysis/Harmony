// @flow
import * as React from 'react';

import Colors from 'components/ui/Colors';
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

const TEXT = t('DataQualityApp.MetricBox');

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
      metricValueContent = TEXT.notApplicable;
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
          style={boxStyles}
          className={`dq-metric-box ${className}`}
          onClick={onClick}
          role="button"
        >
          {content}
        </div>
      );
    }

    return (
      <div style={boxStyles} className={`dq-metric-box ${className}`}>
        {content}
      </div>
    );
  }
}
