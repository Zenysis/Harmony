// @flow
import * as React from 'react';

import SimplePopup from 'components/visualizations/MapViz/common/SimplePopup';
import { ENTITY_PROPERTY_LABELS } from 'components/visualizations/MapViz/EntityLayer/defaults';
import type { EventFeature } from 'components/ui/visualizations/MapCore/types';
import type { SerializedEntityProperties } from 'components/visualizations/MapViz/EntityLayer/types';

type Props = {
  feature: EventFeature<SerializedEntityProperties>,
  onRequestClose: (SyntheticMouseEvent<HTMLElement> | Event) => void,
};

function EntityMarkerPopup({ feature, onRequestClose }: Props) {
  const { latitude, longitude, properties } = feature;
  const rows = [];
  ENTITY_PROPERTY_LABELS.forEach(label => {
    if (properties[label] !== undefined) {
      rows.push({ label, value: properties[label] });
    }
  });

  return (
    <SimplePopup
      latitude={latitude}
      longitude={longitude}
      onRequestClose={onRequestClose}
      rows={rows}
      title={properties.Name}
    />
  );
}

export default (React.memo(EntityMarkerPopup): React.AbstractComponent<Props>);
