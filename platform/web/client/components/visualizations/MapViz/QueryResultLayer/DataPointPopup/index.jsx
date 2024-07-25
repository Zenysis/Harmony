// @flow
import * as React from 'react';

import SimplePopup from 'components/visualizations/MapViz/common/SimplePopup';
import type QueryResultGrouping from 'models/core/QueryResultSpec/QueryResultGrouping';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { EventFeature } from 'components/ui/visualizations/MapCore/types';
import type { MapDataPoint } from 'models/visualizations/MapViz/types';
import type { SerializedDataPointProperties } from 'components/visualizations/MapViz/QueryResultLayer/types';

type Props = {
  feature: EventFeature<SerializedDataPointProperties>,
  formatFieldValue: (fieldId: string, value: number | null) => string,
  grouping: QueryResultGrouping | void,
  onRequestClose: (SyntheticMouseEvent<HTMLElement> | Event) => void,
  seriesSettings: SeriesSettings,
};

type Properties = {
  dimensions: $PropertyType<MapDataPoint, 'dimensions'>,
  metrics: $PropertyType<MapDataPoint, 'metrics'>,
};

const EMPTY_PROPERTIES = { dimensions: {}, metrics: {} };
function deserializeProperties(
  properties: SerializedDataPointProperties,
): Properties {
  const { dimensions, metrics } = properties;
  if (typeof dimensions !== 'string' || typeof metrics !== 'string') {
    return EMPTY_PROPERTIES;
  }
  try {
    const deserializedDimensions = JSON.parse(dimensions);
    const deserializedMetrics = JSON.parse(metrics);
    if (
      typeof deserializedDimensions !== 'object' ||
      typeof deserializedMetrics !== 'object'
    ) {
      return EMPTY_PROPERTIES;
    }

    return {
      dimensions: deserializedDimensions,
      metrics: deserializedMetrics,
    };
  } catch {
    return EMPTY_PROPERTIES;
  }
}

function DataPointPopup({
  feature,
  formatFieldValue,
  grouping,
  onRequestClose,
  seriesSettings,
}: Props) {
  const { latitude, longitude, properties } = feature;
  const { dimensions, metrics } = React.useMemo<Properties>(
    () => deserializeProperties((properties: $Cast)),
    [properties],
  );
  const title = grouping !== undefined ? dimensions[grouping.id()] : undefined;
  const rows = [];
  seriesSettings.seriesOrder().forEach(id => {
    const seriesObject = seriesSettings.getSeriesObject(id);
    if (seriesObject !== undefined && seriesObject.isVisible()) {
      rows.push({
        label: seriesObject.label(),
        value: formatFieldValue(id, metrics[id]),
      });
    }
  });

  return (
    <SimplePopup
      latitude={latitude}
      longitude={longitude}
      onRequestClose={onRequestClose}
      rows={rows}
      title={title}
    />
  );
}

export default (React.memo(DataPointPopup): React.AbstractComponent<Props>);
