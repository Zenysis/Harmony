// @flow
import * as React from 'react';

import buildClusteredLayers from 'components/visualizations/MapViz/EntityLayer/EntityMarkerLayer/buildClusteredLayers';
import buildColorMatchExpression from 'components/visualizations/MapViz/EntityLayer/EntityMarkerLayer/buildColorMatchExpression';
import buildLayers from 'components/visualizations/MapViz/EntityLayer/EntityMarkerLayer/buildLayers';
import { Layer, Source } from 'components/ui/visualizations/MapCore';
import type { EntityMarkerLayerStyle } from 'components/visualizations/MapViz/EntityLayer/EntityMarkerLayer/types';
import type { EntityNode } from 'models/visualizations/MapViz/types';
import type {
  Feature,
  FeatureCollection,
  LayerStyle,
} from 'components/ui/visualizations/MapCore/types';

type Props = {
  entityFeatures: $ReadOnlyArray<Feature>,
  entityLevel: string,
  entityNodesForLevel: $ReadOnlyArray<EntityNode>,
  visibleEntityIds: $ReadOnlyArray<string>,

  beforeLayerId?: string | void,
  filter?: $ReadOnlyArray<mixed> | void,
  id?: string,
  selectedEntityType?: string,
};

function EntityMarkerLayer({
  entityFeatures,
  entityLevel,
  entityNodesForLevel,
  visibleEntityIds,
  beforeLayerId = undefined,
  filter = undefined,
  id = 'entity-markers',
  selectedEntityType = undefined,
}: Props) {

  // NOTE(nina): Mapbox has a built in filter expression property that
  // allows us to directly filter on the features that we pass in to the Source
  // component. However, this type of filtering only works on marker layers.
  // If we wanted to filter on clusters (which are controlled through the Source
  // component), then we can't use that functionality. Instead, we need to
  // follow the normal procedure of just filtering the collection before we
  // pass it to Mapbox to generate the layers. This is okay for now,
  // because we will still pass in the generated filter expression below.
  // As a result, only CLUSTERS will not be filtered by the query-level filters.
  const featureCollection = React.useMemo<FeatureCollection>(
    () => ({
      features: entityFeatures.filter(feature => {
        const { entityId } = feature.properties;
        if (entityId !== null && entityId !== undefined) {
          return visibleEntityIds.includes(entityId);
        }
        return false;
      }),
      type: 'FeatureCollection',
    }),
    [entityFeatures, visibleEntityIds],
  );

  // Generate a mapbox-gl filter expression that will make markers visible
  // based on the entity selections AND query-level filters.
  const layerFilter = React.useMemo<$ReadOnlyArray<mixed>>(() => {
    const visibleEntityFilter = [
      'in',
      ['get', 'entityId'],
      ['literal', visibleEntityIds],
    ];
    // If there is no query-level filter applied, we can proceed with just
    // filtering based on entity selections.
    if (filter === undefined) {
      return visibleEntityFilter;
    }
    return ['all', visibleEntityFilter, filter];
  }, [filter, visibleEntityIds]);

  const baseLayer: EntityMarkerLayerStyle = {
    beforeId: beforeLayerId,
    id,
    type: 'circle',
    style: React.useMemo<$Rest<LayerStyle, { type: mixed }>>(
      () => ({
        filter: layerFilter,
        layout: {
          visibility: 'visible',
        },
        paint: {
          'circle-radius': 7,
          'circle-opacity': 0.6,
          'circle-color': [
            'match',
            ['get', entityLevel],
            ...buildColorMatchExpression(entityNodesForLevel),
          ],
        },
      }),
      [entityLevel, entityNodesForLevel, filter],
    ),
  };

  const iconHackLayer: EntityMarkerLayerStyle = {
    beforeId: beforeLayerId,
    type: 'symbol',
  };

  const sourceClusterProperties = undefined;

  const layers: $ReadOnlyArray<EntityMarkerLayerStyle> = [
    baseLayer,
    iconHackLayer,
  ];
  const children: $ReadOnlyArray<
    React.Element<typeof Layer>,
  > = React.useMemo(() => {
    return buildLayers(layers);
  }, [layers]);

  return (
    <Source
      type="geojson"
      data={featureCollection}
      {...sourceClusterProperties}
    >
      {children}
    </Source>
  );
}

export default (React.memo(EntityMarkerLayer): React.AbstractComponent<Props>);
