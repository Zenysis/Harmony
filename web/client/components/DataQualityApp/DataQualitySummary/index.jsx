// @flow
import * as React from 'react';

import DataQualityMap from 'models/DataQualityApp/DataQualityMap';
import DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';
import DimensionValueFilterSelector from 'components/DataQualityApp/DimensionValueFilterSelector';
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
  mapQualityScoreType: QualityScoreType,
  dateFilterOptions: $ReadOnlyArray<Moment>,
  dimensionValueFilter: DimensionValueFilterItem | void,
  geographyGroupBy: Dimension,
  geographyGroupByDimensions: $ReadOnlyArray<Dimension>,
  loading: boolean,
  onMapQualityScoreTypeSelected: QualityScoreType => void,
  onDimensionValueFilterSelected: (DimensionValueFilterItem | void) => void,
  onTimeFilterSelected: (startDate: Moment, endDate: Moment) => void,
  onGeographyGroupBySelected: Dimension => void,
  timeInterval: TimeInterval,
};

const DATE_FORMAT = 'MMM YYYY';

const TEXT = t('DataQualityApp.DataQualitySummary');

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
        label={TEXT.dateRange}
      >
        <RangeSlider
          initialStart={timeInterval.start()}
          initialEnd={timeInterval.end()}
          key={key}
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
      <LabelWrapper className="dq-summary__filter-selector" label={TEXT.filter}>
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
      mapQualityScoreType,
      geographyGroupByDimensions,
      geographyGroupBy,
      loading,
      onMapQualityScoreTypeSelected,
      onGeographyGroupBySelected,
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
          mapQualityScoreType={mapQualityScoreType}
          geographyDimensions={geographyGroupByDimensions}
          geographyGroupBy={geographyGroupBy}
          loading={loading}
          onMapQualityScoreTypeSelected={onMapQualityScoreTypeSelected}
          onGeographyGroupBySelected={onGeographyGroupBySelected}
        />
      </Well>
    );
  }
}

export default DataQualitySummary;
