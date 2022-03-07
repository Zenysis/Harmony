// @flow
import * as React from 'react';

import I18N from 'lib/I18N';
import DataQualityCard from 'components/DataQualityApp/DataQualityCard';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import {
  getScoreColor,
  getScoreDisplayText,
} from 'components/DataQualityApp/util';
import type ReportingCompleteness from 'models/DataQualityApp/ReportingCompleteness';

type Props = {
  loading: boolean,
  reportingCompleteness: ReportingCompleteness,
};

const DATE_FORMAT = 'MMM YYYY';

function ExplainerSection({ loading, reportingCompleteness }: Props) {
  const renderReportsAnalyzedCard = () => {
    const firstReportDate = reportingCompleteness
      .firstReportDate()
      .format(DATE_FORMAT);

    const explanation = loading ? (
      <LoadingSpinner />
    ) : (
      <React.Fragment>
        <strong>{reportingCompleteness.totalReports()}</strong>{' '}
        {I18N.text('reports have been received since', 'reportsAnalyzed')}{' '}
        {firstReportDate}.
      </React.Fragment>
    );

    return (
      <DataQualityCard
        className="dq-tab__reports-analyzed-card"
        icon="svg-analyze"
        explanation={explanation}
        smallprint={I18N.text(
          'The line graph shows the trend of these reports over time and the table below it lists only those facilities which have reported for this indicator by default.',
          'reportsAnalyzedSmallprint',
        )}
        title={I18N.text('Reports Analyzed')}
      />
    );
  };

  const renderScoreExplanationCard = () => {
    const { score, maxScore } = reportingCompleteness.modelValues();

    const scoreColor = getScoreColor(score, maxScore);

    const reportsReceivedStats = I18N.text(
      '# of reports received per reporting period: Avg %(average)s, Min %(min)s, Max %(max)s, Mode %(mode)s, Stddev %(stdDev)s',
      'reportsReceivedStats',
      {
        average: reportingCompleteness.averageReportCount(),
        min: reportingCompleteness.minReportCount(),
        max: reportingCompleteness.maxReportCount(),
        mode: reportingCompleteness.modeReportCount(),
        stdDev: reportingCompleteness.reportCountStd(),
      },
    );

    const consistencyValue = getScoreDisplayText(score, maxScore);
    const metricColorStyle = { color: scoreColor };

    const explanation = loading ? (
      <LoadingSpinner />
    ) : (
      <React.Fragment>
        <div>
          {I18N.text(
            'Consistency in number of reports received:',
            'consistency',
          )}{' '}
          <strong style={metricColorStyle}>{consistencyValue}</strong>
        </div>
        <div>{reportsReceivedStats}</div>
      </React.Fragment>
    );

    const borderTopColor = loading ? undefined : scoreColor;

    return (
      <DataQualityCard
        borderTopColor={borderTopColor}
        className="dq-tab__score-explanation-card"
        icon="svg-question-mark"
        explanation={explanation}
        smallprint={I18N.text(
          'The higher the consistenty in number of reports received, the better it is for the quality score. This is because if the number of reports received changes a lot across the periods being analyzed, it likely means there were fewer reports received than expected during some of the reporting periods.',
          'scoreExplanationSmallprint',
        )}
        title={I18N.text('Reporting Completeness Score Explanation')}
      />
    );
  };

  return (
    <div className="dq-tab__explainer-section">
      {renderReportsAnalyzedCard()}
      {renderScoreExplanationCard()}
    </div>
  );
}

export default (React.memo(ExplainerSection): React.AbstractComponent<Props>);
