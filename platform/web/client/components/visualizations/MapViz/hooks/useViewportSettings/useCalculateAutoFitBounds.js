// @flow
import * as React from 'react';
import Promise from 'bluebird';

import calculateQueryResultLayerBounds, {
  updateBoundsFromPointInPlace,
} from 'components/visualizations/MapViz/hooks/useViewportSettings/calculateQueryResultLayerBounds';
import { QUERY_RESULT_LAYER_ID } from 'components/visualizations/MapViz/defaults';
import { cancelPromise } from 'util/promiseUtil';
import type MapQueryResultData from 'models/visualizations/MapViz/MapQueryResultData';
import type { BoundsData } from 'components/visualizations/MapViz/hooks/useViewportSettings/types';
import type { MapboxGLMap } from 'components/ui/visualizations/MapCore/types';

function calculateQueryResultDataBounds(
  queryResult: MapQueryResultData,
): BoundsData | void {
  const bounds = {
    maxLat: -Infinity,
    maxLon: -Infinity,
    minLat: Infinity,
    minLon: Infinity,
  };

  queryResult.data().forEach(({ datedData }) => {
    datedData.forEach(({ lat, lng }) => {
      updateBoundsFromPointInPlace(bounds, parseFloat(lat), parseFloat(lng));
    });
  });

  // Ensure that all the bounds are valid. If any are still Infinity, we were
  // unable to compute the bounds.
  return Object.values(bounds).every(Number.isFinite) ? bounds : undefined;
}

/**
 * Calculate the min/max lat/lon bounds for the query result that is being
 * displayed on a map. If the query result has no data, or the auto-fit setting
 * is not enabled, then the result will be undefined.
 */
export default function useCalculateAutoFitBounds(
  enabled: boolean,
  queryResult: MapQueryResultData,
  currentDisplay: string, // 'dots' | 'tiles' | 'scaled-dots' | 'heatmap'
  mapboxGLInstance: MapboxGLMap | void,
  geoJSONLoaded: boolean,
): BoundsData | void {
  // The internal flow of this hook is a little complicated. We want to first
  // publish the query result bounds so that the map is panned and zoomed to
  // show all the centroid points. Then, once the map is positioned, we want to
  // compute the bounds of the rendered query result layer. These layer bounds
  // will be the most accurate, since they will include the full bounds of any
  // shapes that are drawn.
  // The flow is roughly:
  // 1. `queryResult` changes. Calculate the new bounds using this query result
  //    and return those bounds. Ignore any layer bounds that may have
  //    previously been calculated.
  // 2. Listen for the map to become "idle". When the map is "idle", we know
  //    that the query result layer has finished being drawn.
  // 3. Calculate the bounds of the query result _layer_ and store them in
  //    state. This state change is required to force a new render of the
  //    MapViz.
  // 4. The latest render begins, `queryResult` has not changed, `layerBounds`
  //    has been set, so we want to return `layerBounds`.
  // 5. Wait for `queryResult` to change, and if it does, go to step 1.
  const [layerBounds, setLayerBounds] = React.useState();

  // We use a `ref` to indicate which bounds to return. We want to reduce the
  // delay between a `queryResult` change happening and the map panning, which
  // is why we only store a single value in state (`layerBounds`). The
  // `queryResultDataBounds` can be computed synchronously from `queryResult`,
  // so we don't need to wait an extra render for it to flush. Plus, it
  // simplifies the effect logic.
  const boundsToUse = React.useRef('query');

  // Any time `queryResult` changes, compute new bounds and set the output
  // preference to be the `query` bounds.
  const queryResultDataBounds = React.useMemo(() => {
    boundsToUse.current = 'query';
    return enabled ? calculateQueryResultDataBounds(queryResult) : undefined;
  }, [enabled, queryResult]);

  // When the `queryResultDataBounds` changes, search inside the map to find the
  // features that are drawn on the query layer. This will provide a more
  // accurate bounding area since the `queryResult` only has centroids. Also,
  // if the `currentDisplay` style changes (i.e. from dots to tiles), we need to
  // recalculate the layer bounds.
  React.useEffect(() => {
    // Fall back to the query bounds when the layer bounds are not ready.
    if (
      !enabled ||
      mapboxGLInstance === undefined ||
      queryResultDataBounds === undefined ||
      !geoJSONLoaded
    ) {
      boundsToUse.current = 'query';
      return;
    }

    const callback = () => {
      if (!mapboxGLInstance.getLayer(QUERY_RESULT_LAYER_ID)) {
        return;
      }

      // Search across the features rendered to the map to calculate the most
      // accurate bounds.
      // NOTE: I'm not sure why, but we have to update the ref _before_
      // we set state. If we set state first and then update the ref immediately
      // afterwards, there were issues. I'm not sure why, but maybe there's an
      // internal React optimization happening.
      boundsToUse.current = 'layer';
      setLayerBounds(
        calculateQueryResultLayerBounds(
          mapboxGLInstance,
          queryResultDataBounds,
        ),
      );
    };

    // NOTE: We need to wait for the map to fully finish loading before
    // calculating the bounds for autofitting. To do this, check the
    // `_fullyLoaded` property, which is not part of the documented MapboxGL
    // API but is an attribute on the mapboxGLInstance object.
    // Edge cases/previous approaches
    // (1) Adding an event listener/callback to `idle` events does not work
    // when the map completely renders before this hook is mounted.
    // (2) If the mapboxGLInstance loads before the geojson finished loading,
    // we cannot rely on `_fullyLoaded` since the map will have fully loaded
    // and need to reload. To catch this, check if anything has been drawn via
    // `queryRenderedFeatures` (we can't use `geoJSONLoaded` to determine this
    // because there is a slight lag between the geojson loading and mapbox
    // finishing reloading).
    // TODO: Find a better approach then this loop and update
    // `waitForMapboxMapLoad` as well.
    function waitFor(condition: () => boolean) {
      const poll = resolve => {
        if (condition()) {
          resolve();
        } else {
          setTimeout(() => {
            poll(resolve);
          }, 100);
        }
      };

      return new Promise(poll);
    }

    const promise = waitFor(
      () =>
        mapboxGLInstance._fullyLoaded &&
        mapboxGLInstance.queryRenderedFeatures(undefined, {
          layers: [QUERY_RESULT_LAYER_ID],
        }).length > 0,
    ).then(callback);

    // eslint-disable-next-line consistent-return
    return () => {
      cancelPromise(promise);
    };
  }, [
    currentDisplay,
    enabled,
    geoJSONLoaded,
    mapboxGLInstance,
    queryResultDataBounds,
  ]);

  // NOTE: We need to receive the `enabled` flag, even though it feels
  // counterintuitive, because we can't conditionally call hooks.
  if (!enabled) {
    return undefined;
  }

  if (boundsToUse.current === 'query' || layerBounds === undefined) {
    return queryResultDataBounds;
  }

  return layerBounds;
}
