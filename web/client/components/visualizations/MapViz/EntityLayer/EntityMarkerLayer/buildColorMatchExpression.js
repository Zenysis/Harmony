// @flow

import type { EntityNode } from 'models/visualizations/MapViz/types';

export default function buildColorMatchExpression(
  entityNodesForLevel: $ReadOnlyArray<EntityNode>,
): $ReadOnlyArray<mixed> {
  const matchOptions = [];
  const addedNodeNames: Set<string> = new Set();
  entityNodesForLevel.forEach(({ color, name }) => {
    // Ensure a node only gets added once. It is possible for multiple nodes
    // to have the same name, however we ensure that they have the same color
    // during parsing so skipping one is allowed.
    if (addedNodeNames.has(name)) {
      return;
    }
    matchOptions.push(name);
    matchOptions.push(color);
    addedNodeNames.add(name);
  });
  // Need to provide a default color if all match cases fall through. Using a
  // transparent color to hide the unmatched points.
  matchOptions.push('rgba(0, 0, 0, 0)');
  return matchOptions;
}
