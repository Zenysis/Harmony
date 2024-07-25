// @flow
import * as React from 'react';

import BackgroundLayerButton from 'components/ui/visualizations/MapCore/BackgroundLayerButton';
import MapCore, {
  NavigationControl,
} from 'components/ui/visualizations/MapCore';
import QueryResultLayer from 'components/visualizations/MapViz/QueryResultLayer';
import QueryScalingContext from 'components/common/QueryScalingContext';
import Visualization from 'components/visualizations/common/Visualization';
import extractFeatureFromEvent from 'components/ui/visualizations/MapCore/extractFeatureFromEvent';
import getFeatureForLayer from 'components/visualizations/MapViz/getFeatureForLayer';
import useBoolean from 'lib/hooks/useBoolean';
import useElementSize from 'lib/hooks/useElementSize';
import useViewportSettings from 'components/visualizations/MapViz/hooks/useViewportSettings';
import { MAP_LAYERS } from 'components/ui/visualizations/MapCore/defaults';
import { QUERY_RESULT_LAYER_ID } from 'components/visualizations/MapViz/defaults';
import type {
  EventFeature,
  MapEvent,
} from 'components/ui/visualizations/MapCore/types';
import type { VisualizationProps } from 'components/visualizations/common/commonTypes';

type Props = VisualizationProps<'MAP'>;

// NOTE: react-map-gl prevents scrolling from being passed to child
// components, which is behavior we don't want, so we prevent react-map-gl from
// receiving the event.
const stopScrollPropagation = event => event.stopPropagation();

