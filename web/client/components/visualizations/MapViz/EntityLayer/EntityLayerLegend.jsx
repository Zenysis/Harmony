// @flow
import * as React from 'react';

import SimpleLegend from 'components/ui/visualizations/MapCore/SimpleLegend';
import SimpleLegendItem from 'components/ui/visualizations/MapCore/SimpleLegend/SimpleLegendItem';
import type EntityLayerProperties from 'models/visualizations/MapViz/EntityLayerProperties';
import type { GroupedEntityMap } from 'models/visualizations/MapViz/types';

type Props = {
  controls: EntityLayerProperties,
  entitySelections: GroupedEntityMap,
  legendPlacement: string,
  selectedEntityType: string,
};

export default function EntityLayerLegend({
  controls,
  entitySelections,
  legendPlacement,
  selectedEntityType,
}: Props): React.Node {
  const rows = React.useMemo<
    $ReadOnlyArray<{ color: string, label: string }>,
  >(() => {
    const selectedEntities = entitySelections[selectedEntityType];

    // HACK(stephen, nina): Certain entity type sections can have non-unique names. In
    // `buildEntityTree` we ensure that these non-unique names all have the same
    // color associated, so it's ok to just omit the non-unique rows.
    const uniqueEntityNames = new Set();
    const output = [];
    selectedEntities.forEach(({ color, name }) => {
      if (!uniqueEntityNames.has(name)) {
        uniqueEntityNames.add(name);
        output.push({ color, label: name });
      }
    });
    return output;
  }, [entitySelections, selectedEntityType]);

  function buildEntityLegend() {
    let legendRows = rows;

    return (
      <SimpleLegendItem
        key="entity-legend"
        rows={legendRows}
        title={selectedEntityType}
      />
    );
  }

  const children = [
    buildEntityLegend(),
  ];

  const filteredChildren = children.filter(Boolean);
  if (filteredChildren.length === 0) {
    return null;
  }

  return (
    <SimpleLegend className={`entity-legend entity-legend--${legendPlacement}`}>
      {filteredChildren}
    </SimpleLegend>
  );
}
