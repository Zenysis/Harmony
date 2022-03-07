// @flow
import type {
  DrilldownValueSelection,
  PieNode,
} from 'components/ui/visualizations/PieChart/PieChartDrilldown/types';

type PathEntry = {
  +level: string,
  +node: PieNode,
};

/**
 * Build a path from Root node to Leaf node that will lead to the node that
 * matches the drilldown selection.
 */
export default function buildDrilldownPath(
  root: PieNode,
  drilldownLevels: $ReadOnlyArray<string>,
  drilldownSelection: DrilldownValueSelection | void,
): { isValidSelection: boolean, path: Array<PathEntry> } {
  let node = root;
  const output = {
    isValidSelection: true,
    path: [{ level: '', node }],
  };

  // If nothing is selected, the root node is the only part of the path that
  // will be shown.
  if (drilldownSelection === undefined) {
    return output;
  }

  // Ensure the selected values are valid and in sync with the level order.
  const selectedLevelCount = Object.keys(drilldownSelection).length;
  if (selectedLevelCount > drilldownLevels.length) {
    output.isValidSelection = false;
    return output;
  }

  output.isValidSelection = drilldownLevels
    .slice(0, selectedLevelCount)
    .every(level => {
      const levelValue = drilldownSelection[level];

      // If this level is not found in the selected values map, then the
      // drilldown selection is missing a required level key and is not valid.
      // Also, if the node found does not have children, then we are unable to
      // continue looking for matching nodes which indicates the drilldown
      // selection points to a node that does not exist.
      if (levelValue === undefined || node.children === undefined) {
        return false;
      }

      const matchingChild = node.children.find(
        child => child.levels[level] === levelValue,
      );
      if (matchingChild === undefined) {
        return false;
      }

      node = matchingChild;
      output.path.push({ level, node });
      return true;
    });

  return output;
}
