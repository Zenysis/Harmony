// @flow
import * as React from 'react';
import type Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import BackgroundShapeLayer, {
  BACKGROUND_LABEL_ID,
} from 'components/visualizations/MapViz/QueryResultLayer/BackgroundShapeLayer';
import DataPointLabelLayer from 'components/visualizations/MapViz/QueryResultLayer/DataPointLabelLayer';
import DataPointPopup from 'components/visualizations/MapViz/QueryResultLayer/DataPointPopup';
import HeatLayer from 'components/visualizations/MapViz/QueryResultLayer/HeatLayer';
import MapTimeline from 'components/visualizations/MapViz/QueryResultLayer/MapTimeline';
import MarkerLayer from 'components/visualizations/MapViz/QueryResultLayer/MarkerLayer';
import QueryResultLayerLegend from 'components/visualizations/MapViz/QueryResultLayer/QueryResultLayerLegend';
import SearchBox from 'components/visualizations/MapViz/QueryResultLayer/SearchBox';
import ShapeLayer from 'components/visualizations/MapViz/QueryResultLayer/ShapeLayer';
import buildAdminBoundaryFilter from 'components/visualizations/MapViz/QueryResultLayer/buildAdminBoundaryFilter';
import buildFeatureColorGenerator from 'components/visualizations/MapViz/QueryResultLayer/buildFeatureColorGenerator';
import buildPrimaryGrouping from 'components/visualizations/MapViz/QueryResultLayer/buildPrimaryGrouping';
import fetchGeoJsonTiles from 'components/visualizations/MapViz/QueryResultLayer/ShapeLayer/fetchGeoJsonTiles';
import {
  DEFAULT_BUBBLE_COLOR,
  LABEL_LAYER_ID,
} from 'components/visualizations/MapViz/QueryResultLayer/defaults';
import { autobind, memoizeOne } from 'decorators';
import { cancelPromise } from 'util/promiseUtil';
import type DataActionGroup from 'models/core/QueryResultSpec/DataActionGroup';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import type LegendSettings from 'models/core/QueryResultSpec/VisualizationSettings/LegendSettings';
import type MapQueryResultData from 'models/visualizations/MapViz/MapQueryResultData';
import type MapSettings from 'models/visualizations/MapViz/MapSettings';
import type PlaybackSettings from 'models/visualizations/MapViz/PlaybackSettings';
import type QueryResultGrouping from 'models/core/QueryResultSpec/QueryResultGrouping';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type {
  AdminBoundaryFilterLocation,
  MapDataPoint,
} from 'models/visualizations/MapViz/types';
import type {
  EventFeature,
  Feature,
} from 'components/ui/visualizations/MapCore/types';
import type { RowData } from 'components/ui/visualizations/MapCore/SimpleLegend/SimpleLegendItem';
import type { SerializedDataPointProperties } from 'components/visualizations/MapViz/QueryResultLayer/types';

type Props = {
  /** The feature from this layer on the map the user has clicked. */
  activeFeature: EventFeature<SerializedDataPointProperties> | void,
  controls: MapSettings,
  groupBySettings: GroupBySettings,
  /** The layer ID to use when drawing on the map. */
  id: string,

  isHovering: boolean,
  legendSettings: LegendSettings,
  onPlaybackSettingsChange: PlaybackSettings => void,
  onRequestPopupClose: (SyntheticMouseEvent<HTMLElement> | Event) => void,
  queryResult: MapQueryResultData,
  /**
   * The scaling factor to apply when a pixel value is drawn on the map (like
   * tooltip font size) that will convert from the absolute size stored to the
   * desired render size to be rendered.
   */
  scaleFactor: number,
  seriesSettings: SeriesSettings,
};

type State = {
  dateIndex: number,
  disabledColorRules: Zen.Map<true>,
  disabledLabels: Zen.Map<true>,
  /** The geojson tile set that for all admin levels for this deployment. */
  geoTiles: $ReadOnlyArray<Feature> | void,
  searchText: string,
};

/**
 * The QueryResultLayer component is responsible for rendering query result data
 * points on a map. These data points represent a collection of dimensions and
 * metrics associated with a single location. The QueryResultLayer can represent
 * these data points as markers, scaled markers, and as a heatmap style.
 */
export default class QueryResultLayer extends React.PureComponent<
  Props,
  State,
