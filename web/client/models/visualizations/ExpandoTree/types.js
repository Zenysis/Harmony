// @flow
export type HierarchyNode = {
  children?: $ReadOnlyArray<HierarchyNode>,
  dimension: string,
  name: string,
  metrics: {
    [string]: number | null,
    ...,
  },
};

// This is the node type that the D3-Hierarchy package uses and will produce.
export type D3HierarchyNode = {
  children: $ReadOnlyArray<D3HierarchyNode> | void,
  depth: number,
  dimension: string,
  id: number,
  metrics: {
    [string]: number | null,
  },
  name: string,
  parent?: D3HierarchyNode,
  x: number,
  x0: number,
  y: number,
  y0: number,

  // Zenysis internal properties added to a D3 hierarchy node.
  _cachedSize: number,
  _children: $ReadOnlyArray<D3HierarchyNode> | void,
};
