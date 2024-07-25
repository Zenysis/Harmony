// @flow
import * as React from 'react';

import DataQualityCard from 'components/DataQualityApp/DataQualityCard';
import I18N from 'lib/I18N';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import OutlierAnalysis from 'models/DataQualityApp/OutlierAnalysis';
import { getScoreColor } from 'components/DataQualityApp/util';

type Props = {
  loading: boolean,
  outlierAnalysis: OutlierAnalysis,
};

const DATE_FORMAT = 'MMM YYYY';

function ExplainerSection({ loading, outlierAnalysis }: Props) {
  const renderReportsAnalyszedCard = () => {
    const firstReportDate = outlierAnalysis
      .firstReportDate()
      .format(DATE_FORMAT);

    const explanation = loading ? (
      <LoadingSpinner />
    ) : (
      <I18N
        firstReportDate={firstReportDate}
        numFacilities={<strong>{outlierAnalysis.numFacilities()}</strong>}
        numReports={<strong>{outlierAnalysis.numValues()}</strong>}
      >
        %(numReports)s reports have been received from %(numFacilities)s
        facilities since %(firstReportDate)s.
      </I18N>
    );

    return (
      <DataQualityCard
        className="dq-tab__reports-analyzed-card"
        explanation={explanation}
        icon="svg-analyze"
        smallprint={I18N.text(
          'Note that the mean value for each facility is calculated using all historical data, even if you have a time filter set. Options to choose dates to exclude from this calculation are coming soon and will be found here.',
        )}
        title="Reports Analyzed"
      />
    );
  };

  const renderScoreExplanationCard = () => {
    const { maxScore, score } = outlierAnalysis.modelValues();

    const scoreColor = getScoreColor(score, maxScore);

    const metricColorStyle = { color: scoreColor };
    const explanation = loading ? (
      <LoadingSpinner />
    ) : (
      <React.Fragment>
        <div>
          {I18N.text(
            'Proportion of facility data points that are extreme outliers:',
          )}{' '}
          <strong style={metricColorStyle}>
            {outlierAnalysis.percentageExtremeOutliers()}
            {'%'}
          </strong>
        </div>
        <div>
          {I18N.text('Proportion that are moderate outliers:')}{' '}
          <strong style={metricColorStyle}>
            {outlierAnalysis.percentageModerateOutliers()}
            {'%'}
          </strong>
        </div>
      </React.Fragment>
    );

    const smallprint = (
      <React.Fragment>
        {I18N.text(
          "This tool identifies data points that are extreme outliers (3+ standard deviations from the mean) and moderate outliers (2-3 standard deviations) relative to a facility's historical mean. The higher the average proportion of outliers, the worse it is for the quality score.",
        )}{' '}
        <strong>
          {I18N.text(
            'Note that for indicators with strong seasonality, there will be a higher proportion of outlier data points by definition and this may not mean there are actual data quality issues.',
          )}
        </strong>
      </React.Fragment>
    );
    const borderTopColor = loading ? undefined : scoreColor;

    return (
      <DataQualityCard
        borderTopColor={borderTopColor}
        className="dq-tab__score-explanation-card"
        explanation={explanation}
        icon="svg-question-mark"
        smallprint={smallprint}
        title={I18N.text('Data Outlier Analysis Score Explanation')}
      />
    );
  };

  return (
    <div className="dq-tab__explainer-section">
      {renderReportsAnalyszedCard()}
      {renderScoreExplanationCard()}
    </div>
  );
}

export default (React.memo(ExplainerSection): React.AbstractComponent<Props>);