function MapViz({
  controls,
  groupBySettings,
  legendSettings,
  loading,
  onControlsSettingsChange,
  queryResult,
  seriesSettings,
}: Props) {
  /** The current feature that a user has clicked/hovered on. */
  const [activeFeature, setActiveFeature] = React.useState<void | EventFeature<{
    ...,
  }>>(undefined);

  /**
   * Allow zoom and pan interactions.
   * Always enable interactions for touch devices since hover
   * mouse events will not fire, only click events
   */
  const [enableInteractions, setEnableInteractions] = React.useState<boolean>(
    navigator.maxTouchPoints > 0,
  );

  /**
   * When a feature is clicked, its popup should remain open even if other
   * features are hovered on. This keeps track of whether we have clicked on
   * the active feature and should keep its popup open.
   */
  const [
    isActiveFeatureClicked,
    setIsActiveFeatureClicked,
  ] = React.useState<boolean>(false);

  /** Flag for when user hovers over map visualization */
  const [isHovering, setIsHovering] = React.useState<boolean>(false);

  /**
   * Reference to the MapboxGL map instance that is created by `react-map-gl`.
   * This is needed for accurately computing the map center and zoom level when
   * we are in auto-fit mode.
   */
  const [mapboxGLInstance, setMapboxGLInstance] = React.useState(undefined);
  const [geoJSONLoaded, setGeoJSONLoaded] = useBoolean(false);

  const [{ height, width }, wrapperRef] = useElementSize({
    height: 10,
    width: 10,
  });

  const context = React.useContext(QueryScalingContext);
  const mapContentRef = React.useRef();

  const scaleFactor = React.useMemo(() => {
    // NOTE: Not all users of the MapViz will provide the query scaling
    // context (like DQL).
    if (context === undefined) {
      return 1;
    }

    // NOTE: Ensure the scale factor is never 0 since it doesn't make
    // sense and can lead to divide by zero errors.
    return context.scaleFactor || 1;
  }, [context]);

  const contentStyle = React.useMemo(() => {
    if (context === undefined) {
      return undefined;
    }

    // NOTE: We are dividing the dimensions by the scale factor because
    // we receive the already-scaled dimensions, so we must unscale. Ideally,
    // we would like to receive the true dimensions from the parent.
    return {
      height: height / scaleFactor,
      transform: `scale(${scaleFactor})`,
      transformOrigin: 'top left',
      width: width / scaleFactor,
    };
  }, [context, height, scaleFactor, width]);

  const [latitude, longitude, zoom, onViewportChange] = useViewportSettings(
    queryResult,
    controls,
    onControlsSettingsChange,
    scaleFactor,
    height,
    width,
    mapboxGLInstance,
    geoJSONLoaded,
  );

  const onRequestPopupClose = React.useCallback(
    () => setActiveFeature(undefined),
    [],
  );

  const onClick = React.useCallback(
    (event: MapEvent): void => {
      if (enableInteractions) {
        const feature = extractFeatureFromEvent(event);
        setActiveFeature(feature);
        setIsActiveFeatureClicked(feature !== undefined);
      }
    },
    [enableInteractions],
  );

  const onHover = React.useCallback(
    (event: MapEvent) => {
      setIsHovering(true);
      if (enableInteractions && !isActiveFeatureClicked) {
        const feature = extractFeatureFromEvent(event);
        setActiveFeature(feature);
      }
    },
    [enableInteractions, isActiveFeatureClicked],
  );

  const onBaseLayerChange = React.useCallback(
    (baseLayer: string) => {
      onControlsSettingsChange('baseLayer', baseLayer);
    },
    [onControlsSettingsChange],
  );

  /**
   * `react-map-gl` tracks all events that happen on the map, whether they occur
   * on the map or on overlays displayed on top of the map. Disable map
   * interactions when the user's mouse is on top of an overlay. Enable them
   * when the mouse is only over the map and not on an overlay.
   */
  const onMouseMove = React.useCallback(
    (event: MapEvent) => {
      const allowInteraction = event.target === mapContentRef.current;

      // Introduce fast path to avoid lots of setState calls when user is
      // interacting with the map.
      if (allowInteraction !== enableInteractions) {
        setEnableInteractions(allowInteraction);
      }
    },
    [enableInteractions, setEnableInteractions],
  );

  const onMouseOut = React.useCallback(() => setIsHovering(false), [
    setIsHovering,
  ]);

  const onPlaybackSettingsChange = React.useCallback(
    newPlaybackSettings =>
      onControlsSettingsChange('playbackSettings', newPlaybackSettings),
    [onControlsSettingsChange],
  );

  return (
    <Visualization loading={loading}>
      <div ref={wrapperRef} className="map-viz-wrapper">
        <MapCore
          className="map-viz"
          enableInteractions={enableInteractions}
          height={height}
          latitude={latitude}
          layerIdsToLoad={[QUERY_RESULT_LAYER_ID]}
          longitude={longitude}
          mapStyle={MAP_LAYERS[controls.baseLayer()]}
          onClick={onClick}
          onHover={onHover}
          onMapLoad={setMapboxGLInstance}
          onMouseMove={onMouseMove}
          onMouseOut={onMouseOut}
          onViewportChange={onViewportChange}
          preserveDrawingBuffer
          width={width}
          zoom={zoom}
        >
          <div
            ref={mapContentRef}
            className="map-viz__content"
            onScroll={stopScrollPropagation}
            style={contentStyle}
          >
            <QueryResultLayer
              activeFeature={getFeatureForLayer(activeFeature, [
                QUERY_RESULT_LAYER_ID,
              ])}
              controls={controls}
              groupBySettings={groupBySettings}
              id={QUERY_RESULT_LAYER_ID}
              isHovering={isHovering}
              legendSettings={legendSettings}
              onGeoJSONLoad={setGeoJSONLoaded}
              onPlaybackSettingsChange={onPlaybackSettingsChange}
              onRequestPopupClose={onRequestPopupClose}
              queryResult={queryResult}
              scaleFactor={scaleFactor}
              seriesSettings={seriesSettings}
            />
            <div className="map-viz__overlays">
              <NavigationControl
                className="map-viz__zoom-control hide-on-export"
                onViewportChange={onViewportChange}
                showCompass={false}
              />
              <BackgroundLayerButton
                baseLayer={controls.baseLayer()}
                onBaseLayerChange={onBaseLayerChange}
              />
            </div>
          </div>
        </MapCore>
      </div>
    </Visualization>
  );
}

export default (React.memo(MapViz): React.AbstractComponent<Props>);
