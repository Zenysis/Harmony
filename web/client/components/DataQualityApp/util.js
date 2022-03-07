// @flow
import Promise from 'bluebird';
import 'url-search-params-polyfill';

import Colors from 'components/ui/Colors';
import CustomizableTimeInterval from 'models/core/wip/QueryFilterItem/CustomizableTimeInterval';
import DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';
import DimensionValueSearchService from 'services/wip/DimensionValueSearchService';
import Moment from 'models/core/wip/DateTime/Moment';
import TimeInterval from 'models/core/wip/DateTime/TimeInterval';
import { FullDimensionValueService } from 'services/wip/DimensionValueService';
import { getQueryParam } from 'util/util';
import { localizeUrl } from 'components/Navbar/util';
import type DataQuality from 'models/DataQualityApp/DataQuality';
import type DimensionValue from 'models/core/wip/Dimension/DimensionValue';
import type { Color } from 'components/ui/Colors';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

export type Filters = {
  dimensionValue: DimensionValueFilterItem | void,
  time: CustomizableTimeInterval,
};

const DATE_FORMAT = 'MMM YYYY';

const TEXT = t('DataQualityApp');

type TabNamesMap = {
  INDICATOR_CHARACTERISTICS: 'indicatorCharacteristics',
  REPORTING_COMPLETENESS: 'reportingCompleteness',
  OUTLIER_ANALYSIS: 'outlierAnalysis',
};

export const TAB_NAMES: TabNamesMap = {
  INDICATOR_CHARACTERISTICS: 'indicatorCharacteristics',
  REPORTING_COMPLETENESS: 'reportingCompleteness',
  OUTLIER_ANALYSIS: 'outlierAnalysis',
};

export type TabName = $Values<TabNamesMap>;

export const URL_PARAMS = {
  // NOTE(david): This arg still refers to a geo filter so as not to break
  // existing saved urls when making dql urls more flexible.
  DIMENSION_VALUE_FILTER: 'geographyFilter',
  MAP_SCORE_TYPE: 'qualityScoreType',
  GEOGRAPHY_GROUP_BY: 'geographyGroupBy',
  SELECTED_INDICATOR: 'indicator',
  TIME_FILTER: 'timeFilter',
  SELECTED_TAB: 'selectedTab',
};

export const REPORTING_COMPLETENESS_URL_PARAMS = {
  TIME_FILTER: 'reportingCompletenessTimeFilter',
  // NOTE(david): This arg still refers to a geo filter so as not to break
  // existing saved urls when making dql urls more flexible.
  DIMENSION_VALUE_FILTER: 'reportingCompletenessGeographyFilter',
};

export const OUTLIER_ANALYSIS_URL_PARAMS = {
  TIME_FILTER: 'outlierAnalysisTimeFilter',
  // NOTE(david): This arg still refers to a geo filter so as not to break
  // existing saved urls when making dql urls more flexible.
  DIMENSION_VALUE_FILTER: 'outlierAnalysisGeographyFilter',
  AGGREGATION: 'outlierAnalysisAggregation',
  OUTLIER_TYPE: 'outlierType',
  LINE_GRAPH_GEOGRAPHY_FILTER: 'outlierLineGraphGeographyFilter',
  OVERVIEW_VIZ: 'outlierOverviewViz',
};

export const DATE_FILTER_MIN: Moment = Moment.create(
  window.__JSON_FROM_BACKEND.ui.minDataDate,
);

export const TODAY: Moment = Moment.create();

export function createMonthlyTimeFilter(
  startDate: Moment,
  endDate: Moment,
): CustomizableTimeInterval {
  const startMonth = startDate.startOf('month');
  // The time interval model is based on an excluisve end date but we want it to
  // be inclusive so we use the next month.
  const endMonth = endDate.startOf('month').add(1, 'month');
  const tomorrow = Moment.create().add(1, 'day');

  // By default the filter is inclusive of the entire end month selected.
  // When that is the current month we only want the filter to include up to
  // today's date.
  const filterEnd = Moment.min([endMonth, tomorrow]);

  return CustomizableTimeInterval.createIntervalFromDates(
    startMonth,
    filterEnd,
  );
}

export type ScoreInfo = {
  color: Color,
  lowerThreshold: number,
  upperThreshold: number,
  displayText: string,
};

export type QualityScoreType =
  | 'overallScore'
  | 'indicatorCharacteristics'
  | 'reportingCompleteness'
  | 'outlierAnalysis';

export const OVERALL_SCORE = 'overallScore';
export const INDICATOR_CHARACTERISTICS = 'indicatorCharacteristics';
export const REPORTING_COMPLETENESS = 'reportingCompleteness';
export const OUTLIER_ANALYSIS = 'outlierAnalysis';

export const QUALITY_SCORE_TYPES: Array<QualityScoreType> = [
  OVERALL_SCORE,
  INDICATOR_CHARACTERISTICS,
  REPORTING_COMPLETENESS,
  OUTLIER_ANALYSIS,
];

