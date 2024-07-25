// @flow
import * as React from 'react';
import { WebMercatorViewport } from '@math.gl/web-mercator';

import useCalculateAutoFitBounds from 'components/visualizations/MapViz/hooks/useViewportSettings/useCalculateAutoFitBounds';
import type MapQueryResultData from 'models/visualizations/MapViz/MapQueryResultData';
import type MapSettings from 'models/visualizations/MapViz/MapSettings';
import type {
  MapboxGLMap,
  ReactMapGLInteractionState,
  Viewport,
} from 'components/ui/visualizations/MapCore/types';

// When the user triggers a change to the viewport, at least one value will be
// set to `true` in the InteractionState.
function isUserTriggeredChange(
  interactionState: ReactMapGLInteractionState | void,
): boolean {
  // NOTE: react-map-gl sets `interactionState.isPanning` to true when
  // the viewport is changed programatically (eg when `autoFitToVisibleData` is
  // true and a user changes the visible data by applying a filter).
  // Remove `isPanning` as an indicator of a user-triggered change since
  // `isDragging` will cover the same interaction use case.
  if (interactionState !== undefined) {
    const { isPanning: unused, ...filteredInteractionState } = interactionState;
    return Object.values(filteredInteractionState).some(Boolean);
  }
  return false;
}

/**
 * This hook computes the center lat/lon and zoom level that the map should be
 * shown at. When the user is in "auto-fit" mode, the center and zoom will be
 * calculated from the query result. Otherwise, the user's manually positioned
 * center and zoom will be used. If the user is in "auto-fit" mode and manually
 * repositions the map, then auto-fit mode will be turned off and the user's
 * manual position will be respected.
 */
export default function useViewportSettings(
  queryResult: MapQueryResultData,
  controls: MapSettings,
  onControlsSettingsChange: (controlKey: string, value: any) => void,
  scaleFactor: number,
  height: number,
  width: number,
  mapboxGLInstance: MapboxGLMap | void,
  geoJSONLoaded: boolean,
): [
  number, // Center latitude
  number, // Center longitude
  number, // Zoom level
  (Viewport, ReactMapGLInteractionState | void) => void, // onViewportChange
] {
  const autoFitToVisibleData = controls.autoFitToVisibleData();
  const persistedZoomLevel = controls.zoomLevel();
  const [persistedLatitude, persistedLongitude] = controls.mapCenter();

  // When the user manipulates the viewport, either by zooming or panning,
  // persist the change in the Map controls.
  // If the function is called because the viewport was programatically
  // adjusted by the autoFit feature in response to a change in data, no-op.
  const onViewportChange = React.useCallback(
    (
      viewport: Viewport,
      interactionState: ReactMapGLInteractionState | void,
    ) => {
      const userTriggeredChange = isUserTriggeredChange(interactionState);

      // If the user did not trigger this change, and the map is currently
      // auto-fitting, then we don't need to do anything. This viewport change
      // might have been caused by a change to the browser width/height.
      if (autoFitToVisibleData && !userTriggeredChange) {
        return;
      }

      // If the user just changed the viewport but we are supposed to be in
      // auto-fit mode, then turn off auto-fit mode and store the new map center
      // and zoom levels.
      if (autoFitToVisibleData) {
        onControlsSettingsChange('autoFitToVisibleData', false);
      }

      // We want to store the zoom level as the generalized zoom level that can
      // work the same on any client. This means we need to reverse any scaling
      // that has been applied to the zoom level. Each zoom level in MapboxGL cuts
      // the meters/pixel distance in half. The  scaled zoom level is
      // Math.log2((2 ** zoomLevel) * scaleFactor), so inverting it gives you this
      // formula.
      // Zoom level docs: https://docs.mapbox.com/help/glossary/zoom-level
      const zoomLevel = viewport.zoom - Math.log2(scaleFactor);
      if (persistedZoomLevel !== zoomLevel) {
        onControlsSettingsChange('zoomLevel', zoomLevel);
      }
      if (
        persistedLatitude !== viewport.latitude ||
        persistedLongitude !== viewport.longitude
      ) {
        onControlsSettingsChange('mapCenter', [
          viewport.latitude,
          viewport.longitude,
        ]);
      }
    },
    [
      autoFitToVisibleData,
      persistedLatitude,
      persistedLongitude,
      persistedZoomLevel,
      onControlsSettingsChange,
      scaleFactor,
    ],
  );

  // Calculate the auto-fit bounds. If auto-fit is not enabled, these bounds
  // will be undefined.
  const autoFitBounds = useCalculateAutoFitBounds(
    autoFitToVisibleData,
    queryResult,
    controls.currentDisplay(),
    mapboxGLInstance,
    geoJSONLoaded,
  );

  // When we have valid auto-fit bounds, convert them into a center lat/lon and
  // zoom level that we can use to position the map.
  const autoFitViewport = React.useMemo(() => {
    if (autoFitBounds === undefined) {
      return undefined;
    }

    const fullViewport = new WebMercatorViewport({ height, width }).fitBounds([
      [autoFitBounds.minLon, autoFitBounds.minLat],
      [autoFitBounds.maxLon, autoFitBounds.maxLat],
    ]);

    // NOTE: Reducing the zoom level slightly since the auto-fit bounds
    // ensure that all features can be shown but do not include any padding.
    // Reducing the zoom makes the features look better.
    const zoom = fullViewport.zoom - 0.1;
    return [fullViewport.latitude, fullViewport.longitude, zoom];
  }, [autoFitBounds, height, width]);

  if (autoFitViewport !== undefined) {
    return [...autoFitViewport, onViewportChange];
  }

  // Include the scaling factor when we are using the manually positioned center
  // and zoom. The zoom level is stored in a scaling-independent way so that it
  // looks the same across all browsers and viz sizes.
  const zoom = persistedZoomLevel + Math.log2(scaleFactor);
  return [persistedLatitude, persistedLongitude, zoom, onViewportChange];
}
