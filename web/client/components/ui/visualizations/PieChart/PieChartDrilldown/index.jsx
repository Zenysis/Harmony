// @flow
import * as React from 'react';
import classNames from 'classnames';

import PieChart from 'components/ui/visualizations/PieChart';
import PieChartDrilldownLegend from 'components/ui/visualizations/PieChart/PieChartDrilldown/internal/PieChartDrilldownLegend';
import buildDataPointCollection from 'components/ui/visualizations/PieChart/PieChartDrilldown/internal/buildDataPointCollection';
import buildDrilldownPath from 'components/ui/visualizations/PieChart/PieChartDrilldown/internal/buildDrilldownPath';
import calculatePieSize from 'components/ui/visualizations/PieChart/PieChartDrilldown/internal/calculatePieSize';
import useElementSize from 'lib/hooks/useElementSize';
import { DEFAULT_THEME } from 'components/ui/visualizations/PieChart/PieChartDrilldown/defaults';
import type {
  DataPointCollection,
  DrilldownValueSelection,
  PieChartDrilldownTheme,
  PieNode,
  Segment,
} from 'components/ui/visualizations/PieChart/PieChartDrilldown/types';

type Props = {
  /**
   * The order of levels that indicates how this tree was constructed. When a
   * user clicks on a pie in the chart, the next level of pie charts will be
   * shown.
   */
  drilldownLevels: $ReadOnlyArray<string>,

  /**
   * Selected values that represent the current drilldown state. Each level that
   * is currently being drilled down into should have a value set.
   */
  drilldownSelection: DrilldownValueSelection | void,

  /** The height available for the visualization to render within. */
  height: number,

  /** Callback that receives the updated drilldown selection. */
  onDrilldownSelectionChange: (
    selectedDrilldownValues: DrilldownValueSelection | void,
  ) => void,

  /** Callback that receives the updated segments being highlighted. */
  onSelectedSegmentsChange: ($ReadOnlyArray<string>) => void,

  /**
   * The root node if the PieChartDrilldown tree. The root node is the highest
   * summary level, and its children represent the first next level of the tree.
   */
  root: PieNode,

  /** The display name for the root pie chart. */
  rootNodeName: string,

  /** The order that segments should be drawn around the pie. */
  segmentOrder: $ReadOnlyArray<Segment>,

  /** The segments that should be highlighted on the pie charts. */
  selectedSegments: $ReadOnlyArray<string>,

  /** The width available for the visualization to render within. */
  width: number,

  /** Convert a raw value for a given level into a displayable value. */
  levelValueFormatter?: (level: string, value: string | null) => string,

  /** The visual style for the visualization. */
  theme?: PieChartDrilldownTheme,
};

// NOTE(stephen): Need to apply padding to all sides of the inner chart
// container so that pies do not overlap.
const CONTAINER_OFFSET = 10;

/**
 * An interactive visualization showing how values are broken down using Pie
 * charts. Drilldown levels dictate how the pie chart can be drilled down. Each
 * level is more granular than the previous. When the user clicks on a pie chart
 * on the visualization, all the children at the next level will be shown.
 */
