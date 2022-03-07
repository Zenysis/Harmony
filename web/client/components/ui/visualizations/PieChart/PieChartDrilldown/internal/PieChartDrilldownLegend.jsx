// @flow
import * as React from 'react';
import classNames from 'classnames';

import PieChart from 'components/ui/visualizations/PieChart';
import type {
  DataPointCollection,
  DrilldownValueSelection,
  PieChartDrilldownTheme,
  Segment,
} from 'components/ui/visualizations/PieChart/PieChartDrilldown/types';

type Props = {
  collections: $ReadOnlyArray<DataPointCollection>,
  hoverItem: string | void,
  onDrilldownSelectionChange: (
    selectedDrilldownValues: DrilldownValueSelection | void,
  ) => void,
  onHoverEnd: () => void,
  onHoverStart: string => void,
  onSelectedSegmentsChange: ($ReadOnlyArray<string>) => void,
  segmentOrder: $ReadOnlyArray<Segment>,
  selectedSegments: $ReadOnlyArray<string>,
  theme: PieChartDrilldownTheme,
  width?: number | string | void,
};

/**
 * This legend displays both the possible pie segments that exist along with
 * any pie charts that have been drilled down into.
 */
function PieChartDrilldownLegend({
  collections,
  hoverItem,
  onDrilldownSelectionChange,
  onHoverEnd,
  onHoverStart,
  onSelectedSegmentsChange,
  segmentOrder,
  selectedSegments,
  theme,
  width = undefined,
}: Props) {
  const onPieClick = React.useCallback(
    (collectionIdx: number) => {
      // The root pie chart was clicked, so we should clear out the selected
      // drilldown values.
      if (collectionIdx === 0) {
        onDrilldownSelectionChange(undefined);
      } else {
        const parentNode = collections[collectionIdx - 1].node;
        onDrilldownSelectionChange(parentNode.levels);
      }
    },
    [collections, onDrilldownSelectionChange],
  );

  const onSegmentSelect = React.useCallback(
    (id: string) => {
      if (!selectedSegments.includes(id)) {
        onSelectedSegmentsChange([...selectedSegments, id]);
      }
    },
    [onSelectedSegmentsChange, selectedSegments],
  );

  const onSegmentDeselect = React.useCallback(
    (id: string) => {
      if (selectedSegments.includes(id)) {
        onSelectedSegmentsChange(
          selectedSegments.filter(segmentId => segmentId !== id),
        );
      }
    },
    [onSelectedSegmentsChange, selectedSegments],
  );

  function renderLegendRow({ color, id, label }: Segment) {
    const selected = selectedSegments.includes(id);
    const disabled =
      (selectedSegments.length > 0 || hoverItem !== undefined) &&
      !selected &&
      hoverItem !== id;
    const className = classNames('pie-chart-drilldown-legend__legend-row', {
      'pie-chart-drilldown-legend__legend-row--disabled': disabled,
      'pie-chart-drilldown-legend__legend-row--selected': selected,
    });

    const onClick = !selected
      ? () => onSegmentSelect(id)
      : () => onSegmentDeselect(id);
    return (
      <div
        className={className}
        key={id}
        onClick={onClick}
        onMouseOver={() => onHoverStart(id)}
        onMouseLeave={onHoverEnd}
        role="button"
      >
        <div
          className="pie-chart-drilldown-legend__legend-color"
          style={{ backgroundColor: color }}
        />
        <div className="pie-chart-drilldown-legend__legend-value">{label}</div>
      </div>
    );
  }

  const { legendPieSize, pieTheme } = theme;
  const className = classNames('pie-chart-drilldown-legend', {
    'pie-chart-drilldown-legend--horizontal': collections.length === 0,
  });
  const style =
    width !== undefined
      ? { maxWidth: legendPieSize + 200, minWidth: legendPieSize }
      : undefined;
  return (
    <div className={className} style={style}>
      {collections.length > 0 && (
        <div className="pie-chart-drilldown-legend__charts">
          {collections.map(({ dataPoints, label }, idx) => (
            <PieChart
              key={label}
              dataPoints={dataPoints}
              donut={idx > 0}
              height={legendPieSize}
              onClick={() => onPieClick(idx)}
              theme={pieTheme}
              title={label}
              width={legendPieSize}
            />
          ))}
        </div>
      )}
      {segmentOrder.map(renderLegendRow)}
    </div>
  );
}

export default (React.memo(
  PieChartDrilldownLegend,
): React.AbstractComponent<Props>);
