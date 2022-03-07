// @flow
// NOTE(stephen): Heat layer treatment inspired by MapboxGL example:
// https://docs.mapbox.com/mapbox-gl-js/example/heatmap-layer/
import * as React from 'react';

import buildDataPointFeature from 'components/visualizations/MapViz/QueryResultLayer/buildDataPointFeature';
import { Layer, Source } from 'components/ui/visualizations/MapCore';
import type {
  FeatureCollection,
  LayerStyle,
} from 'components/ui/visualizations/MapCore/types';
import type { MapDataPoint } from 'models/visualizations/MapViz/types';

type Props = {
  dataPoints: $ReadOnlyArray<MapDataPoint>,
  fieldMaximum: number,
  id: string,
  selectedField: string,

  beforeLayerId?: string | void,
  colorScale?: $ReadOnlyArray<string>,
  maxZoomLevel?: number,
  /**
   * If the visibility of the layer has been hidden on the map
   *
   * NOTE(nina): The purpose of this flag is to tell react-map-gl whether
   * to hide or show the layer on the map, rather than simply not rendering
   * this component at all. This is important for cases where other layers
   * may point to this layer's ID as its `beforeLayerId`, but cannot be drawn
   * because this layer cannot be found. So, rather than physically removing
   * this layer from the map when we want to hide it, we let react-map-gl
   * do the work. This component is used by both the AQT and the GIS tool, but
   * this prop is only relevant to the GIS tool because it supports layer
   * ordering. Since we have plans to deprecate service mapping from the
   * AQT, this is fine.
   */
  isLayerVisible?: boolean,
};

const DEFAULT_COLOR_SCALE = [
  // Begin color ramp at 0-stop with a 0-transparancy color to create a
  // blur-like effect.
  'rgba(33, 102, 172, 0)',
  'rgb(103, 169, 207)',
  'rgb(209, 229, 240)',
  'rgb(253, 219, 199)',
  'rgb(239, 138, 98)',
  'rgb(255, 201, 101)',
];

function buildColorSteps(
  min: number,
  max: number,
  colors: $ReadOnlyArray<string>,
): $ReadOnlyArray<string | number> {
  const output = [];
  const stepSize = (max - min) / (colors.length - 1);
  colors.forEach((color, idx) => {
    output.push(min + stepSize * idx);
    output.push(color);
  });
  return output;
}

/**
 * Draw a heatmap layer on the map based on the provided data points. As the
 * user zooms in, the heatmap layer will transition into a marker layer that can
 * be interacted with.
 */
function HeatLayer({
  dataPoints,
  fieldMaximum,
  id,
  selectedField,
  beforeLayerId = undefined,
  colorScale = DEFAULT_COLOR_SCALE,
  maxZoomLevel = 10,
  isLayerVisible = true,
}: Props) {
  const featureCollection = React.useMemo<FeatureCollection>(() => {
    const features = dataPoints.map(dataPoint =>
      buildDataPointFeature(dataPoint, {
        coordinates: [Number(dataPoint.lng), Number(dataPoint.lat)],
        type: 'Point',
      }),
    );
    return { features, type: 'FeatureCollection' };
  }, [dataPoints]);

  const heatLayer = React.useMemo<LayerStyle>(
    () => ({
      maxzoom: maxZoomLevel,
      type: 'heatmap',
      layout: {
        visibility: isLayerVisible ? 'visible' : 'none',
      },
      paint: {
        // Increase the heatmap weight based on frequency and value closeness to
        // the field max.
        'heatmap-weight': [
          'interpolate',
          ['linear'],
          ['get', selectedField, ['get', 'metrics']],
          0,
          0,
          fieldMaximum,
          1,
        ],
        // Increase the heatmap color weight weight by zoom level.
        // heatmap-intensity is a multiplier on top of heatmap-weight
        'heatmap-intensity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0,
          1,
          maxZoomLevel,
          3,
        ],
        // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          ...buildColorSteps(0, 1, colorScale),
        ],
        // Adjust the heatmap radius by zoom level.
        'heatmap-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0,
          30,
          maxZoomLevel,
          100,
        ],
        // Transition from heatmap to circle layer by zoom level.
        'heatmap-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          7,
          1,
          maxZoomLevel,
          0,
        ],
      },
    }),
    [colorScale, fieldMaximum, isLayerVisible, maxZoomLevel, selectedField],
  );

  // Create a circle marker layer that will show up when the user has zoomed in.
  const circleLayer = React.useMemo<LayerStyle>(() => {
    const minZoom = maxZoomLevel - 2;
    const metricAccessor = ['get', selectedField, ['get', 'metrics']];
    return {
      minzoom: minZoom,
      paint: {
        // Size circle radius based on its value.
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          minZoom,
          ['interpolate', ['linear'], metricAccessor, 0, 1, fieldMaximum, 7],
          minZoom + 3,
          ['interpolate', ['linear'], metricAccessor, 0, 8, fieldMaximum, 20],
        ],
        // Color circle by its value
        'circle-color': [
          'interpolate',
          ['linear'],
          metricAccessor,
          ...buildColorSteps(0, fieldMaximum, colorScale),
        ],
        'circle-stroke-color': 'white',
        'circle-stroke-width': 1,
        // Transition from heatmap to circle layer by zoom level
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0, 8, 1],
      },
      type: 'circle',
    };
  }, [colorScale, fieldMaximum, maxZoomLevel, selectedField]);

  if (fieldMaximum === 0) {
    return null;
  }

  // NOTE(stephen): Assigning the input ID to the circle layer since that is the
  // only layer that should be interactable.
  return (
    <React.Fragment>
      <Source type="geojson" data={featureCollection}>
        <Layer beforeId={beforeLayerId} id={`${id}-heat`} {...heatLayer} />
        <Layer beforeId={beforeLayerId} id={id} {...circleLayer} />
      </Source>
    </React.Fragment>
  );
}

export default (React.memo(HeatLayer): React.AbstractComponent<Props>);
