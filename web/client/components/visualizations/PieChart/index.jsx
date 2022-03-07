// @flow
import * as React from 'react';
import { scaleOrdinal } from '@vx/scale';

import PieChartDrilldown from 'components/ui/visualizations/PieChart/PieChartDrilldown';
import PieChartQueryResultData from 'models/visualizations/PieChart/PieChartQueryResultData';
import Visualization from 'components/visualizations/common/Visualization';
import buildDimensionBreakdownRoot from 'components/visualizations/PieChart/buildDimensionBreakdownRoot';
import { DEFAULT_THEME as DRILLDOWN_DEFAULT_THEME } from 'components/ui/visualizations/PieChart/PieChartDrilldown/defaults';
import { autobind, memoizeOne } from 'decorators';
import { visualizationDefaultProps } from 'components/visualizations/common/commonTypes';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type {
  DrilldownValueSelection,
  PieNode,
  Segment,
  PieChartDrilldownTheme,
} from 'components/ui/visualizations/PieChart/PieChartDrilldown/types';
import type { HierarchyNode } from 'models/visualizations/ExpandoTree/types';
import type {
  VisualizationDefaultProps,
  VisualizationProps,
} from 'components/visualizations/common/commonTypes';

type Props = VisualizationProps<'PIE'>;

type PieDrilldownParameters = {
  drilldownLevels: $ReadOnlyArray<string>,
  levelValueFormatter: (dimension: string, value: string | null) => string,
  root: PieNode,
  rootNodeName: string,
  segmentOrder: $ReadOnlyArray<Segment>,
};

// Limit the number of pie segments to show when breaking down by dimension to
// ensure the pie is readable and the number of legend entries is not too large.
// TODO(stephen): Potentially move this to settings.
const MAX_DIMENSION_BREAKDOWN_SEGMENTS = 30;

function formatDimensionValue(
  groupBySettings: GroupBySettings,
  dimension: string,
  value: string | null,
): string {
  const grouping = groupBySettings.groupings().get(dimension);
  return grouping !== undefined
    ? grouping.formatGroupingValue(value, true)
    : value || 'null';
}

export default class PieChart extends React.PureComponent<Props> {
  static defaultProps: VisualizationDefaultProps<'PIE'> = {
    ...visualizationDefaultProps,
    queryResult: PieChartQueryResultData.create({}),
  };

  componentDidUpdate(prevProps: Props) {
    // If the user has changed the way the pie chart breaks down results, we
    // should clear the drilldown selection since it would only have worked for
    // the previous breakdown type.
    const { controls } = this.props;
    if (
      prevProps.controls.breakdown() !== controls.breakdown() &&
      controls.drilldownSelection() !== undefined
    ) {
      this.onDrilldownSelectionChange(undefined);
    }
  }

  // Breakdown results by dimension value. Each segment of the pie will be a
  // different unique dimension value in the result. When the user drills down
  // there will be separate pies for each field.
  @memoizeOne
  buildDimensionBreakdownParameters(
    queryResult: PieChartQueryResultData,
    groupBySettings: GroupBySettings,
    seriesSettings: SeriesSettings,
    palette: $ReadOnlyArray<string>,
  ): PieDrilldownParameters {
    const children = queryResult.root().children || [];
    const seriesOrder = seriesSettings.visibleSeriesOrder();
    const seriesObjects = seriesSettings.seriesObjects();

    // TODO(stephen): Translate this string.
    const [root, childOrder] = buildDimensionBreakdownRoot(
      children,
      seriesOrder,
      MAX_DIMENSION_BREAKDOWN_SEGMENTS,
      '-- Others',
    );

    const colorScale = scaleOrdinal({
      domain: childOrder,
      range: palette,
    });
    const childDimension = children.length > 0 ? children[0].dimension : '';
    return {
      root,
      drilldownLevels: ['fieldId'],
      levelValueFormatter: (key, fieldId) =>
        fieldId !== null && seriesObjects[fieldId] !== undefined
          ? seriesObjects[fieldId].label()
          : fieldId || '',
      rootNodeName: 'Total',
      segmentOrder: childOrder.map(name => ({
        color: colorScale(name),
        id: name,
        label: formatDimensionValue(groupBySettings, childDimension, name),
      })),
    };
  }

