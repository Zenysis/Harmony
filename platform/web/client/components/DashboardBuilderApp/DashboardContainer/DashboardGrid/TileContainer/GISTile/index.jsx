// @flow
import * as React from 'react';

import useAugmentedLayers from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/GISTile/useAugmentedLayers';
import type DashboardGISItem from 'models/DashboardBuilderApp/DashboardItem/DashboardGISItem';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

type Props = {
  /**
   * Common dashboard-level filters that should apply to this tile's
   * layers.
   */
  dashboardFilterItems: $ReadOnlyArray<QueryFilterItem>,
  item: DashboardGISItem,
  onItemChange: DashboardGISItem => void,
};

/**
 * The GISTile renders a map with all the layers and selections specified by the
 * user in the GIS app.
 */
function GISTile({
  dashboardFilterItems,
  item,
  onItemChange,
}: Props): React.Node {
  // Create a local copy of layers from the dashboard item that can support
  // dashboard-level filters without storing these filters to the dashboard.
  //
  // TODO: We also use this hook to store and update the 'data' property
  // for Entity Layers, as that data should not be stored to the dashboard.
  // When we decouple the property from the layer model, we can simplify
  // the use of this hook.
  const [layers, onLayerItemChange] = useAugmentedLayers(
    dashboardFilterItems,
    item,
  );

  // Callback when base map settings change.
  const onMapSettingsChange = React.useCallback(
    mapSettings => {
      onItemChange(item.generalSettings(mapSettings));
    },
    [item, onItemChange],
  );

  return (
    <div className="gd-dashboard-gis-tile">
      <MapView
        layers={layers}
        mapSettings={item.generalSettings()}
        onLayerItemChange={onLayerItemChange}
        onSettingsChange={onMapSettingsChange}
        selectedLayers={item.selectedLayerIds()}
      />
    </div>
  );
}

export default (React.memo(GISTile): React.AbstractComponent<Props>);
