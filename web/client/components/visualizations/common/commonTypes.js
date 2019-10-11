// @flow
import * as Zen from 'lib/Zen';
import type AxesSettings from 'models/core/QueryResultSpec/VisualizationSettings/AxesSettings';
import type BarGraphQueryResultData from 'components/visualizations/BarGraph/models/BarGraphQueryResultData';
import type BarGraphTNGQueryResultData from 'components/visualizations/BarGraphTNG/models/BarGraphQueryResultData';
import type BoxPlotQueryResultData from 'components/visualizations/BoxPlot/models/BoxPlotQueryResultData';
import type BubbleChartQueryResultData from 'components/visualizations/BubbleChart/models/BubbleChartQueryResultData';
import type BumpChartQueryResultData from 'components/visualizations/BumpChart/models/BumpChartQueryResultData';
import type ColorFilter from 'models/core/QueryResultSpec/QueryResultFilter/ColorFilter';
import type CustomField from 'models/core/Field/CustomField';
import type DataFilter from 'models/core/QueryResultSpec/QueryResultFilter/DataFilter';
import type ExpandoTreeQueryResultData from 'components/visualizations/ExpandoTree/models/ExpandoTreeQueryResultData';
import type Field from 'models/core/Field';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import type HeatTilesQueryResultData from 'models/visualizations/HeatTiles/HeatTilesQueryResultData';
import type LegacyQueryResultData from 'components/visualizations/common/legacy/models/LegacyQueryResultData';
import type LegendSettings from 'models/core/QueryResultSpec/VisualizationSettings/LegendSettings';
import type LineGraphQueryResultData from 'components/visualizations/LineGraph/models/LineGraphQueryResultData';
import type MapQueryResultData from 'components/visualizations/Map/models/MapQueryResultData';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import type SunburstQueryResultData from 'components/visualizations/Sunburst/models/SunburstQueryResultData';
import type TableQueryResultData from 'components/visualizations/Table/models/TableQueryResultData';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

// TODO(pablo): MAKE ALL OF THESE CONTROLS INTO ZENMODELS OMG
export type ViewSpecificSettings<ViewType: ResultViewType> = $ElementType<
  {
    ANIMATED_MAP: {
      baseLayer: string,
      currentDisplay: string,
      mapCenter: [number, number],
      overlayLayers: $ReadOnlyArray<string>,
      selectedField: string,
      selectedGeoTiles: string,
      zoomLevel: number,
    },
    BAR_GRAPH: {
      resultLimit: number,
      sortOn: string,
      sortOrder: string,
      stackBars: boolean,
    },
    BOX: {
      groupBy: string,
    },
    BUBBLE_CHART: {
      linearFit: boolean,
      resultLimit: number,
      showLegend: boolean,
      xAxis: string,
      yAxis: string,
      zAxis: string,
    },
    BUMP_CHART: {
      resultLimit: number,
      selectedField: string,
      selectedKeys: {}, // TODO(pablo, stephen): Should be ZenMap eventually.
      sortOrder: string,
      theme: string,
      useEthiopianDates: boolean,
    },
    CHART: {
      disabledFields: {}, // TODO(pablo, stephen): should be a ZenMap
      hideDataValueZeros: boolean,
      hideGridLines: boolean,
      removeBarSpacing: boolean,
      resultLimit: number,
      rotateDataValueLabels: boolean,
      rotateXAxisLabels: boolean,
      sortOn: string,
      sortOrder: string,
      stackBars: boolean,
      noDataToZero: boolean,
      xTickFormat: string,
      y2LineGraph: boolean,
    },
    EXPANDOTREE: {
      selectedField: string,
    },
    GEOMAP: {
      baseLayer: string,
      currentDisplay: string,
      overlayLayers: $ReadOnlyArray<string>,
      zoomLevel: number,
    },
    HEATMAP: {
      baseLayer: string,
      selectedField: string,
    },
    HEATTILES: {
      divergentColoration: boolean,
      firstYaxisSelections: $ReadOnlyArray<string>,
      invertColoration: boolean,
      logScaling: boolean,
      resultLimit: number,
      showTimeOnYAxis: boolean,
      selectedField: string,
      sortOn: string,
      sortOrder: string,
      useEthiopianDates: boolean,
    },
    MAP: {
      baseLayer: string,
      currentDisplay: string,
      fillOpacity: number,
      mapCenter: [number, number],
      overlayLayers: $ReadOnlyArray<string>,
      selectedField: string,
      selectedGeoTiles: string,
      showAdminBoundaries: boolean,
      showLabels: boolean,
      tooltipBackgroundColor:
        | string
        | {| r: number, g: number, b: number, a?: number |},
      tooltipBold: boolean,
      tooltipFontColor: string,
      tooltipFontFamily: string,
      tooltipFontSize: string,
      zoomLevel: number,
    },
    SUNBURST: {
      selectedField: string,
    },
    TABLE: {
      addTotalRow: boolean, // $CycloneIdaiHack
      enablePagination: boolean,
      invertedFields: $ReadOnlyArray<string>,
      rowHeight: number,
      tableFormat: 'table' | 'scorecard',
      footerBackground: string,
      footerBorderColor: string,
      footerColor: string,
      footerFontSize: string,
      headerBackground: string,
      headerBorderColor: string,
      headerColor: string,
      headerFontSize: string,
      rowAlternateBackground: string,
      rowBackground: string,
      rowBorderColor: string,
      rowColor: string,
      rowFontSize: string,
    },
    TIME: {
      bucketMean: boolean,
      bucketType: string,
      logScaling: boolean,
      resultLimit: number,
      rotateLabels: boolean,
      showDataLabels: boolean,
      sortOn: string,
      sortOrder: string,
      useEthiopianDates: boolean,
    },
  },
  ViewType,
