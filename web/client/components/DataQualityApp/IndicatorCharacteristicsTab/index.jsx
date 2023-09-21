// @flow
import * as React from 'react';

import Colors from 'components/ui/Colors';
import DataQuality from 'models/DataQualityApp/DataQuality';
import DataQualityCard from 'components/DataQualityApp/DataQualityCard';
import I18N from 'lib/I18N';
import ProgressBar from 'components/ui/ProgressBar';
import { getScoreColor } from 'components/DataQualityApp/util';

type Props = {
  dataQuality: DataQuality,
  loading: boolean,
};

const DATE_FORMAT = 'D MMM YYYY';

export default class IndicatorCharacteristicsTab extends React.PureComponent<Props> {
  renderIndicatorAgeCard(): React.Node {
    const { dataQuality } = this.props;
    const { indicatorCharacteristics } = dataQuality.modelValues();
    const {
      age,
      ageScore,
      displayedTimeUnit,
      firstEverReportDate,
      lastReportDate,
      maxAgeScore,
    } = indicatorCharacteristics.modelValues();

    const metricTitle = I18N.text('%(age)s %(timeUnit)s', {
      age,
      timeUnit: displayedTimeUnit,
    });
    const metricSubtitle = I18N.text(
      '%(firstReportDate)s till %(lastReportDate)s',
      {
        firstReportDate: firstEverReportDate.format(DATE_FORMAT),
        lastReportDate: lastReportDate.format('MMM YYYY'),
      },
    );
    const color = getScoreColor(ageScore, maxAgeScore);

    return (
      <DataQualityCard
        borderTopColor={color}
        className="dq-indicator-characteristics-tab__card"
        explanation={I18N.text(
          'Older indicators tend to be more established and encounter fewer issues common among new indicators. The larger the number of reporting periods an indicator has been reported for, the better it is for the score.',
        )}
        icon="svg-birthday-cake"
        metric={metricTitle}
        metricColor={color}
        smallprint={metricSubtitle}
        title={I18N.text('Indicator Age')}
      />
    );
  }

  renderTimeSinceLastReportCard(): React.Node {
    const { dataQuality } = this.props;
    const { indicatorCharacteristics } = dataQuality.modelValues();
    const {
      displayedTimeUnit,
      freshnessScore,
      lastReportAge,
      lastReportDate,
      maxFreshnessScore,
    } = indicatorCharacteristics.modelValues();

    const metricTitle = I18N.textById('%(age)s %(timeUnit)s', {
      age: lastReportAge,
      timeUnit: displayedTimeUnit,
    });
    const metricSubtitle = I18N.text('Last report %(lastReportDate)s', {
      lastReportDate: lastReportDate.format(DATE_FORMAT),
    });

    const color = getScoreColor(freshnessScore, maxFreshnessScore);

    return (
      <DataQualityCard
        borderTopColor={color}
        className="dq-indicator-characteristics-tab__card"
        explanation={I18N.text(
          'A recent last report means that fresh data is available and being collected. The fewer reporting periods that have passed since the most recent report was received, the better it is for the score.',
        )}
        icon="time"
        metric={metricTitle}
        metricColor={color}
        smallprint={metricSubtitle}
        title={I18N.text('Time Since Last Report')}
      />
    );
  }

  renderCompletnessTrendCard(): React.Node {
    const { dataQuality } = this.props;
    const { indicatorCharacteristics } = dataQuality.modelValues();

    const trendColor = indicatorCharacteristics.completenessTrendIsUp()
      ? Colors.SUCCESS
      : Colors.ERROR;

    const trendText = indicatorCharacteristics.completenessTrendIsUp()
      ? I18N.text('Positive')
      : I18N.text('Negative');

    const trendIcon = indicatorCharacteristics.completenessTrendIsUp()
      ? 'svg-trending-up'
      : 'svg-trending-down';

    return (
      <DataQualityCard
        borderTopColor={trendColor}
        className="dq-indicator-characteristics-tab__card"
        explanation={I18N.text(
          'This shows the direction of the trend line for number of reports received per reporting period in the selected date range. A negative trend is bad for the quality score.',
        )}
        icon={trendIcon}
        metric={trendText}
        metricColor={trendColor}
        title={I18N.text('Completeness Trend')}
      />
    );
  }

  renderReportingPeriodCard(): React.Node {
    const { dataQuality } = this.props;
    const { indicatorCharacteristics } = dataQuality.modelValues();
    const {
      displayedEstimatedReportingPeriod,
    } = indicatorCharacteristics.modelValues();

    const metricTitle = I18N.text(
      'Average time between reports: %(numDays)s days',
      { numDays: indicatorCharacteristics.reportingPeriod() },
    );

    return (
      <DataQualityCard
        borderTopColor={Colors.SLATE}
        className="dq-indicator-characteristics-tab__card"
        explanation={I18N.text(
          'The estimated reporting period is based on the average time observed between reports analyzed. While this does not directly affect the quality score, it is used as an input when computing some parts of the quality score.',
        )}
        icon="svg-repeat"
        metric={displayedEstimatedReportingPeriod}
        smallprint={metricTitle}
        title={I18N.text('Estimated Reporting Period')}
      />
    );
  }

  render(): React.Node {
    const { loading } = this.props;

    if (loading) {
      return <ProgressBar />;
    }

    return (
      <div className="dq-indicator-characteristics-tab">
        {this.renderIndicatorAgeCard()}
        {this.renderTimeSinceLastReportCard()}
        {this.renderCompletnessTrendCard()}
        {this.renderReportingPeriodCard()}
      </div>
    );
  }
}
