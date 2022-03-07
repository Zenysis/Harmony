// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import BoxPlotQueryResultData from 'models/visualizations/BoxPlot/BoxPlotQueryResultData';
import CustomizableTimeInterval from 'models/core/wip/QueryFilterItem/CustomizableTimeInterval';
import DataQuality from 'models/DataQualityApp/DataQuality';
import DataQualityMap from 'models/DataQualityApp/DataQualityMap';
import Field from 'models/core/wip/Field';
import GranularityService from 'services/wip/GranularityService';
import GroupingDimension from 'models/core/wip/GroupingItem/GroupingDimension';
import GroupingGranularity from 'models/core/wip/GroupingItem/GroupingGranularity';
import LineGraphQueryResultData from 'models/visualizations/LineGraph/LineGraphQueryResultData';
import LocationReportingInfo from 'models/DataQualityApp/LocationReportingInfo';
import Moment from 'models/core/wip/DateTime/Moment';
import Query from 'components/visualizations/common/Query/Query';
import QuerySelections from 'models/core/wip/QuerySelections';
import TableQueryResultData from 'models/visualizations/Table/TableQueryResultData';
import { API_VERSION } from 'services/APIService';
import { autobind } from 'decorators';
import type Dimension from 'models/core/wip/Dimension';
import type { Filters } from 'components/DataQualityApp/util';
import type { OutlierType } from 'components/DataQualityApp/OutlierAnalysisTab/util';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

const SCORE_ENDPOINT = 'query/data_quality';
const TABLE_ENDPOINT = 'query/data_quality_table';
const LINE_GRAPH_ENDPOINT = 'query/reporting_completeness_line_graph';

class DataQualityService {
  _createGroupingDimension(
    dimension: Dimension,
    includeNull: boolean = false,
  ): GroupingDimension {
    return GroupingDimension.create({
      dimension: dimension.id(),
      name: dimension.name(),
      includeNull,
    });
  }

  _getCombinedFilters(filters: Filters): $ReadOnlyArray<QueryFilterItem> {
    return [filters.dimensionValue, filters.time].filter(Boolean);
  }

  @autobind
  getQualityReport(
    field: Field,
    filters: Filters,
    geographyGroupBy: Dimension | void,
    excludeOutliers: boolean = false,
  ): Promise<DataQualityMap> {
    const queryFilters = this._getCombinedFilters(filters);

    return GranularityService.forceGet('day')
      .then(granularity => {
        const groupings = [
          GroupingGranularity.createFromGranularity(granularity),
        ];
        if (geographyGroupBy) {
          groupings.push(this._createGroupingDimension(geographyGroupBy, true));
        }

        const endpoint = excludeOutliers
          ? `${SCORE_ENDPOINT}?excludeOutliers=1`
          : SCORE_ENDPOINT;

        return Query.create(
          endpoint,
          QuerySelections.create({
            fields: Zen.Array.create([field]),
            filter: Zen.Array.create(queryFilters),
            groups: Zen.Array.create(groupings),
          }).serializeForQuery(),
          API_VERSION.V2,
        ).run();
      })
      .then(DataQualityMap.deserialize);
  }

  @autobind
  getOverallQuality(
    field: Field,
    excludeOutliers: boolean = false,
  ): Promise<DataQuality> {
    // Add time filter to exclude future forecasts
    const filters = {
      time: CustomizableTimeInterval.createIntervalFromDates(
        Moment.create(window.__JSON_FROM_BACKEND.ui.minDataDate),
        Moment.create(),
      ),
      dimensionValue: undefined,
    };

    return this.getQualityReport(
      field,
      filters,
      undefined,
      excludeOutliers,
    ).then(dataQualityMap => dataQualityMap.overall());
  }

  @autobind
  getNumReportsTimeSeries(
    field: Field,
    geographyGroupBy: Dimension | void,
    filters: Filters,
  ): Promise<LineGraphQueryResultData> {
    const queryFilters = this._getCombinedFilters(filters);

    return GranularityService.forceGet('day').then(granularity => {
      const groupings = [
        GroupingGranularity.createFromGranularity(granularity),
      ];
      if (geographyGroupBy) {
        groupings.push(this._createGroupingDimension(geographyGroupBy));
      }

      const selections = QuerySelections.create({
        fields: Zen.Array.create([field]),
        filter: Zen.Array.create(queryFilters),
        groups: Zen.Array.create(groupings),
      });

      return Query.create(
        LINE_GRAPH_ENDPOINT,
        selections.serializeForQuery(),
        API_VERSION.V2,
      )
        .run()
        .then(LineGraphQueryResultData.deserialize);
    });
  }

  @autobind
  getLocationReportingTable(
    field: Field,
    dimensions: $ReadOnlyArray<GroupingDimension>,
    filters: Filters,
  ): Promise<$ReadOnlyArray<LocationReportingInfo>> {
    const queryFilters = this._getCombinedFilters(filters);

    const selections = QuerySelections.create({
      fields: Zen.Array.create([field]),
      filter: Zen.Array.create(queryFilters),
      groups: Zen.Array.create(dimensions),
    });

    return Query.create(
      TABLE_ENDPOINT,
      selections.serializeForQuery(),
      API_VERSION.V2,
    )
      .run()
      .then((results: $ReadOnlyArray<Zen.Serialized<LocationReportingInfo>>) =>
        results.map(LocationReportingInfo.deserialize),
      );
  }
}

export default (new DataQualityService(): DataQualityService);
