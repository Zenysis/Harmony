// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import FullscreenEditContainer from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/EditItemView/FullscreenEditContainer';
import I18N from 'lib/I18N';
import type DashboardGISItem from 'models/DashboardBuilderApp/DashboardItem/DashboardGISItem';

type Props = {
  initialItem: DashboardGISItem,
  onRequestClose: () => void,
  onSaveClick: DashboardGISItem => void,
};

/**
 * This is the edit view for when a GIS item tile is selected to be edited
 * in a dashboard.
 */
function GISEditView({ initialItem, onRequestClose, onSaveClick }: Props) {
  const [currentItem, setCurrentItem] = React.useState<DashboardGISItem>(
    initialItem,
  );

  const onLayersChange = React.useCallback(
    newLayers => {
      const indicatorLayers = {};

      Object.keys(newLayers).forEach(layerId => {
        const layer = newLayers[layerId];
        if (layer === undefined) {
          return;
        }
        switch (layer.tag) {
          case 'INDICATOR': {
            indicatorLayers[layerId] = layer;
            break;
          }
          default:
            (layer.tag: empty);
            break;
        }
      });

      setCurrentItem(
        currentItem
          .indicatorLayers(Zen.Map.create(indicatorLayers)),
      );
    },
    [currentItem, setCurrentItem],
  );

  const onSelectedLayerIdsChange = React.useCallback(
    newSelectedLayerIds =>
      setCurrentItem(currentItem.selectedLayerIds(newSelectedLayerIds)),
    [currentItem, setCurrentItem],
  );

  const onSettingsChange = React.useCallback(
    newSettings => setCurrentItem(currentItem.generalSettings(newSettings)),
    [currentItem, setCurrentItem],
  );

  const onSaveGISItemClick = React.useCallback(() => {
    onSaveClick(currentItem);
  }, [currentItem, onSaveClick]);

  return (
    <FullscreenEditContainer
      disableSave={currentItem.selectedLayerIds().length === 0}
      onRequestClose={onRequestClose}
      onSaveClick={onSaveGISItemClick}
      title={I18N.text('Editing map')}
     />
  );
}

export default (React.memo(GISEditView): React.AbstractComponent<Props>);
