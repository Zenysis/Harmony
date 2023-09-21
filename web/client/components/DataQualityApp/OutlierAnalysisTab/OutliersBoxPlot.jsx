// @flow
import * as React from 'react';
import { ParentSize } from '@vx/responsive';

import BoxPlot from 'components/ui/visualizations/BoxPlot';
import BoxPlotQueryResultData from 'models/visualizations/BoxPlot/BoxPlotQueryResultData';
import BoxPlotTooltip from 'components/ui/visualizations/BoxPlot/internal/BoxPlotTooltip';
import DataQualityService from 'services/wip/DataQualityService';
import Dimension from 'models/core/wip/Dimension';
import Field from 'models/core/wip/Field';
import I18N from 'lib/I18N';
import ProgressBar from 'components/ui/ProgressBar';
import { OUTLIER_TYPE } from 'components/DataQualityApp/OutlierAnalysisTab/util';
import { cancelPromise } from 'util/promiseUtil';
import { round } from 'util/numberUtil';
import type {
  BoxPlotDataPoint,
  OutlierTooltipData,
} from 'components/ui/visualizations/BoxPlot/types';
import type { Filters } from 'components/DataQualityApp/util';
import type { OutlierType } from 'components/DataQualityApp/OutlierAnalysisTab/util';

type Props = {
  field: Field,
  filters: Filters,
  geographyGroupBy: Dimension,
  lowestGranularityGeographyDimension: Dimension,
  onDataPointClick: BoxPlotDataPoint => void,
  outlierType: OutlierType,
};

const OUTLIER_TYPE_PREFIX_MAP = {
  [OUTLIER_TYPE.ALL]: '',
  [OUTLIER_TYPE.MODERATE]: `${I18N.text('moderate')} `,
  [OUTLIER_TYPE.EXTREME]: `${I18N.text('extreme')} `,
};

function OutliersBoxPlot({
  field,
  filters,
  geographyGroupBy,
  lowestGranularityGeographyDimension,
  onDataPointClick,
  outlierType,
}: Props) {
  const [queryResult, setQueryResult] = React.useState<BoxPlotQueryResultData>(
    BoxPlotQueryResultData.create({}),
  );

  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    setLoading(true);
    const queryPromise = DataQualityService.getOutliersBoxPlot(
      field,
      geographyGroupBy,
      filters,
      outlierType,
    ).then(result => {
      setQueryResult(result);
      setLoading(false);
    });
    return () => cancelPromise(queryPromise);
  }, [field, filters, geographyGroupBy, outlierType]);

  const dataGroups = React.useMemo(
    () => queryResult.getDataPoints(field.id(), geographyGroupBy.id()),
    [queryResult, field, geographyGroupBy],
  );

  const formatValue = React.useCallback((value: number) =>
    round(value, 2).toString(),
  );

  const renderFacilityTooltip = React.useCallback(
    (tooltipData: OutlierTooltipData) => {
      const { dataPoint, left, top } = tooltipData;
      const title =
        dataPoint.dimensions[lowestGranularityGeographyDimension.id()] ||
        I18N.textById('Unknown');
      const rows = [
        {
          label: I18N.text('%% of reported values that are outliers'),
          value: `${dataPoint.value.toFixed(2)}%`,
        },
        {
          label: I18N.text(
            'Click to view reported data & outliers on time series below',
          ),
          value: '',
        },
      ];

      return <BoxPlotTooltip left={left} rows={rows} title={title} top={top} />;
    },
    [],
  );

  const outlierTypePrefix = OUTLIER_TYPE_PREFIX_MAP[outlierType];

  const title = I18N.text(
    '%% of facility data points that are %(outlierType)s outliers by %(geography)s',
    {
      geography: geographyGroupBy.name().toLocaleLowerCase(),
      outlierType: outlierTypePrefix,
    },
  );

  const yAxisLabel = I18N.text(
    '%% of facility data points that are %(outlierType)s outliers',
    {
      outlierType: outlierTypePrefix,
    },
  );

  if (loading) {
    return (
      <React.Fragment>
        <h4 className="dq-viz-title">{title}</h4>
        <div className="dq-viz-container__progress-bar-wrapper">
          <ProgressBar />
        </div>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <h4 className="dq-viz-title">{title}</h4>
      <ParentSize>
        {({ width }) => (
          <BoxPlot
            groups={dataGroups}
            height={400}
            metricValueFormatter={formatValue}
            onOutlierClick={onDataPointClick}
            outlierClassName="dq-outlier-analysis-tab__box-plot-data-point"
            renderOutlierTooltip={renderFacilityTooltip}
            showViolinPatternLines={false}
            showViolinPlot={false}
            width={width}
            xAxisLabel={geographyGroupBy.name()}
            yAxisLabel={yAxisLabel}
          />
        )}
      </ParentSize>
    </React.Fragment>
  );
}

export default (React.memo(OutliersBoxPlot): React.AbstractComponent<Props>);
