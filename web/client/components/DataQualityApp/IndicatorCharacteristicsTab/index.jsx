// @flow
import * as React from 'react';

import Colors from 'components/ui/Colors';
import DataQuality from 'models/DataQualityApp/DataQuality';
import DataQualityCard from 'components/DataQualityApp/DataQualityCard';
import ProgressBar from 'components/ui/ProgressBar';
import { getScoreColor } from 'components/DataQualityApp/util';

type Props = {
  dataQuality: DataQuality,
  loading: boolean,
};

const TEXT = t('DataQualityApp.IndicatorCharacteristicsTab');
const DATE_FORMAT = 'D MMM YYYY';

export default class IndicatorCharacteristicsTab extends React.PureComponent<Props> {
  renderIndicatorAgeCard(): React.Node {
    const { dataQuality } = this.props;
    const { indicatorCharacteristics } = dataQuality.modelValues();
    const {
      age,
      ageScore,
      firstEverReportDate,
      displayedTimeUnit,
      lastReportDate,
      maxAgeScore,
    } = indicatorCharacteristics.modelValues();

    const metricTitle = t(
      'DataQualityApp.IndicatorCharacteristicsTab.indicatorAgeCard.metric',
      {
        age,
        timeUnit: displayedTimeUnit,
      },
    );
    const metricSubtitle = t(
      'DataQualityApp.IndicatorCharacteristicsTab.indicatorAgeCard.metricSubtitle',
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
        explanation={TEXT.indicatorAgeCard.explanation}
        icon="svg-birthday-cake"
        title={TEXT.indicatorAgeCard.title}
        metric={metricTitle}
        metricColor={color}
        smallprint={metricSubtitle}
      />
    );
  }

  renderTimeSinceLastReportCard(): React.Node {
    const { dataQuality } = this.props;
    const { indicatorCharacteristics } = dataQuality.modelValues();
    const {
      maxFreshnessScore,
      lastReportDate,
      lastReportAge,
      displayedTimeUnit,
      freshnessScore,
    } = indicatorCharacteristics.modelValues();

    const metricTitle = t(
      'DataQualityApp.IndicatorCharacteristicsTab.timeSinceReportReceivedCard.metric',
      {
        reportAge: lastReportAge,
        timeUnit: displayedTimeUnit,
      },
    );
    const metricSubtitle = t(
      'DataQualityApp.IndicatorCharacteristicsTab.timeSinceReportReceivedCard.metricSubtitle',
      {
        lastReportDate: lastReportDate.format(DATE_FORMAT),
      },
    );

    const color = getScoreColor(freshnessScore, maxFreshnessScore);

    return (
      <DataQualityCard
        borderTopColor={color}
        className="dq-indicator-characteristics-tab__card"
        explanation={TEXT.timeSinceReportReceivedCard.explanation}
        icon="time"
        title={TEXT.timeSinceReportReceivedCard.title}
        metric={metricTitle}
        metricColor={color}
        smallprint={metricSubtitle}
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
      ? TEXT.completenessTrendCard.positive
      : TEXT.completenessTrendCard.negative;

    const trendIcon = indicatorCharacteristics.completenessTrendIsUp()
      ? 'svg-trending-up'
      : 'svg-trending-down';

    return (
      <DataQualityCard
        borderTopColor={trendColor}
        className="dq-indicator-characteristics-tab__card"
        explanation={TEXT.completenessTrendCard.explanation}
        icon={trendIcon}
        title={TEXT.completenessTrendCard.title}
        metric={trendText}
        metricColor={trendColor}
      />
    );
  }

  renderReportingPeriodCard(): React.Node {
    const { dataQuality } = this.props;
    const { indicatorCharacteristics } = dataQuality.modelValues();
    const {
      displayedEstimatedReportingPeriod,
    } = indicatorCharacteristics.modelValues();

    const metricTitle = t(
      'DataQualityApp.IndicatorCharacteristicsTab.reportingPeriodCard.metricSubtitle',
      { numDays: indicatorCharacteristics.reportingPeriod() },
    );

    return (
      <DataQualityCard
        borderTopColor={Colors.SLATE}
        className="dq-indicator-characteristics-tab__card"
        explanation={TEXT.reportingPeriodCard.explanation}
        icon="svg-repeat"
        metric={displayedEstimatedReportingPeriod}
        smallprint={metricTitle}
        title={TEXT.reportingPeriodCard.title}
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
