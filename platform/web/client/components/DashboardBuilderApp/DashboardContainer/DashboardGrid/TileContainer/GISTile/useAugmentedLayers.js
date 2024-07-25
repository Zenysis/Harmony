// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import buildModifiedQuerySelections from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/QueryTile/hooks/useAugmentedQuery/buildModifiedQuerySelections';
import type DashboardGISItem from 'models/DashboardBuilderApp/DashboardItem/DashboardGISItem';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

/* Build a local version of the *layers* object so that it can store
 * augmented features that don't get stored to the dashboard. This includes
 * Entity Layers with fetched data, Indicator Layers with dashboard-level
 * filters applied, etc.
 */
function buildLocalCopyOfLayers(
  filteredIndicatorLayers: Zen.Map<IndicatorLayerModel>,
  layersFromDashboardItem: GeoLayers,
  localCopyOfLayers: GeoLayers,
): GeoLayers {
  const newLayers = { ...localCopyOfLayers };
  Object.keys(layersFromDashboardItem).forEach(layerId => {
    const layer = layersFromDashboardItem[layerId];

    // NOTE: This should not happen, but it will satisfy flow
    if (layer === undefined) {
      return;
    }

    // NOTE: For entity layers, we need to make sure we aren't replacing
    // actual data that was stored in the local copy with an undefined value.
    // Otherwise, each entity layer will store no data at all whenever the
    // layers change!
    if (layer.tag === 'ENTITY') {
      const oldLayer = localCopyOfLayers[layerId];
      if (oldLayer && oldLayer.tag === 'ENTITY' && layer.data() === undefined) {
        const loadedData = oldLayer.data();
        newLayers[layerId] = layer.data(loadedData);
      } else {
        newLayers[layerId] = layer;
      }
      return;
    }

    // Currently, the only other type of layer is an Indicator Layer. We have
    // pre-calculated the layer with any dashboard filters applied, so we
    // try to pass that in if possible.
    (layer.tag: 'INDICATOR');
    newLayers[layerId] = filteredIndicatorLayers.get(layerId) || layer;
  });

  return newLayers;
}

/**
 * The useAugmentedLayers hook is responsible for storing and updating a local
 * version of the layers used to populate a GIS map.
 *
 * TODO: The reason we create a local version of layers instead of
 * just passing in a dashboard item's layers directly into the *MapView*
 * component is twofold:
 *
 * 1. Entity layers have a 'data' property that is used to store the entity
 * features that power it. We do not want to store these values to the
 * dashboard, because it would be expensive to do so. Instead, we let the
 * property be 'undefined', and then ask the *MapView* component to fetch
 * and populate the data. By storing a local version of the layers, we can
 * fetch the data without storing it to the dashboard. We are working to update
 * the layer models in the GeoMappingApp so that data for Entity layers can be
 * decoupled from its model, which will remove this reason for using the state
 * paradigm.
 *
 * 2. Dashboard-level filters should be applied to GIS tiles. This means
 * that we need to update the filters applied to layers with the dashboard-level
 * filters. Once again, storing a local version of the layers allows us to do
 * this while still preserving the *true* filters applied to each layer. A user
 * will see the dashboard-level filters applied to a GIS tile, but these filters
 * will not replace the original filters on each layer that are stored to
 * the dashboard. Thus, if a user then *removes* dashboard-level filters, the
 * original filters will still be preserved.
 *
 * It is not best practice for us to store and maintain a local version of
 * our layers. It forces us to keep them in sync with the version that gets
 * stored to the dashboard. Additionally - while it is not currently possible,
 * but may be requested in the future - there may be a situation where a user
 * makes a change directly to the GIS tile and expects those changes to be
 * stored to the dashboard, which will not happen.
 */
export default function useAugmentedLayers(
  dashboardFilterItems: $ReadOnlyArray<QueryFilterItem>,
  item: DashboardGISItem,
): [GeoLayers, (GeoLayer) => void] {
  const indicatorLayersFromDashboardItem = item.indicatorLayers();

  // NOTE: The derived 'allLayers' property will always create a new
  // instance of layersFromDashboardItem, so we try to avoid recalculating it
  // unless the layers used to calculate it (
  // indicatorLayersFromDashboardItem) have actually changed.
  const layersFromDashboardItem = React.useMemo(
    () => item.get('allLayers'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [indicatorLayersFromDashboardItem],
  );

  // Convert the list of dashboard filters to a zen array, which is easier
  // to work with
  const dashboardFilterItemsZenArray = React.useMemo(
    () => Zen.Array.create(dashboardFilterItems),
    [dashboardFilterItems],
  );

  // Build a local copy of Indicator Layers that have dashboard filters applied
  // to them, if any. Precalculating this allows us to easily build the local
  // copy of layers multiple times.
  const filteredIndicatorLayers = React.useMemo(
    () =>
      indicatorLayersFromDashboardItem.map(indicatorLayer => {
        const modifiedQuerySelections = buildModifiedQuerySelections(
          indicatorLayer.querySelections(),
          dashboardFilterItemsZenArray,
          Zen.Array.create(),
        );
        return indicatorLayer.querySelections(modifiedQuerySelections);
      }),
    [dashboardFilterItemsZenArray, indicatorLayersFromDashboardItem],
  );

  // Instantiate a local copy of the layers that will also be maintained here
  const [layers, setLayers] = React.useState<GeoLayers>(
    buildLocalCopyOfLayers(
      filteredIndicatorLayers,
      layersFromDashboardItem,
      {},
    ),
  );

  // Keep the local copy of layers in sync with any changes that come from the
  // dashboard.
  //
  // NOTE: The *layers* property does not need to be added to the
  // dependency array, as its changes are not responsible for flagging
  // changes that come from the dashboard. Also, adding it will trigger an
  // infinite number of *setLayers* calls, since we are always changing the
  // property within this effect.
  React.useEffect(() => {
    const newLayers = buildLocalCopyOfLayers(
      filteredIndicatorLayers,
      layersFromDashboardItem,
      layers,
    );
    setLayers(newLayers);
  }, [filteredIndicatorLayers, layersFromDashboardItem]); // eslint-disable-line react-hooks/exhaustive-deps

  return [layers, onLayerItemChange];
}
