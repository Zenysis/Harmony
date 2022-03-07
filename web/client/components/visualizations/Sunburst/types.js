// @flow
import type {
  D3HierarchyNode,
  HierarchyNode,
} from 'models/visualizations/ExpandoTree/types';

// NOTE(stephen): Sunburst uses the same data structures as ExpandoTree with
// some tweaks.
export type { HierarchyNode };
export type D3SunburstNode = {
  ...$Exact<D3HierarchyNode>,
  parent?: D3SunburstNode,
  dx: number,
  dx0: number,
  idx: number,
};
