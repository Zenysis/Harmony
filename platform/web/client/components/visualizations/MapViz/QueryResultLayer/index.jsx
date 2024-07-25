// @flow
import * as React from 'react';
import invariant from 'invariant';

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
import usePrevious from 'lib/hooks/usePrevious';
import {
  DEFAULT_BUBBLE_COLOR,
  LABEL_LAYER_ID,
} from 'components/visualizations/MapViz/QueryResultLayer/defaults';
import { cancelPromise } from 'util/promiseUtil';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import type LegendSettings from 'models/core/QueryResultSpec/VisualizationSettings/LegendSettings';
import type MapQueryResultData from 'models/visualizations/MapViz/MapQueryResultData';
import type MapSettings from 'models/visualizations/MapViz/MapSettings';
import type PlaybackSettings from 'models/visualizations/MapViz/PlaybackSettings';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { EventFeature } from 'components/ui/visualizations/MapCore/types';
import type { MapDataPoint } from 'models/visualizations/MapViz/types';
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
  onGeoJSONLoad: () => void,
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

/**
 * Build a callback that can will produce a formatted value for a specific
 * field. If the field has data actions, the data action transformation will
 * be used. Otherwise, the default series settings formatter will be used
 * for the field.
 */
const buildFieldValueFormatter = (
  queryResult: MapQueryResultData,
  dateIndex: number,
  seriesSettings: SeriesSettings,
): ((fieldId: string, value: number | null) => string) => {
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

    // NOTE: it seems really weird to provide a default value and to
    // || it because the result of `getTransformedText` can be void.
    return (
      dataActions.getTransformedText(
        value,
        queryResult.getFieldDataForDate(fieldId, dateIndex),
        defaultFormattedValue,
      ) || defaultFormattedValue
    );
  };
};

const buildTimelineDates = (
  queryResult: MapQueryResultData,
  groupBySettings: GroupBySettings,
): $ReadOnlyArray<string> => {
  const dateGrouping = groupBySettings
    .groupings()
    .values()
    .find(grouping => grouping.type() === 'DATE');
  // TODO: Only in SQT is it possible for a date grouping to be used
  // during querying without that grouping appearing in the GroupBySettings.
  // Remove this when SQT is deprecated and instead rely on GroupBySettings
  // alone to determine if a date grouping is provided.
  const formatDate =
    dateGrouping !== undefined
      ? date => dateGrouping.formatGroupingValue(date)
      : date => date;

  return queryResult.data().map(({ date }) => formatDate(date));
};