> {
  _geoTilesRequest: Promise<void>;
  state: State = {
    dateIndex: 0,
    // NOTE(camden): We use a Zen Map instead of a list to store these disabled color rules and
    // disabled labels for efficient add and delete.
    disabledColorRules: Zen.Map.create(),
    disabledLabels: Zen.Map.create(),
    geoTiles: undefined,
    searchText: '',
  };

  componentDidUpdate(prevProps: Props) {
    // Reset the current date index if the number of dates for the query result
    // have changed.
    const { queryResult } = this.props;
    if (prevProps.queryResult.data().length !== queryResult.data().length) {
      this.setState({ dateIndex: 0 });
    }

    // Must reset all disabled tiles to be null, if it is being changed to a heatmap
    // as there is no way for the user to renable them from heatmap where there
    // is no legend for color rules
    if (
      this.props.controls.currentDisplay() === 'heatmap' &&
      prevProps.controls.currentDisplay() !== 'heatmap'
    ) {
      this.setState({ disabledColorRules: Zen.Map.create() });
    }
  }

  componentWillUnmount() {
    if (this._geoTilesRequest !== undefined) {
      cancelPromise(this._geoTilesRequest);
    }
  }

  /**
   * Create a callback that different layers can use to set feature colors.
   *
   * NOTE(stephen): It is cleaner for each child layer to use a single callback
   * like this versus having to receive and pass the correct arguments to the
   * more general DataActionGroup callback.
   */
  @memoizeOne
  buildFeatureColorGenerator(
    selectedFieldId: string,
    selectedFieldValues: $ReadOnlyArray<number | null>,
    colorActionGroup: DataActionGroup | void,
    defaultColor: string,
  ): string | (MapDataPoint => string) {
    return buildFeatureColorGenerator(
      selectedFieldId,
      selectedFieldValues,
      colorActionGroup,
      defaultColor,
    );
  }

  /**
   * Build a callback that can will produce a formatted value for a specific
   * field. If the field has data actions, the data action transformation will
   * be used. Otherwise, the default series settings formatter will be used
   * for the field.
   */
  @memoizeOne
  buildFieldValueFormatter(
    queryResult: MapQueryResultData,
    dateIndex: number,
    seriesSettings: SeriesSettings,
  ): (fieldId: string, value: number | null) => string {
    return (fieldId: string, value: number | null) => {
      const seriesObject = seriesSettings.getSeriesObject(fieldId);
      if (seriesObject === undefined) {
        return value === null ? 'null' : `${value}`;
      }

      const defaultFormattedValue = seriesObject.formatFieldValue(value);
      const dataActions = seriesSettings.getSeriesDataActionGroup(fieldId);
      if (dataActions === undefined) {
        return defaultFormattedValue;
      }

      // NOTE(stephen): it seems really weird to provide a default value and to
      // || it because the result of `getTransformedText` can be void.
      return (
        dataActions.getTransformedText(
          value,
          queryResult.getFieldDataForDate(fieldId, dateIndex),
          defaultFormattedValue,
        ) || defaultFormattedValue
      );
    };
  }

  getFieldValueFormatter(): (fieldId: string, value: number | null) => string {
    const { queryResult, seriesSettings } = this.props;
    return this.buildFieldValueFormatter(
      queryResult,
      this.state.dateIndex,
      seriesSettings,
    );
  }

  getFeatureColorGenerator(): string | (MapDataPoint => string) {
    const { controls, queryResult, seriesSettings } = this.props;
    const { dateIndex } = this.state;
    const selectedField = controls.selectedField();

    return this.buildFeatureColorGenerator(
      selectedField,
      queryResult.getFieldDataForDate(selectedField, dateIndex),
      seriesSettings.getSeriesDataActionGroup(selectedField),
      DEFAULT_BUBBLE_COLOR,
    );
  }

  @memoizeOne
  buildTimelineDates(
    queryResult: MapQueryResultData,
    groupBySettings: GroupBySettings,
  ): $ReadOnlyArray<string> {
    const dateGrouping = groupBySettings
      .groupings()
      .values()
      .find(grouping => grouping.type() === 'DATE');

    // TODO(stephen): Only in SQT is it possible for a date grouping to be used
    // during querying without that grouping appearing in the GroupBySettings.
    // Remove this when SQT is deprecated and instead rely on GroupBySettings
    // alone to determine if a date grouping is provided.
    const formatDate =
      dateGrouping !== undefined
        ? date => dateGrouping.formatGroupingValue(date)
        : date => date;

    return queryResult.data().map(({ date }) => formatDate(date));
  }

  @memoizeOne
  buildDataPoints(
    queryResult: MapQueryResultData,
    dateIndex: number,
  ): $ReadOnlyArray<MapDataPoint> {
    if (!queryResult.hasDataForDateIndex(dateIndex)) {
      return [];
    }

    return queryResult.data()[dateIndex].datedData;
  }

  @memoizeOne
  getAllValues(
    datapoints: $ReadOnlyArray<MapDataPoint>,
    selectedField: string,
  ): $ReadOnlyArray<number | null> {
    return datapoints.map((d: MapDataPoint) => d.metrics[selectedField]);
  }

  getDataPoints(): $ReadOnlyArray<MapDataPoint> {
    const { controls, queryResult, seriesSettings } = this.props;
    const { dateIndex, disabledColorRules } = this.state;
    const selectedField = controls.selectedField();
    const datapoints = this.buildDataPoints(queryResult, dateIndex);
    const dateActionGroup = seriesSettings.getSeriesDataActionGroup(
      selectedField,
    );
    const allValues = this.getAllValues(datapoints, selectedField);
    // Remove any datapoints that should be filtered out
    const filteredDatapoints = datapoints.filter(datapoint => {
      const dataAction = dateActionGroup.getValueDataAction(
        queryResult.getFieldDataForDate(selectedField, dateIndex),
        datapoint.metrics[selectedField],
      );
      if (dataAction === undefined) {
        return true;
      }
      return !(
        disabledColorRules.has(dataAction.label()) ||
        disabledColorRules.has(dataAction.getRuleString(allValues))
      );
    });

    return filteredDatapoints;
  }

  // NOTE(camden): This is needed as the legend needs rows to include datapoints
  // that are filtered out
  getRows(): $ReadOnlyArray<RowData> {
    const { controls, queryResult, seriesSettings } = this.props;
    const { dateIndex } = this.state;
    const datapoints = this.buildDataPoints(queryResult, dateIndex);
    const selectedField = controls.selectedField();
    const dataActionGroup = seriesSettings.getSeriesDataActionGroup(
      selectedField,
    );
    const allValues = datapoints.map(
      (d: MapDataPoint) => d.metrics[selectedField],
    );
    return dataActionGroup.dataActions().mapValues(dataAction => ({
      color: dataAction.color(),
      label: dataAction.label() || dataAction.getRuleString(allValues),
    }));
  }

  getGeoTiles(): $ReadOnlyArray<Feature> {
    const { geoTiles } = this.state;
    if (geoTiles === undefined) {
      // Fetch the geojson tiles from the server if they have not yet been
      // retrieved.
      if (this._geoTilesRequest === undefined) {
        this._geoTilesRequest = fetchGeoJsonTiles().then(features => {
          this.setState({ geoTiles: features });
        });
      }
      return [];
    }

    return geoTiles;
  }

  @memoizeOne
  buildPrimaryGrouping(
    groupBySettings: GroupBySettings,
  ): QueryResultGrouping | void {
    return buildPrimaryGrouping(groupBySettings);
  }

  getPrimaryGrouping(): QueryResultGrouping | void {
    return this.buildPrimaryGrouping(this.props.groupBySettings);
  }

  /**
   * When the user enters a value in the search box, construct a MapboxGL filter
   * expression that the Marker/Shape layers can use to filter results without
   * having to iterate over the underlying data points. MapboxGL will just apply
   * the filter to the already rendered data.
   */
  @memoizeOne
  buildSearchTextFilter(
    searchText: string,
    groupBySettings: GroupBySettings,
  ): $ReadOnlyArray<mixed> | void {
    const text = searchText.toLowerCase().trim();
    if (text.length === 0) {
      return undefined;
    }

    const dimensions = [];
    groupBySettings.groupings().forEach(grouping => {
      if (grouping.type() === 'STRING') {
        dimensions.push(['get', grouping.id(), ['get', 'dimensions']]);
      }
    });
    if (dimensions.length === 0) {
      return undefined;
    }

    return ['in', text, ['downcase', ['concat', ...dimensions]]];
  }

  getSearchTextFilter(): $ReadOnlyArray<mixed> | void {
    return this.buildSearchTextFilter(
      this.state.searchText,
      this.props.groupBySettings,
    );
  }

  /**
   * Build a filter that will restrict the admin boundary shapes that are drawn.
   */
  @memoizeOne
  buildBackgroundShapeFilter(
    includeLocations: $ReadOnlyArray<AdminBoundaryFilterLocation>,
    excludeLocations: $ReadOnlyArray<AdminBoundaryFilterLocation>,
  ): $ReadOnlyArray<mixed> | void {
    return buildAdminBoundaryFilter(includeLocations, excludeLocations);
  }

  getBackgroundShapeFilter(): $ReadOnlyArray<mixed> | void {
    const { queryResult } = this.props;
    return this.buildBackgroundShapeFilter(
      queryResult.adminBoundaryIncludeLocations(),
      queryResult.adminBoundaryExcludeLocations(),
    );
  }

  @autobind
  onSelectLabel(labelId: string) {
    this.setState(({ disabledLabels }) => {
      if (disabledLabels.has(labelId)) {
        return {
          disabledLabels: disabledLabels.delete(labelId),
        };
      }

      return {
        disabledLabels: disabledLabels.set(labelId, true),
      };
    });
  }

  @autobind
  onSelectColorRule(ruleId: string) {
    this.setState(({ disabledColorRules }) => {
      if (disabledColorRules.has(ruleId)) {
        return {
          disabledColorRules: disabledColorRules.delete(ruleId),
        };
      }

      return {
        disabledColorRules: disabledColorRules.set(ruleId, true),
      };
    });
  }

  @autobind
  onSearchTextChange(searchText: string) {
    this.setState({ searchText });
  }

  @autobind
  onDateIndexChange(dateIndex: number) {
    this.setState({ dateIndex });
  }

  maybeRenderBackgroundShapeLayer(): React.Node {
    const { controls } = this.props;
    if (!controls.showAdminBoundaries()) {
      return null;
    }

    return (
      <BackgroundShapeLayer
        adminBoundariesColor={controls.adminBoundariesColor()}
        adminBoundariesWidth={controls.adminBoundariesWidth()}
        beforeLayerId={controls.showLabels() ? LABEL_LAYER_ID : undefined}
        dimension={controls.selectedGeoTiles()}
        filter={this.getBackgroundShapeFilter()}
        shapes={this.getGeoTiles()}
      />
    );
  }

  maybeRenderDataLabelLayer(): React.Node {
    if (this.props.queryResult.data().length === 0) {
      return null;
    }

    const { controls, scaleFactor } = this.props;
    const grouping = this.getPrimaryGrouping();
    if (!controls.showLabels() || grouping === undefined) {
      return null;
    }
    return (
      <DataPointLabelLayer
        backgroundColor={controls.tooltipBackgroundColor()}
        dataPoints={this.getDataPoints()}
        dimension={grouping.id()}
        disabledLabels={this.state.disabledLabels}
        filter={this.getSearchTextFilter()}
        fontColor={controls.tooltipFontColor()}
        fontFamily={controls.tooltipFontFamily()}
        fontSize={Number.parseInt(controls.tooltipFontSize(), 10) * scaleFactor}
        fontStyle={controls.tooltipBold() ? 'bold' : 'regular'}
        formatFieldValue={this.getFieldValueFormatter()}
        id={LABEL_LAYER_ID}
        labelProperties={controls.selectedLabelsToDisplay()}
      />
    );
  }

  maybeRenderPopup(): React.Node {
    const { activeFeature, onRequestPopupClose, seriesSettings } = this.props;
    if (activeFeature === undefined) {
      return null;
    }

    return (
      <DataPointPopup
        feature={activeFeature}
        formatFieldValue={this.getFieldValueFormatter()}
        grouping={this.getPrimaryGrouping()}
        onRequestClose={onRequestPopupClose}
        seriesSettings={seriesSettings}
      />
    );
  }

  maybeRenderTimeline(): React.Node {
    const {
      controls,
      groupBySettings,
      isHovering,
      onPlaybackSettingsChange,
      queryResult,
    } = this.props;
    const dates = this.buildTimelineDates(queryResult, groupBySettings);
    const dateCount = dates.length;
    const dateGrouping = groupBySettings
      .groupings()
      .values()
      .find(grouping => grouping.type() === 'DATE');

    // If there are less than 2 dates, we don't need to display we don't need to
    // display the timeline.
    if (dateCount < 2 || !dateGrouping) {
      return null;
    }

    // NOTE(nina): Calling displayValueFormat() requires us to implicitly know
    // that the value will be string literals like 'day', 'day of year', etc.
    // Therefore it is not type safe. However, wherever the dateGrouping
    // value is used in this component tree, we make sure to provide a default
    // backup value.
    return (
      <MapTimeline
        dateGrouping={dateGrouping.displayValueFormat()}
        dateIndex={this.state.dateIndex}
        dates={dates}
        isHovering={isHovering}
        onDateIndexChange={this.onDateIndexChange}
        onPlaybackSettingsChange={onPlaybackSettingsChange}
        playbackSettings={controls.playbackSettings()}
      />
    );
  }

  maybeRenderDataLayers(): React.Node {
    if (this.props.queryResult.data().length === 0) {
      return null;
    }
    return (
      <React.Fragment>
        {this.maybeRenderPopup()}
        {this.renderDataLayer()}
        {this.renderOverlays()}
      </React.Fragment>
    );
  }

  maybeRenderLegend(): React.Node {
    const { controls, legendSettings, seriesSettings } = this.props;
    if (!legendSettings.showLegend()) {
      return null;
    }

    return (
      <QueryResultLayerLegend
        controls={controls}
        dataPoints={this.getDataPoints()}
        disabledColorRules={this.state.disabledColorRules}
        disabledLabels={this.state.disabledLabels}
        inputRows={this.getRows()}
        legendSettings={legendSettings}
        onSelectColorRule={this.onSelectColorRule}
        onSelectLabel={this.onSelectLabel}
        seriesSettings={seriesSettings}
      />
    );
  }

  renderMarkerLayer(): React.Node {
    const { controls, id, queryResult } = this.props;
    const selectedField = controls.selectedField();
    return (
      <MarkerLayer
        beforeLayerId={controls.showLabels() ? LABEL_LAYER_ID : undefined}
        dataPoints={this.getDataPoints()}
        fieldMaximum={queryResult.fieldMaximum(selectedField)}
        filter={this.getSearchTextFilter()}
        id={id}
        markerColor={this.getFeatureColorGenerator()}
        scaleMarker={controls.currentDisplay() === 'scaled-dots'}
        selectedField={selectedField}
      />
    );
  }

  renderHeatLayer(): React.Node {
    const { controls, id, queryResult } = this.props;
    const selectedField = controls.selectedField();
    return (
      <HeatLayer
        beforeLayerId={controls.showLabels() ? LABEL_LAYER_ID : undefined}
        dataPoints={this.getDataPoints()}
        fieldMaximum={queryResult.fieldMaximum(selectedField)}
        id={id}
        selectedField={selectedField}
      />
    );
  }

  renderShapeLayer(): React.Node {
    const { controls, id } = this.props;
    let beforeLayerId;
    // If admin boundaries are shown, they should be displayed on top of the
    // shape layer (both the colored tiles and the outlines)
    if (controls.showAdminBoundaries()) {
      beforeLayerId = BACKGROUND_LABEL_ID;
    } else {
      beforeLayerId = controls.showLabels() ? LABEL_LAYER_ID : undefined;
    }

    return (
      <ShapeLayer
        beforeLayerId={beforeLayerId}
        dataPoints={this.getDataPoints()}
        filter={this.getSearchTextFilter()}
        id={id}
        shapeColor={this.getFeatureColorGenerator()}
        shapeOutlineWidth={controls.shapeOutlineWidth()}
        shapes={this.getGeoTiles()}
      />
    );
  }

  renderDataLayer(): React.Node {
    const currentDisplay = this.props.controls.currentDisplay();
    if (currentDisplay === 'tiles') {
      return this.renderShapeLayer();
    }
    if (currentDisplay === 'heatmap') {
      return this.renderHeatLayer();
    }
    return this.renderMarkerLayer();
  }

  renderOverlays(): React.Node {
    return (
      <div className="query-result-layer__overlays">
        {this.maybeRenderLegend()}
        {this.maybeRenderTimeline()}
        {this.renderSearchBox()}
      </div>
    );
  }

  renderSearchBox(): React.Node {
    return <SearchBox onChange={this.onSearchTextChange} />;
  }

  render(): React.Node {
    return (
      // NOTE(sophie): The layers are ordered from top/front to bottom/back, since layers
      // that must be displayed before other layers must be added to the map after
      // those layers, since they reference them with the beforeLayerId prop.
      <React.Fragment>
        {this.maybeRenderDataLabelLayer()}
        {this.maybeRenderBackgroundShapeLayer()}
        {this.maybeRenderDataLayers()}
      </React.Fragment>
    );
  }
}