  // Breakdown results by field. Each segment of the pie will be a different
  // Field, and when a user drills down, there will be multiple pies for each
  // unique grouping dimension value at that level.
  @memoizeOne
  buildFieldBreakdownParameters(
    queryResult: PieChartQueryResultData,
    groupBySettings: GroupBySettings,
    seriesSettings: SeriesSettings,
    palette: $ReadOnlyArray<string>,
  ): PieDrilldownParameters {
    const queryResultRoot = queryResult.root();

    function buildPieNodes(
      parentLevels: { [string]: string | null, ... },
      parentChildren: $ReadOnlyArray<HierarchyNode> | void,
    ): $ReadOnlyArray<PieNode> | void {
      if (parentChildren === undefined) {
        return undefined;
      }

      return parentChildren.map(({ children, dimension, metrics, name }) => {
        const levels = { ...parentLevels, [dimension]: name };
        return {
          children: buildPieNodes(levels, children),
          levels,
          segments: metrics,
        };
      });
    }

    const seriesObjects = seriesSettings.seriesObjects();
    const seriesOrder = seriesSettings.visibleSeriesOrder();
    const colorScale = scaleOrdinal({
      domain: seriesOrder,
      range: palette,
    });

    return {
      drilldownLevels: queryResult.levels(),
      levelValueFormatter: (dimension, value) =>
        formatDimensionValue(groupBySettings, dimension, value),
      root: {
        children: buildPieNodes({}, queryResultRoot.children),
        levels: {},
        segments: queryResultRoot.metrics,
      },
      rootNodeName: queryResultRoot.name,
      segmentOrder: seriesOrder.map(id => ({
        id,
        color: colorScale(id),
        label: seriesObjects[id] !== undefined ? seriesObjects[id].label() : id,
      })),
    };
  }

  @memoizeOne
  buildTheme(
    displayLabelType: 'percent' | 'raw' | 'both',
  ): PieChartDrilldownTheme {
    const drilldownTheme = { ...DRILLDOWN_DEFAULT_THEME };
    drilldownTheme.pieTheme.displayLabelType = displayLabelType;
    return drilldownTheme;
  }

  getDrilldownParameters(): PieDrilldownParameters {
    const {
      controls,
      groupBySettings,
      seriesSettings,
      queryResult,
    } = this.props;
    if (controls.breakdown() === 'field') {
      return this.buildFieldBreakdownParameters(
        queryResult,
        groupBySettings,
        seriesSettings,
        controls.palette(),
      );
    }
    return this.buildDimensionBreakdownParameters(
      queryResult,
      groupBySettings,
      seriesSettings,
      controls.palette(),
    );
  }

  getTheme(): PieChartDrilldownTheme {
    const { controls } = this.props;
    return this.buildTheme(controls.displayLabelType());
  }

  @autobind
  onDrilldownSelectionChange(
    drilldownSelection: DrilldownValueSelection | void,
  ) {
    this.props.onControlsSettingsChange(
      'drilldownSelection',
      drilldownSelection,
    );
  }

  @autobind
  onSelectedSegmentsChange(selectedSegments: $ReadOnlyArray<string>) {
    this.props.onControlsSettingsChange('selectedSegments', selectedSegments);
  }

  @autobind
  maybeRenderVisualization(height: number, width: number): React.Node {
    const { controls, loading } = this.props;
    if (loading) {
      return null;
    }

    const drilldownParameters = this.getDrilldownParameters();
    return (
      <PieChartDrilldown
        {...drilldownParameters}
        drilldownSelection={controls.drilldownSelection()}
        height={height}
        onDrilldownSelectionChange={this.onDrilldownSelectionChange}
        onSelectedSegmentsChange={this.onSelectedSegmentsChange}
        selectedSegments={controls.selectedSegments()}
        theme={this.getTheme()}
        width={width}
      />
    );
  }

  render(): React.Node {
    return (
      <Visualization loading={this.props.loading}>
        {this.maybeRenderVisualization}
      </Visualization>
    );
  }
}