const buildFilteredDataPoints = (
  queryResult: MapQueryResultData,
  dateIndex: number,
  disabledColorRules: Zen.Map<true>,
  selectedField: string,
  seriesSettings: SeriesSettings,
): $ReadOnlyArray<MapDataPoint> => {
  if (!queryResult.hasDataForDateIndex(dateIndex)) {
    return [];
  }

  const allDataPoints = queryResult.data()[dateIndex].datedData;
  const dataActionGroup = seriesSettings.getSeriesDataActionGroup(
    selectedField,
  );
  if (dataActionGroup.isEmpty()) {
    return allDataPoints;
  }

  const allValues = allDataPoints.map(d => d.metrics[selectedField]);

  // Remove any datapoints that should be filtered out
  const filteredDatapoints = allDataPoints.filter(dataPoint => {
    const dataAction = dataActionGroup.getValueDataAction(
      queryResult.getFieldDataForDate(selectedField, dateIndex),
      dataPoint.metrics[selectedField],
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
};

// NOTE: This is needed as the legend needs rows to include datapoints
// that are filtered out
const buildRows = (
  queryResult: MapQueryResultData,
  dateIndex: number,
  selectedField: string,
  seriesSettings: SeriesSettings,
): $ReadOnlyArray<RowData> => {
  const dataActionGroup = seriesSettings.getSeriesDataActionGroup(
    selectedField,
  );
  if (
    !queryResult.hasDataForDateIndex(dateIndex) ||
    dataActionGroup.isEmpty()
  ) {
    return [];
  }

  const dataPoints = queryResult.data()[dateIndex].datedData;
  const allValues = dataPoints.map(d => d.metrics[selectedField]);

  return dataActionGroup.dataActions().mapValues(dataAction => ({
    color: dataAction.color(),
    label: dataAction.label() || dataAction.getRuleString(allValues),
  }));
};

/**
 * When the user enters a value in the search box, construct a MapboxGL filter
 * expression that the Marker/Shape layers can use to filter results without
 * having to iterate over the underlying data points. MapboxGL will just apply
 * the filter to the already rendered data.
 */
const buildSearchTextFilter = (
  searchText: string,
  groupBySettings: GroupBySettings,
): $ReadOnlyArray<mixed> | void => {
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
};

/**
 * The QueryResultLayer component is responsible for rendering query result data
 * points on a map. These data points represent a collection of dimensions and
 * metrics associated with a single location. The QueryResultLayer can represent
 * these data points as markers, scaled markers, and as a heatmap style.
 */
export default function QueryResultLayer({
  activeFeature,
  controls,
  groupBySettings,
  id,
  isHovering,
  legendSettings,
  onGeoJSONLoad,
  onPlaybackSettingsChange,
  onRequestPopupClose,
  queryResult,
  scaleFactor,
  seriesSettings,
}: Props): React.Node {
  const [dateIndex, setDateIndex] = React.useState(0);
  const [disabledColorRules, setDisabledColorRules] = React.useState(
    Zen.Map.create(),
  );
  const [disabledLabels, setDisabledLabels] = React.useState(Zen.Map.create());
  /** The geojson tile set that for all admin levels for this deployment. This is an array of features
   * returned from the geoTilesRequest.
   */
  const [geoTiles, setGeoTiles] = React.useState(undefined);
  const [searchText, setSearchText] = React.useState('');
  const prevQueryResult = usePrevious(queryResult);
  const prevControls = usePrevious(controls);

  React.useEffect(() => {
    if (geoTiles !== undefined) {
      return;
    }

    const geoTilesRequest = fetchGeoJsonTiles().then(features => {
      onGeoJSONLoad();
      setGeoTiles(features);
    });
    return () => cancelPromise(geoTilesRequest); // eslint-disable-line consistent-return
  }, [geoTiles, onGeoJSONLoad]);

  const timelineDates = React.useMemo(
    () => buildTimelineDates(queryResult, groupBySettings),
    [groupBySettings, queryResult],
  );

  React.useEffect(() => {
    // Reset the current date index if the number of dates for the query result
    // have changed.
    if (prevQueryResult?.data().length !== queryResult.data().length) {
      if (controls.playbackSettings().startFromMostRecentDate()) {
        const newDateIndex = timelineDates.length - 1;
        // If no data has yet to come in, don't allow negative indices
        setDateIndex(newDateIndex > 0 ? newDateIndex : 0);
      } else {
        setDateIndex(0);
      }
    }
    // Must reset all disabled tiles to be null, if it is being changed to a heatmap
    // as there is no way for the user to renable them from heatmap where there
    // is no legend for color rules
    if (
      controls.currentDisplay() === 'heatmap' &&
      prevControls?.currentDisplay() !== 'heatmap'
    ) {
      setDisabledColorRules(Zen.Map.create());
    }
  }, [
    queryResult,
    groupBySettings,
    prevQueryResult,
    controls,
    prevControls,
    timelineDates.length,
  ]);

  const fieldValueFormatter = React.useMemo(
    () => buildFieldValueFormatter(queryResult, dateIndex, seriesSettings),
    [dateIndex, queryResult, seriesSettings],
  );

  /**
   * Create a callback that different layers can use to set feature colors.
   *
   * NOTE: It is cleaner for each child layer to use a single callback
   * like this versus having to receive and pass the correct arguments to the
   * more general DataActionGroup callback.
   */

  const featureColorGenerator = React.useMemo(
    () =>
      buildFeatureColorGenerator(
        controls.selectedField(),
        queryResult.getFieldDataForDate(controls.selectedField(), dateIndex),
        seriesSettings.getSeriesDataActionGroup(controls.selectedField()),
        DEFAULT_BUBBLE_COLOR,
      ),
    [controls, dateIndex, queryResult, seriesSettings],
  );

  const filteredDataPoints = React.useMemo(() => {
    return buildFilteredDataPoints(
      queryResult,
      dateIndex,
      disabledColorRules,
      controls.selectedField(),
      seriesSettings,
    );
  }, [controls, dateIndex, disabledColorRules, queryResult, seriesSettings]);

  const legendRows = React.useMemo(() => {
    return buildRows(
      queryResult,
      dateIndex,
      controls.selectedField(),
      seriesSettings,
    );
  }, [controls, dateIndex, queryResult, seriesSettings]);

  const primaryGrouping = React.useMemo(() => {
    return buildPrimaryGrouping(groupBySettings);
  }, [groupBySettings]);

  const searchTextFilter = React.useMemo(() => {
    return buildSearchTextFilter(searchText, groupBySettings);
  }, [groupBySettings, searchText]);

  /**
   * Build a filter that will restrict the admin boundary shapes that are drawn.
   */

  const backgroundShapeFilter = React.useMemo(() => {
    return buildAdminBoundaryFilter(
      queryResult.adminBoundaryIncludeLocations(),
      queryResult.adminBoundaryExcludeLocations(),
    );
  }, [queryResult]);

  const showDataLabelLayer = React.useMemo(() => {
    return (
      controls.showLabels() &&
      primaryGrouping !== undefined &&
      filteredDataPoints.length > 0
    );
  }, [controls, filteredDataPoints.length, primaryGrouping]);

  const onSelectLabel = (labelId: string) => {
    setDisabledLabels(
      disabledLabels.has(labelId)
        ? disabledLabels.delete(labelId)
        : disabledLabels.set(labelId, true),
    );
  };

  const onSelectColorRule = (ruleId: string) => {
    setDisabledColorRules(
      disabledColorRules.has(ruleId)
        ? disabledColorRules.delete(ruleId)
        : disabledColorRules.set(ruleId, true),
    );
  };

  const maybeRenderBackgroundShapeLayer = (): React.Node => {
    if (!controls.showAdminBoundaries()) {
      return null;
    }

    return (
      <BackgroundShapeLayer
        adminBoundariesColor={controls.adminBoundariesColor()}
        adminBoundariesWidth={controls.adminBoundariesWidth()}
        beforeLayerId={showDataLabelLayer ? LABEL_LAYER_ID : undefined}
        dimension={controls.selectedGeoTiles()}
        filter={backgroundShapeFilter}
        shapes={geoTiles || []}
      />
    );
  };

  const maybeRenderDataLabelLayer = (): React.Node => {
    if (!showDataLabelLayer) {
      return null;
    }

    invariant(
      primaryGrouping !== undefined,
      'Primary grouping cannot be missing if we have chosesn to render the data label layer',
    );

    const displayTiles = controls.currentDisplay() === 'tiles';
    return (
      <DataPointLabelLayer
        backgroundColor={controls.tooltipBackgroundColor()}
        centerAlign={displayTiles}
        dataPoints={filteredDataPoints}
        dimension={primaryGrouping.id()}
        disabledLabels={disabledLabels}
        filter={searchTextFilter}
        fontColor={controls.tooltipFontColor()}
        fontFamily={controls.tooltipFontFamily()}
        fontSize={Number.parseInt(controls.tooltipFontSize(), 10) * scaleFactor}
        fontStyle={controls.tooltipBold() ? 'bold' : 'regular'}
        formatFieldValue={fieldValueFormatter}
        id={LABEL_LAYER_ID}
        labelProperties={controls.selectedLabelsToDisplay()}
      />
    );
  };

  const maybeRenderPopup = (): React.Node => {
    if (activeFeature === undefined) {
      return null;
    }

    return (
      <DataPointPopup
        feature={activeFeature}
        formatFieldValue={fieldValueFormatter}
        grouping={primaryGrouping}
        onRequestClose={onRequestPopupClose}
        seriesSettings={seriesSettings}
      />
    );
  };

  const maybeRenderTimeline = (): React.Node => {
    const dateCount = timelineDates.length;
    const dateGrouping = groupBySettings
      .groupings()
      .values()
      .find(grouping => grouping.type() === 'DATE');

    // If there are less than 2 dates, we don't need to display we don't need to
    // display the timeline.
    if (dateCount < 2 || !dateGrouping) {
      return null;
    }

    // NOTE: Calling displayValueFormat() requires us to implicitly know
    // that the value will be string literals like 'day', 'day of year', etc.
    // Therefore it is not type safe. However, wherever the dateGrouping
    // value is used in this component tree, we make sure to provide a default
    // backup value.
    return (
      <MapTimeline
        dateGrouping={dateGrouping.displayValueFormat()}
        dateIndex={dateIndex}
        dates={timelineDates}
        isHovering={isHovering}
        onDateIndexChange={setDateIndex}
        onPlaybackSettingsChange={onPlaybackSettingsChange}
        playbackSettings={controls.playbackSettings()}
      />
    );
  };

  const maybeRenderLegend = (): React.Node => {
    if (!legendSettings.showLegend()) {
      return null;
    }

    return (
      <QueryResultLayerLegend
        controls={controls}
        dataPoints={filteredDataPoints}
        disabledColorRules={disabledColorRules}
        disabledLabels={disabledLabels}
        inputRows={legendRows}
        legendSettings={legendSettings}
        onSelectColorRule={onSelectColorRule}
        onSelectLabel={onSelectLabel}
        seriesSettings={seriesSettings}
      />
    );
  };

  const markerLayer = (
    <MarkerLayer
      beforeLayerId={showDataLabelLayer ? LABEL_LAYER_ID : undefined}
      dataPoints={filteredDataPoints}
      fieldMaximum={queryResult.fieldMaximum(controls.selectedField())}
      filter={searchTextFilter}
      id={id}
      markerColor={featureColorGenerator}
      scaleMarker={controls.currentDisplay() === 'scaled-dots'}
      selectedField={controls.selectedField()}
    />
  );

  const heatLayer = (
    <HeatLayer
      beforeLayerId={showDataLabelLayer ? LABEL_LAYER_ID : undefined}
      dataPoints={filteredDataPoints}
      fieldMaximum={queryResult.fieldMaximum(controls.selectedField())}
      id={id}
      selectedField={controls.selectedField()}
    />
  );

  const renderShapeLayer = (): React.Node => {
    let beforeLayerId;
    // If admin boundaries are shown, they should be displayed on top of the
    // shape layer (both the colored tiles and the outlines)
    if (controls.showAdminBoundaries()) {
      beforeLayerId = BACKGROUND_LABEL_ID;
    } else {
      beforeLayerId = showDataLabelLayer ? LABEL_LAYER_ID : undefined;
    }

    return (
      <ShapeLayer
        beforeLayerId={beforeLayerId}
        dataPoints={filteredDataPoints}
        filter={searchTextFilter}
        id={id}
        shapeColor={featureColorGenerator}
        shapeOutlineWidth={controls.shapeOutlineWidth()}
        shapes={geoTiles || []}
      />
    );
  };

  const renderDataLayer = (): React.Node => {
    const currentDisplay = controls.currentDisplay();
    if (currentDisplay === 'tiles') {
      return renderShapeLayer();
    }
    if (currentDisplay === 'heatmap') {
      return heatLayer;
    }
    return markerLayer;
  };

  const searchBox = <SearchBox onChange={setSearchText} />;

  const overlays = (
    <div className="query-result-layer__overlays">
      {maybeRenderLegend()}
      {maybeRenderTimeline()}
      {searchBox}
    </div>
  );

  const maybeRenderDataLayers = (): React.Node => {
    if (queryResult.data().length === 0) {
      return null;
    }
    return (
      <React.Fragment>
        {maybeRenderPopup()}
        {renderDataLayer()}
        {overlays}
      </React.Fragment>
    );
  };

  return (
    // NOTE: The layers are ordered from top/front to bottom/back, since layers
    // that must be displayed before other layers must be added to the map after
    // those layers, since they reference them with the beforeLayerId prop.
    <React.Fragment>
      {maybeRenderDataLabelLayer()}
      {maybeRenderBackgroundShapeLayer()}
      {maybeRenderDataLayers()}
    </React.Fragment>
  );
}
