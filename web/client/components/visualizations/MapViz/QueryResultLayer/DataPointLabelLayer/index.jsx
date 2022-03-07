// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import buildDataPointFeature from 'components/visualizations/MapViz/QueryResultLayer/buildDataPointFeature';
import buildLabelBackground from 'components/visualizations/MapViz/buildLabelBackground';
import {
  Layer,
  Source,
  MapContext,
} from 'components/ui/visualizations/MapCore';
import type { FeatureCollection } from 'components/ui/visualizations/MapCore/types';
import type {
  MapDataPoint,
  MapLabelProperties,
} from 'models/visualizations/MapViz/types';
import type { RGBColor } from 'components/ui/ColorBlock';

type Props = {
  backgroundColor: RGBColor,
  beforeLayerId?: string | void,
  dataPoints: $ReadOnlyArray<MapDataPoint>,
  dimension: string,
  disabledLabels?: Zen.Map<true>,
  filter: $ReadOnlyArray<mixed> | void,
  fontColor: string,
  fontFamily: string,
  fontSize: number,
  fontStyle: 'regular' | 'bold' | 'italic',
  formatFieldValue: (id: string, val: number | null) => string | number,
  id: string,

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
  labelProperties: MapLabelProperties,
};

// We need to predefine the expression because it is too complex to directly
// write out in the text-field property
function getLabelValues(
  labelProperties: MapLabelProperties,
  disabledLabels: Zen.Map<true>,
) {
  const labelValues = [];
  // Only show the labels that are enabled currently
  Object.keys(labelProperties).forEach(labelId => {
    if (!disabledLabels.has(labelProperties[labelId].label)) {
      const { color } = labelProperties[labelId];
      // HACK(nina): We can only append strings, so we need to have a string
      // version of the symbol we want to display
      labelValues.push('■ ');
      labelValues.push({ 'text-color': color });
      labelValues.push(['get', labelId]);
      labelValues.push('\n');
    }
  });

  return labelValues;
}

/**
 * The DataPointLabelLayer provides a way to render text labels for a set of
 * data points on the map. These labels are collision avoidant and won't
 * overlap.
 */
function DataPointLabelLayer({
  backgroundColor,
  dataPoints,
  dimension,
  disabledLabels = Zen.Map.create(),
  filter,
  fontColor,
  fontSize,
  fontStyle,
  formatFieldValue,
  id,
  labelProperties,
  beforeLayerId = undefined,
  isLayerVisible = true,
}: Props) {
  const { map } = React.useContext(MapContext);

  // Create a layer of points to add to the map. The text labels will use these
  // points as their primary position.
  // NOTE(stephen): I originally wanted to just reference an existing source
  // layer (like MarkerLayer/ShapeLayer) and avoid recreating this
  // FeatureCollection. Unfortunately, with the ShapeLayer, multiple text labels
  // per shape would get drawn on the map. I don't know why.
  const featureCollection = React.useMemo<FeatureCollection>(() => {
    const features = dataPoints.map(dataPoint => {
      // We store the value for each selected field in the feature,
      // so that we can easily retrieve and use it later
      const mapLabelValues = {};
      Object.keys(labelProperties).forEach(labelId => {
        mapLabelValues[labelId] = formatFieldValue(
          labelId,
          dataPoint.metrics[labelId],
        );
      });

      return buildDataPointFeature(
        dataPoint,
        {
          coordinates: [Number(dataPoint.lng), Number(dataPoint.lat)],
          type: 'Point',
        },
        {
          ...mapLabelValues,
          title: dataPoint.dimensions[dimension],
        },
      );
    });
    return { features, type: 'FeatureCollection' };
  }, [dataPoints, dimension, formatFieldValue, labelProperties]);

  const alpha = backgroundColor.a;

  // TODO(stephen): Figure out how to customize the fonts for mapboxgl. They
  // have to be loaded by the library (and into the canvas) when the map is
  // initialized, and it appears the best way to set it is using custom tiles
  // on mapbox studio. For now, just apply font-weight customizations.
  const capitalizedFontStyle = fontStyle[0].toUpperCase() + fontStyle.slice(1);
  const layerStyle = {
    id,
    layout: {
      'icon-allow-overlap': true,
      'icon-image': buildLabelBackground(backgroundColor, map),
      'icon-text-fit': 'both',
      'text-field': [
        'format',
        ['get', 'title'],
        '\n',
        ...getLabelValues(labelProperties, disabledLabels),
      ],
      'text-font': [`DIN Offc Pro ${capitalizedFontStyle}`],
      'text-justify': 'left',
      'text-radial-offset': 1.1,
      'text-size': fontSize,
      'text-variable-anchor': [
        'top',
        'bottom',
        'left',
        'right',
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
      ],
      visibility: isLayerVisible ? 'visible' : 'none',
    },
    paint: {
      'icon-opacity': alpha !== null && alpha !== undefined ? alpha : 1,
      'text-color': fontColor,
    },
    type: 'symbol',
  };
  const filterStyle = filter !== undefined ? { filter } : undefined;
  return (
    <Source data={featureCollection} type="geojson">
      <Layer
        beforeId={beforeLayerId}
        id={id}
        {...filterStyle}
        {...layerStyle}
      />
    </Source>
  );
}

export default (React.memo(
  DataPointLabelLayer,
): React.AbstractComponent<Props>);