>;

// TODO(pablo): we could probably reuse the RESULT_VIEW_DATA_MODEL from
// QueryResult/common.js once we flow-type it and clean it up.
type QueryResultDataTypeMap = {
  ANIMATED_MAP: LegacyQueryResultData,
  BAR_GRAPH: BarGraphTNGQueryResultData,
  BOX: BoxPlotQueryResultData,
  BUBBLE_CHART: BubbleChartQueryResultData,
  BUMP_CHART: BumpChartQueryResultData,
  CHART: BarGraphQueryResultData,
  EXPANDOTREE: ExpandoTreeQueryResultData,
  GEOMAP: LegacyQueryResultData,
  HEATMAP: LegacyQueryResultData,
  HEATTILES: HeatTilesQueryResultData,
  MAP: MapQueryResultData,
  SUNBURST: SunburstQueryResultData,
  TABLE: TableQueryResultData,
  TIME: LineGraphQueryResultData,
};

type QueryResultDataType<ViewType: ResultViewType> = $ElementType<
  QueryResultDataTypeMap,
  ViewType,
>;

// By default, a ViewType does not have any supplemental settings (like
// AxesSettings, LegendSettings, or SeriesSettings) supplied to its
// visualization component when it is rendered. If a ViewType needs these
// additional settings props to render its Visualization component, they should
// be specified here.
type SupplementalVisualizationPropsMap = $Merge<
  // All ViewTypes have an empty object by default indicating no supplemental
  // props are needed for that visualization.
  $ObjMap<QueryResultDataTypeMap, () => {}>,
  // Supplemental settings needed for specific visualizations.
  {
    BAR_GRAPH: {
      axesSettings: AxesSettings,
    },
    BUBBLE_CHART: {
      axesSettings: AxesSettings,
    },
    BUMP_CHART: {
      axesSettings: AxesSettings,
      legendSettings: LegendSettings,
    },
    CHART: {
      axesSettings: AxesSettings,
      legendSettings: LegendSettings,
    },
    MAP: {
      legendSettings: LegendSettings,
    },
    TABLE: {
      axesSettings: AxesSettings,
      legendSettings: LegendSettings,
    },
    TIME: {
      axesSettings: AxesSettings,
      legendSettings: LegendSettings,
    },
  },
>;

// By default, a ViewType does not need additional props passed to its
// ControlsBlock component (like AxesSettings, LegendSettings, or
// SeriesSettings). If a ViewType needs these additional props when rendering
// its *controls*, specify them here.
type SupplementalControlsBlockPropsMap = $Merge<
  // All ViewTypes have an empty object by default indicating no supplemental
  // props are needed for the ControlsBlock to render.
  $ObjMap<QueryResultDataTypeMap, () => {}>,
  // Supplemental settings for the visualization's controls block.
  {
    BUBBLE_CHART: {
      seriesSettings: SeriesSettings,
    },
  },
>;

export type VisualizationProps<ViewType: ResultViewType> = $Merge<
  {
    colorFilters: Zen.Map<ColorFilter>,
    controls: ViewSpecificSettings<ViewType>,
    dataFilters: Zen.Map<DataFilter>,
    // TODO(pablo): remove this when we've moved everything to the new
    // ColorFilter and DataFilter
    filters: any,
    groupBySettings: GroupBySettings,
    loading: boolean,
    onControlsSettingsChange: (controlKey: string, value: any) => void,
    onQueryDataLoad: (
      serializedData: Zen.Serialized<QueryResultDataType<ViewType>>,
    ) => void,
    onQueryDataStartLoading: () => void,
    queryResult: QueryResultDataType<ViewType>,

    // TODO(stephen, pablo): Replace this with QuerySelections instance
    // (will involve refactoring all visualizations)
    selections: Zen.Serialized<SimpleQuerySelections>,
    seriesSettings: SeriesSettings,

    fields: Array<Field>,
    isMobile: boolean,
    isPresentMode: boolean,
    smallMode: boolean,
  },
  $ElementType<SupplementalVisualizationPropsMap, ViewType>,
>;

export const visualizationDefaultProps = {
  fields: [],
  isMobile: false,
  isPresentMode: false,
  queryResult: undefined,
  smallMode: false,
};

// NOTE(nina): These are the props used for the Query Result Action Buttons,
// which are spread across SQT, AQT, and the Grid Dashboard in the form of
// different components
export type ButtonControlsProps = {
  allFields: $ReadOnlyArray<Field>,
  onFiltersChange: (newFilters: {}, optionsSelected: {}) => void,
  onOpenSettingsModalClick: () => void,
  onCalculationSubmit: (customField: CustomField) => void,
  onEditCalculation: (
    previousField: CustomField,
    editedField: CustomField,
  ) => void,
  onDeleteCalculation: (customField: CustomField) => void,
  queryResultSpec: QueryResultSpec,
  querySelections: QuerySelections | SimpleQuerySelections,
  viewType: ResultViewType,
};

export type ControlsBlockProps<ViewType: ResultViewType> = $Merge<
  {
    // TODO(pablo): remove this when we've moved everything to the new
    // ColorFilter and DataFilter
    filters: any,
    colorFilters: Zen.Map<ColorFilter>,
    controls: ViewSpecificSettings<ViewType>,
    dataFilters: Zen.Map<DataFilter>,
    fields: Array<Field>,
    onControlsSettingsChange: (controlKey: string, value: any) => void,
    selections: Zen.Serialized<SimpleQuerySelections>,

    queryResult: QueryResultDataType<ViewType>,
    displayAdvancedSettings: boolean,
  },
  $ElementType<SupplementalControlsBlockPropsMap, ViewType>,
>;
