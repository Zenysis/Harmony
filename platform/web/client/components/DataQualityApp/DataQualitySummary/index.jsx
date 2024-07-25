// @flow
import * as React from 'react';

import DataQualityMap from 'models/DataQualityApp/DataQualityMap';
import DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';
import DimensionValueFilterSelector from 'components/DataQualityApp/DimensionValueFilterSelector';
import I18N from 'lib/I18N';
import LabelWrapper from 'components/ui/LabelWrapper';
import MapVisualization from 'components/DataQualityApp/DataQualitySummary/MapVisualization';
import Moment from 'models/core/wip/DateTime/Moment';
import RangeSlider from 'components/ui/RangeSlider';
import ScoreSummaryBadge from 'components/DataQualityApp/DataQualitySummary/ScoreSummaryBadge';
import Well from 'components/ui/Well';
import { autobind } from 'decorators';
import type Dimension from 'models/core/wip/Dimension';
import type TimeInterval from 'models/core/wip/DateTime/TimeInterval';
import type { QualityScoreType } from 'components/DataQualityApp/util';

type Props = {
  dataQualityMap: DataQualityMap,
  dateFilterOptions: $ReadOnlyArray<Moment>,
  dimensionValueFilter: DimensionValueFilterItem | void,
  geographyGroupBy: Dimension,
  geographyGroupByDimensions: $ReadOnlyArray<Dimension>,
  loading: boolean,
  mapQualityScoreType: QualityScoreType,
  onDimensionValueFilterSelected: (DimensionValueFilterItem | void) => void,
  onGeographyGroupBySelected: Dimension => void,
  onMapQualityScoreTypeSelected: QualityScoreType => void,
  onTimeFilterSelected: (startDate: Moment, endDate: Moment) => void,
  timeInterval: TimeInterval,
};

const DATE_FORMAT = 'MMM YYYY';

class DataQualitySummary extends React.PureComponent<Props> {
  formatDateValue(moment: Moment): string {
    return moment.format(DATE_FORMAT);
  }

  @autobind
  onDateRangeChange(startDate: Moment, endDate: Moment): void {
    const { onTimeFilterSelected } = this.props;
    onTimeFilterSelected(startDate, endDate);
  }

  renderDateRangeFilterSelector(): React.Node {
    const { dateFilterOptions, timeInterval } = this.props;

    // Forces remount of the RangeSlider if the start or end date change
    const key = `${timeInterval.start().format()}
      ${timeInterval.end().format()}`;

    return (
      <LabelWrapper
        className="dq-summary__filter-selector"
        label={I18N.textById('Date Range')}
      >
        <RangeSlider
          key={key}
          initialEnd={timeInterval.end()}
          initialStart={timeInterval.start()}
          onRangeChange={this.onDateRangeChange}
          valueFormatter={this.formatDateValue}
          values={dateFilterOptions}
        />
      </LabelWrapper>
    );
  }

  renderDimensionValueFilterSelector(): React.Node {
    const { dimensionValueFilter, onDimensionValueFilterSelected } = this.props;

    return (
      <LabelWrapper
        className="dq-summary__filter-selector"
        label={I18N.text('Filter')}
      >
        <DimensionValueFilterSelector
          filter={dimensionValueFilter}
          onDimensionValueFilterSelected={onDimensionValueFilterSelected}
        />
      </LabelWrapper>
    );
  }

  render(): React.Node {
    const {
      dataQualityMap,
      geographyGroupBy,
      geographyGroupByDimensions,
      loading,
      mapQualityScoreType,
      onGeographyGroupBySelected,
      onMapQualityScoreTypeSelected,
    } = this.props;

    const overallQuality = dataQualityMap.overall();

    return (
      <Well className="dq-summary">
        <div className="dq-summary-left-column">
          {this.renderDimensionValueFilterSelector()}
          {this.renderDateRangeFilterSelector()}
          <ScoreSummaryBadge dataQuality={overallQuality} loading={loading} />
        </div>
        <MapVisualization
          dataQualityMap={dataQualityMap}
          geographyDimensions={geographyGroupByDimensions}
          geographyGroupBy={geographyGroupBy}
          loading={loading}
          mapQualityScoreType={mapQualityScoreType}
          onGeographyGroupBySelected={onGeographyGroupBySelected}
          onMapQualityScoreTypeSelected={onMapQualityScoreTypeSelected}
        />
      </Well>
    );
  }
}

export default DataQualitySummary;
