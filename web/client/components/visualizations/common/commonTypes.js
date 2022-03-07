// @flow
import * as Zen from 'lib/Zen';
import type AxesSettings from 'models/core/QueryResultSpec/VisualizationSettings/AxesSettings';
import type BarGraphQueryResultData from 'models/visualizations/BarGraph/BarGraphQueryResultData';
import type BoxPlotQueryResultData from 'models/visualizations/BoxPlot/BoxPlotQueryResultData';
import type BubbleChartQueryResultData from 'models/visualizations/BubbleChart/BubbleChartQueryResultData';
import type BumpChartQueryResultData from 'models/visualizations/BumpChart/BumpChartQueryResultData';
import type CustomField from 'models/core/Field/CustomField';
import type DataFilterGroup from 'models/core/QueryResultSpec/DataFilterGroup';
import type DruidCaseType from 'models/CaseManagementApp/DruidCaseType';
import type ExpandoTreeQueryResultData from 'models/visualizations/ExpandoTree/ExpandoTreeQueryResultData';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import type HeatTilesQueryResultData from 'models/visualizations/HeatTiles/HeatTilesQueryResultData';
import type HistogramQueryResultData from 'models/visualizations/Histogram/HistogramQueryResultData';
import type LegendSettings from 'models/core/QueryResultSpec/VisualizationSettings/LegendSettings';
import type LineGraphQueryResultData from 'models/visualizations/LineGraph/LineGraphQueryResultData';
import type MapQueryResultData from 'models/visualizations/MapViz/MapQueryResultData';
import type NumberTrendQueryResultData from 'models/visualizations/NumberTrend/NumberTrendQueryResultData';
import type PieChartQueryResultData from 'models/visualizations/PieChart/PieChartQueryResultData';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type SunburstQueryResultData from 'models/visualizations/Sunburst/SunburstQueryResultData';
import type TableQueryResultData from 'models/visualizations/Table/TableQueryResultData';
import type { ResultViewType } from 'components/QueryResult/viewTypes';
import type { ViewSpecificSettings } from 'models/visualizations/common/types';

// TODO(pablo): we could probably reuse the RESULT_VIEW_DATA_MODEL from
// QueryResult/common.js once we flow-type it and clean it up.
type QueryResultDataTypeMap = {
  BAR_GRAPH: BarGraphQueryResultData,
  BOX_PLOT: BoxPlotQueryResultData,
  BUBBLE_CHART: BubbleChartQueryResultData,
  BUMP_CHART: BumpChartQueryResultData,
  EXPANDOTREE: ExpandoTreeQueryResultData,
  HEATTILES: HeatTilesQueryResultData,
  MAP: MapQueryResultData,
  PIE: PieChartQueryResultData,
  SUNBURST: SunburstQueryResultData,
  TABLE: TableQueryResultData,
  TIME: LineGraphQueryResultData,
  EPICURVE: HistogramQueryResultData,
  NUMBER_TREND: NumberTrendQueryResultData,
};

export type QueryResultDataType<ViewType: ResultViewType> = $ElementType<
  QueryResultDataTypeMap,
  ViewType,
>;

// By default, a ViewType does not have any supplemental settings (like
// AxesSettings, LegendSettings, or SeriesSettings) supplied to its
// visualization component when it is rendered. If a ViewType needs these
// additional settings props to render its Visualization component, they should
// be specified here.
type SupplementalVisualizationPropsMap = {
  // All ViewTypes have an empty object by default indicating no supplemental
  // props are needed for that visualization.
  ...$ObjMap<QueryResultDataTypeMap, () => {}>,
  // Supplemental settings needed for specific visualizations.
  BAR_GRAPH: {
    axesSettings: AxesSettings,
  },
  BOX_PLOT: {
    axesSettings: AxesSettings,
  },
  BUBBLE_CHART: {
    axesSettings: AxesSettings,
  },
  BUMP_CHART: {
    axesSettings: AxesSettings,
    legendSettings: LegendSettings,
  },
  EPICURVE: {
    axesSettings: AxesSettings,
  },
  HEATTILES: {
    axesSettings: AxesSettings,
  },
  MAP: {
    legendSettings: LegendSettings,
  },
  TABLE: {
    // only used for case management-related settings
    allDruidCaseTypes: Zen.Map<DruidCaseType> | void,
    axesSettings: AxesSettings,

    // does the user have access to case management? if void, we still have to
    // load the permission from the backend
    canUserViewCaseManagement: boolean | void,
    onLoadCaseManagementInfo: (
      canUserViewCaseManagement: boolean,
      allDruidCaseTypes: Zen.Map<DruidCaseType>,
    ) => void,
    legendSettings: LegendSettings,
  },
  TIME: {
    axesSettings: AxesSettings,
  },
};

export type VisualizationDefaultProps<ViewType: ResultViewType | void> = {
  isPresentMode?: boolean,
  queryResult?: $Call<
    (void => void) & (mixed => QueryResultDataType<ViewType> | void),
    ViewType,
  >,
  smallMode?: boolean,
};

export type VisualizationProps<ViewType: ResultViewType> = {
  ...VisualizationDefaultProps<ViewType>,
  controls: ViewSpecificSettings<ViewType>,
  dataFilters: DataFilterGroup,
  groupBySettings: GroupBySettings,
  loading: boolean,
  onControlsSettingsChange: (controlKey: string, value: any) => void,
  queryResult: QueryResultDataType<ViewType>,
  seriesSettings: SeriesSettings,

  // TODO(stephen, anyone): Remove this when the `total` row hack in Table
  // is removed.
  customFields: $ReadOnlyArray<CustomField>,
  ...$ElementType<SupplementalVisualizationPropsMap, ViewType>,
};

export const visualizationDefaultProps: VisualizationDefaultProps<void> = {
  isPresentMode: false,
  queryResult: undefined,
  smallMode: false,
};