const SCORE_THRESHOLDS = {
  MAX: 1,
  GREAT: 0.8,
  GOOD: 0.6,
  MEDIUM: 0.4,
  BAD: 0.2,
  MIN: 0,
};

type ReportPeriodMap = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  YEARLY: 'YEARLY',
};

type ReportingPeriodBound = {
  lower: number,
  upper: number,
};

export const REPORTING_PERIOD_BOUNDS: $ObjMap<
  ReportPeriodMap,
  () => ReportingPeriodBound,
> = {
  DAILY: { lower: 0, upper: 2 },
  WEEKLY: { lower: 5, upper: 10 },
  MONTHLY: { lower: 25, upper: 40 },
  QUARTERLY: { lower: 75, upper: 120 },
  YEARLY: { lower: 300, upper: 450 },
};

export const SCORE_LOWER_THRESHOLDS = [
  SCORE_THRESHOLDS.GREAT,
  SCORE_THRESHOLDS.GOOD,
  SCORE_THRESHOLDS.MEDIUM,
  SCORE_THRESHOLDS.BAD,
  SCORE_THRESHOLDS.MIN,
];

function scoreInfo(
  lowerThreshold: number,
  upperThreshold: number,
  color: Color,
  displayText: string,
): ScoreInfo {
  return { lowerThreshold, upperThreshold, color, displayText };
}

export function getScoreInfo(score: number, maxScore: number): ScoreInfo {
  const normalizedScore = score / maxScore;

  if (normalizedScore > SCORE_THRESHOLDS.GREAT) {
    return scoreInfo(
      SCORE_THRESHOLDS.GREAT,
      SCORE_THRESHOLDS.MAX,
      Colors.SUCCESS,
      TEXT.veryHigh,
    );
  }
  if (normalizedScore > SCORE_THRESHOLDS.GOOD) {
    return scoreInfo(
      SCORE_THRESHOLDS.GOOD,
      SCORE_THRESHOLDS.GREAT,
      // NOTE(david): Whilst semantically using "hover" colors feels a bit
      // odd, these are best colors in our color palette to use here.
      Colors.SUCCESS_HOVER,
      TEXT.high,
    );
  }
  if (normalizedScore > SCORE_THRESHOLDS.MEDIUM) {
    return scoreInfo(
      SCORE_THRESHOLDS.MEDIUM,
      SCORE_THRESHOLDS.GOOD,
      Colors.WARNING,
      TEXT.medium,
    );
  }
  if (normalizedScore > SCORE_THRESHOLDS.BAD) {
    return scoreInfo(
      SCORE_THRESHOLDS.BAD,
      SCORE_THRESHOLDS.MEDIUM,
      Colors.ERROR_HOVER,
      TEXT.low,
    );
  }
  return scoreInfo(
    SCORE_THRESHOLDS.MIN,
    SCORE_THRESHOLDS.BAD,
    Colors.ERROR,
    TEXT.veryLow,
  );
}

export function getScoreColor(score: number, maxScore: number): Color {
  return getScoreInfo(score, maxScore).color;
}

export function getScoreDisplayText(score: number, maxScore: number): string {
  return getScoreInfo(score, maxScore).displayText;
}

export function getDimensionValueFilterFromURL(
  urlParameter: string,
): Promise<DimensionValueFilterItem | void> {
  const dimensionvalueFilterParam = getQueryParam(urlParameter);

  if (dimensionvalueFilterParam !== null) {
    const dimensionValueIds = dimensionvalueFilterParam.split(',');
    return Promise.all(
      dimensionValueIds.map(id => FullDimensionValueService.get(id)),
    ).then(dimensionValues => {
      const filteredDimensionValues = dimensionValues.filter(Boolean);
      return filteredDimensionValues.length
        ? DimensionValueFilterItem.createFromDimensionValues(
            ...filteredDimensionValues,
          )
        : undefined;
    });
  }

  return Promise.resolve(undefined);
}

export function getTimeIntervalFromURL(
  dateOptions: $ReadOnlyArray<Moment>,
  urlParameter: string,
): TimeInterval {
  const timeFilterParameter = getQueryParam(urlParameter);

  let urlStartMoment;
  let urlEndMoment;

  if (timeFilterParameter) {
    const [startDate, endDate] = timeFilterParameter
      .split(':')
      .map(d => Moment.create(d));

    [urlStartMoment] = dateOptions.filter(date =>
      date.isSame(startDate, 'Month'),
    );

    [urlEndMoment] = dateOptions.filter(date => date.isSame(endDate, 'Month'));
  }

  // If the url parameters are invalid or don't exist then use default filters
  const start = urlStartMoment || dateOptions[0];
  const end = urlEndMoment || dateOptions[dateOptions.length - 1];

  return TimeInterval.create({ start, end });
}

export function getURLParamFromDimensionValueFilter(
  dimensionValueFilter: DimensionValueFilterItem | void,
): string {
  return dimensionValueFilter
    ? dimensionValueFilter
        .dimensionValues()
        .map(dimensionValue => dimensionValue.id())
        .join()
    : '';
}

