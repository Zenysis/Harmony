// @flow
import * as React from 'react';

import Layer from 'components/ui/visualizations/MapCore/internal/Layer';
import MapContext from 'components/ui/visualizations/MapCore/internal/MapContext';
import NavigationControl from 'components/ui/visualizations/MapCore/internal/NavigationControl';
import Source from 'components/ui/visualizations/MapCore/internal/Source';
import { noop } from 'util/util';
import type {
  MapLoadEvent,
  Viewport,
} from 'components/ui/visualizations/MapCore/types';

const MAPBOX_ACCESS_TOKEN = window.__JSON_FROM_BACKEND.mapboxAccessToken;
const MAP_STYLE = {
  zIndex: 1,
};

const MapGL = React.lazy(() =>
  import(
    /* webpackChunkName: "asyncMapChunk" */
    'react-map-gl/dist/es6/components/interactive-map'
  ),
);

type Props = {
  /**
   * NOTE(sophie): if the children require scrolling events, their container
   * div must prevent event propagation (see MapView for example)
   */
  children?: React.Node,
  className: string,
  enableInteractions: boolean,

  height: number | string,

  latitude: number,
  /** List of layer IDs that we want to support interactions for */
  layerIdsToLoad: $ReadOnlyArray<string>,

  longitude: number,

  /** Style for base map */
  mapStyle: string,

  /** Callback for when user clicks on map */
  onClick: () => void,
  onMouseMove: () => void,
  onMouseOut?: () => void,
  onViewportChange: Viewport => void,
  /**
   * NOTE(nina): If you want to export react-map-gl's map for download, this
   * must be set to true.
   */
  preserveDrawingBuffer: boolean,

  width: number | string,
  zoom: number,

  /**
   * The spread operator allows users of the MapCore component to pass in
   * specific props that we don't want to expose in the actual MapGL component.
   * This is useful when a prop needs to be exposed for only one or a few
   * uses of this component. For example, the MapViz component passes in
   * the onHover prop, but the GeoMappingApp does not need to pass in this prop.
   */

  ...
};

/**
 * The MapCore is a UI component representing the react-map-gl component and
 * basic requirements. Users of this component can pass in layers as
 * children, implement their own interactions, etc.
 */
export default function MapCore({
  children,
  enableInteractions,
  layerIdsToLoad,
  zoom,
  onMouseOut = noop,
  ...passThroughProps
}: Props): React.Node {
  const [allowScrollZoom, setAllowScrollZoom] = React.useState(false);
  const [
    loadedInteractiveLayerIds,
    setLoadedInteractiveLayerIds,
  ] = React.useState([]);

  /**
   * NOTE(nina): 'mapShape' refers to the data structure of type
   * MapboxGLMapShape that stores all the necessary information about the style
   * of the map, which helps us determine its loading status, style, etc.
   */
  const [mapShape, setMapShape] = React.useState(undefined);

  /**
   * Function to determine list of layers that have already been loaded
   * into the map.
   *
   * NOTE(nina): The purpose of this callback is to make sure that the map
   * does not try to access a layer that has not yet been drawn.
   */
  const findLoadedLayers = React.useCallback(
    style =>
      layerIdsToLoad.filter(layerId => style.getLayer(layerId) !== undefined),
    [layerIdsToLoad],
  );

  /**
   * NOTE(nina): We want to restrict the layers that support click/hover
   * interactions to a small set. If we just pass our layer IDs directly to
   * Mapbox, it will raise errors if those layers have not yet been drawn to
   * the map. Unfortunately, react-map-gl does not check if the layer exists
   * on the map, so we need to do it ourselves, using findLoadedLayers(). This
   * is not a perfect solution, and will likely need to be iterated on.
   */
  const shouldUpdateLoadedInteractiveLayerIds =
    layerIdsToLoad.length !== loadedInteractiveLayerIds.length;
  React.useEffect(() => {
    if (!mapShape || !shouldUpdateLoadedInteractiveLayerIds) {
      return;
    }

    const onStyleDataChange = ({ style }) => {
      setLoadedInteractiveLayerIds(findLoadedLayers(style));
    };

    mapShape.on('styledata', onStyleDataChange);
    return () => mapShape.off('styledata', onStyleDataChange);
  }, [findLoadedLayers, mapShape, shouldUpdateLoadedInteractiveLayerIds]);

  const getCursor = ({
    isDragging,
    isHovering,
  }: {
    isDragging: boolean,
    isHovering: boolean,
  }) => {
    if (!enableInteractions) {
      return 'default';
    }
    if (isHovering) {
      return 'pointer';
    }
    if (isDragging) {
      return 'grabbing';
    }
    return 'grab';
  };

  /**
   * Callback triggered by Mapbox when the map has finished loading for the
   * first time.
   */
  const onMapLoad = (event: MapLoadEvent) => {
    setMapShape(event.target);
    setLoadedInteractiveLayerIds(findLoadedLayers(event.target.style));
  };

  /**
   * Scroll zoom should only be enabled when the user is currently interacting
   * with the map. Watch for the first click on the map and use this as a sign
   * that the user is now interacting with the map and that scroll zoom should
   * be enabled.
   */
  const onMouseDown = () => setAllowScrollZoom(true);
  const onMapMouseOut = () => {
    setAllowScrollZoom(false);
    onMouseOut();
  };

  return (
    <React.Suspense fallback="">
      <MapGL
        {...passThroughProps}
        allowScrollZoom={allowScrollZoom && enableInteractions}
        attributionControl={false}
        clickRadius={5}
        doubleClickZoom={enableInteractions}
        dragPan={enableInteractions}
        getCursor={getCursor}
        interactiveLayerIds={loadedInteractiveLayerIds}
        mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN}
        onLoad={onMapLoad}
        onMouseDown={onMouseDown}
        onMouseOut={onMapMouseOut}
        scrollZoom={allowScrollZoom && enableInteractions}
        style={MAP_STYLE}
        // NOTE(nina): Even though React expects *zoom* to be a number,
        // the initial load of this component sets it to NaN. In that case,
        // MapGL will throw an error. So we need to always guarantee that the
        // *zoom* property is a valid number.
        zoom={isNaN(zoom) ? 1 : zoom}
      >
        {children}
      </MapGL>
    </React.Suspense>
  );
}

export { Layer, MapContext, NavigationControl, Source };