function PieChartDrilldown({
  drilldownLevels,
  drilldownSelection,
  height,
  onDrilldownSelectionChange,
  onSelectedSegmentsChange,
  root,
  rootNodeName,
  segmentOrder,
  selectedSegments,
  width,

  levelValueFormatter = (level, value) => (value !== null ? value : 'null'),
  theme = DEFAULT_THEME,
}: Props) {
  const [legendHoverItem, setLegendHoverItem] = React.useState<string | void>(
    undefined,
  );

  // Track the size of the inner chart since the legend size is variable.
  const [size, drilldownWrapperRef] = useElementSize();

  // Build the path of nodes in the tree that will lead to the child that
  // matchess the selected drilldown values.
  const {
    isValidSelection: isDrilldownSelectionValid,
    path,
  } = React.useMemo(
    () => buildDrilldownPath(root, drilldownLevels, drilldownSelection),
    [drilldownLevels, drilldownSelection, root],
  );

  // Validate that the segments the user selected are actually segments that
  // exist in the tree.
  const isSegmentSelectionValid = React.useMemo(() => {
    if (selectedSegments.length === 0) {
      return true;
    }
    const segmentIds = new Set(segmentOrder.map(({ id }) => id));
    return selectedSegments.every(id => segmentIds.has(id));
  }, [segmentOrder, selectedSegments]);

  // If the drilldown selection or segment selection is invalid, reset them
  // on the parent.
  React.useEffect(() => {
    if (!isDrilldownSelectionValid) {
      onDrilldownSelectionChange(undefined);
    }
    if (!isSegmentSelectionValid) {
      onSelectedSegmentsChange([]);
    }
  }, [
    isDrilldownSelectionValid,
    isSegmentSelectionValid,
    onDrilldownSelectionChange,
    onSelectedSegmentsChange,
  ]);

  // If `drilldownSelection` is undefined, this means only the root node needs
  // to be displayed and the legend will not show a path of pies.
  const showingRootPie = drilldownSelection === undefined;

  // Split the path into an array of pies that should be shown in the legend and
  // the pies that should be shown in the main section of the visualization.
  const [legendCollections, primaryCollections] = React.useMemo<
    [$ReadOnlyArray<DataPointCollection>, $ReadOnlyArray<DataPointCollection>],
  >(() => {
    const dataPointCollections = path.map(({ level, node }, idx) => {
      const label =
        idx === 0
          ? rootNodeName
          : levelValueFormatter(level, node.levels[level]);

      return buildDataPointCollection(label, node, segmentOrder);
    });

    if (showingRootPie) {
      return [[], dataPointCollections];
    }

    // NOTE(stephen): This shouldn't happen, but we don't want an invariant
    // since we'd rather have the viz load in a degraded state than crashing.
    const lastSegment = path[path.length - 1];
    const level = drilldownLevels[path.length - 1];
    if (lastSegment === undefined || level === undefined) {
      return [dataPointCollections, []];
    }

    const children = lastSegment.node.children || [];
    return [
      dataPointCollections,
      children.map(childNode =>
        buildDataPointCollection(
          levelValueFormatter(level, childNode.levels[level]),
          childNode,
          segmentOrder,
        ),
      ),
    ];
  }, [
    drilldownLevels,
    levelValueFormatter,
    path,
    rootNodeName,
    segmentOrder,
    showingRootPie,
    // Ensure that the pies rerender when there is a change to the theme
    theme,
  ]);

  const pieSize = React.useMemo(
    () =>
      calculatePieSize(
        size.height - CONTAINER_OFFSET,
        size.width - CONTAINER_OFFSET,
        primaryCollections.length,
        theme.piePadding,
        theme.maxColumns,
      ),
    [primaryCollections, size, theme],
  );

  const highlightedSegments = React.useMemo<$ReadOnlyArray<string>>(
    () =>
      legendHoverItem === undefined
        ? selectedSegments
        : [
            ...selectedSegments.filter(s => s !== legendHoverItem),
            legendHoverItem,
          ],
    [legendHoverItem, selectedSegments],
  );

  // Track the segment the user is hovering over in the legend.
  const onHoverStart = React.useCallback(id => setLegendHoverItem(id), []);
  const onHoverEnd = React.useCallback(() => setLegendHoverItem(undefined), []);

  // When a PieNode is clicked, we want to drilldown into the next level. If
  // the pie node has no children then it cannot be drilled down into.
  function buildOnClick(node: PieNode): (() => void) | void {
    if (node.children === undefined || node.children.length === 0) {
      return undefined;
    }

    return () => onDrilldownSelectionChange(node.levels);
  }

  // When only the root pie is being shown, the legend will be placed on the
  // bottom of the chart. When the user is drilling down, the legend will be
  // placed on the left side.
  const className = classNames('pie-chart-drilldown', {
    'pie-chart-drilldown--single-chart': showingRootPie,
  });
  return (
    <div className={className} style={{ height, width }}>
      <PieChartDrilldownLegend
        collections={legendCollections}
        hoverItem={legendHoverItem}
        onHoverEnd={onHoverEnd}
        onHoverStart={onHoverStart}
        onDrilldownSelectionChange={onDrilldownSelectionChange}
        onSelectedSegmentsChange={onSelectedSegmentsChange}
        segmentOrder={segmentOrder}
        selectedSegments={selectedSegments}
        theme={theme}
        width={!showingRootPie ? '20%' : undefined}
      />
      <div className="pie-chart-drilldown__wrapper" ref={drilldownWrapperRef}>
        <div className="pie-chart-drilldown__charts">
          {primaryCollections.map(({ dataPoints, label, node }) => (
            <PieChart
              key={label}
              dataPoints={dataPoints}
              donut={!showingRootPie}
              height={pieSize}
              highlightedSegments={highlightedSegments}
              onClick={buildOnClick(node)}
              theme={theme.pieTheme}
              title={showingRootPie ? '' : label}
              width={pieSize}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default (React.memo(PieChartDrilldown): React.AbstractComponent<Props>);