export function getURLParamFromTimeInterval(
  timeInterval: TimeInterval,
): string {
  const { start, end } = timeInterval.modelValues();
  const startInterval = start.format(DATE_FORMAT);
  const endInterval = end.format(DATE_FORMAT);

  return `${startInterval}:${endInterval}`;
}

export function updateURLParameters(
  parameters: $ReadOnlyArray<{ name: string, value: string }>,
) {
  const urlParams = new URLSearchParams(window.location.search);
  parameters.forEach(parameter =>
    urlParams.set(parameter.name, parameter.value),
  );
  window.history.pushState({}, '', `/data-quality?${urlParams.toString()}`);
}

export function updateURLParameter(name: string, value: string) {
  updateURLParameters([{ name, value }]);
}

export function getDQLURL(
  indicatorId?: string,
  selectedTab?: TabName,
  filters?: $ReadOnlyArray<QueryFilterItem> = [],
): string {
  // NOTE(david): Currently DQL only allows one time and one dimension value
  // filter. This may change in the future.
  const timeIntervalFilter = ((filters.find(
    filter => filter.tag === 'CUSTOMIZABLE_TIME_INTERVAL',
  ): $Cast): CustomizableTimeInterval | void);

  const dimensionValueFilter = ((filters.find(
    filter => filter.tag === 'DIMENSION_VALUE_FILTER_ITEM',
  ): $Cast): DimensionValueFilterItem | void);

  const urlParams = new URLSearchParams();

  if (indicatorId) {
    urlParams.set(URL_PARAMS.SELECTED_INDICATOR, indicatorId);
  }

  if (selectedTab) {
    urlParams.set(URL_PARAMS.SELECTED_TAB, selectedTab);
  }

  if (timeIntervalFilter) {
    const urlParam = getURLParamFromTimeInterval(
      timeIntervalFilter.filter().interval(),
    );

    urlParams.set(URL_PARAMS.TIME_FILTER, urlParam);
    urlParams.set(REPORTING_COMPLETENESS_URL_PARAMS.TIME_FILTER, urlParam);
    urlParams.set(OUTLIER_ANALYSIS_URL_PARAMS.TIME_FILTER, urlParam);
  }

  if (dimensionValueFilter) {
    const urlParam = getURLParamFromDimensionValueFilter(dimensionValueFilter);
    urlParams.set(URL_PARAMS.DIMENSION_VALUE_FILTER, urlParam);
    urlParams.set(
      REPORTING_COMPLETENESS_URL_PARAMS.DIMENSION_VALUE_FILTER,
      urlParam,
    );
    urlParams.set(OUTLIER_ANALYSIS_URL_PARAMS.DIMENSION_VALUE_FILTER, urlParam);
  }

  return localizeUrl(`/data-quality?${urlParams.toString()}`);
}

export function getDimensionValueFromDimenisonValueNames(
  dimensionValueNames: {
    +[dimensionID: string]: string | null,
    ...,
  },
  dimensionIdToSearch: string,
): Promise<DimensionValue | void> {
  const dimensionValueName = dimensionValueNames[dimensionIdToSearch];

  if (dimensionValueName) {
    return DimensionValueSearchService.get(
      dimensionValueName,
      dimensionIdToSearch,
    ).then(dimensionValues => {
      const matchingValues = dimensionValues.filter(
        dimensionValue => dimensionValue.name() === dimensionValueName,
      );

      if (matchingValues.length === 0) {
        return undefined;
      }

      // If there is only one matching value, assume it is the correct
      // match.
      if (matchingValues.length === 1) {
        return matchingValues[0];
      }

      // If there is more than one matching value, we have to parse the
      // filter to ensure we select the correct one.

      // We can only ensure that it is the correct value if the filter
      // follows the expected type: AndFilter containing SelectorFilters.
      const seriesDimensionCount = Object.keys(dimensionValueNames).length;
      return matchingValues.find(dimensionValue => {
        const queryFilter = dimensionValue.filter();
        // If the filter is not an AndFilter, then we cannot safely match.
        if (!(queryFilter.tag === 'AND')) {
          return false;
        }

        // If the number of inner filters is different from the number of
        // dimensions in the data point, then this filter is filtering too
        // much and is not a match.
        const filterFields = queryFilter.fields();
        if (filterFields.size() !== seriesDimensionCount) {
          return false;
        }

        // If all the inner filters are SelectorFilters AND each value
        // being filtered on is the same value in the data point's
        // dimensions, then we have a match.
        return filterFields.every(
          filter =>
            filter.tag === 'SELECTOR' &&
            filter.value() === dimensionValueNames[filter.dimension()],
        );
      });
    });
  }
  return Promise.resolve(undefined);
}

export function isTabEnabled(
  tabName: TabName,
  qualityScore: DataQuality,
): boolean {
  if (tabName === TAB_NAMES.REPORTING_COMPLETENESS) {
    return qualityScore.reportingCompleteness().success();
  }
  if (tabName === TAB_NAMES.INDICATOR_CHARACTERISTICS) {
    return qualityScore.indicatorCharacteristics().success();
  }
  return qualityScore.outlierAnalysis().success();
}
