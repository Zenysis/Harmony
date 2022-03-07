// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import BumpChartCore from 'components/ui/visualizations/BumpChart';
import BumpChartQueryResultData from 'models/visualizations/BumpChart/BumpChartQueryResultData';
import Visualization from 'components/visualizations/common/Visualization';
import { DAY_GRANULARITY, formatDatesByGranularity } from 'util/dateUtil';
import { THEMES } from 'components/ui/visualizations/BumpChart/models/BumpChartTheme';
import { TIMESTAMP_GROUPING_ID } from 'models/core/QueryResultSpec/QueryResultGrouping';
import { autobind, memoizeOne } from 'decorators';
import { visualizationDefaultProps } from 'components/visualizations/common/commonTypes';
import type BumpChartTheme from 'components/ui/visualizations/BumpChart/models/BumpChartTheme';
import type QueryResultSeries from 'models/core/QueryResultSpec/QueryResultSeries';
import type { RawTimestamp } from 'models/visualizations/BumpChart/types';
import type {
  VisualizationDefaultProps,
  VisualizationProps,
} from 'components/visualizations/common/commonTypes';

type Props = VisualizationProps<'BUMP_CHART'>;

type State = {
  selectedKeys: Zen.Map<number>,
};

type ValueFormatter = (value: number | string) => string;

export default class BumpChart extends React.PureComponent<Props, State> {
  static defaultProps: VisualizationDefaultProps<'BUMP_CHART'> = {
    ...visualizationDefaultProps,
    queryResult: BumpChartQueryResultData.create({}),
  };

  // HACK(stephen): I want to use a Zen.Map for storage of selectedKeys, but
  // limitations in how visualizationControls are serialized to dashboards
  // prevents me from using that in the `controls` prop. For now, store the
  // object version in `controls` and unpack it when the visualization loads.
  state: State = {
    selectedKeys: Zen.Map.create(this.props.controls.selectedKeys()),
  };

  @memoizeOne
  buildValueFormatter(
    fieldId: string,
    seriesObjects: { +[string]: QueryResultSeries, ... },
  ): ValueFormatter {
    const seriesObj = seriesObjects[fieldId];
    return (value: number | string) => seriesObj.formatFieldValue(value);
  }

  @memoizeOne
  buildDateMapping(
    dates: $ReadOnlyArray<RawTimestamp>,
  ): { +[date: RawTimestamp]: string, ... } {
    const { controls, groupBySettings } = this.props;
    const groupingObject = groupBySettings
      .groupings()
      .get(TIMESTAMP_GROUPING_ID);

    const formattedDates = groupingObject
      ? groupingObject.formatGroupingValues(
          dates,
          true,
          controls.useEthiopianDates(),
          true,
        )
      : formatDatesByGranularity(
          dates,
          DAY_GRANULARITY,
          true,
          controls.useEthiopianDates(),
          true,
        );

    const dateMapping = {};

    dates.forEach((date, index) => {
      dateMapping[date] = formattedDates[index];
    });

    return dateMapping;
  }

  @autobind
  formatDate(date: RawTimestamp): string {
    const { queryResult } = this.props;
    const dates = queryResult.dates();
    const dateMapping = this.buildDateMapping(dates);
    return dateMapping[date];
  }

  // NOTE(stephen): Workaround limitation in how view specific settings are
  // saved to a dashboard. Cannot currently store zenmodels.
  getTheme(): BumpChartTheme {
    const theme = this.props.controls.theme();
    return THEMES[theme];
  }

  getValueFormatter(): ValueFormatter {
    const { controls, seriesSettings } = this.props;
    const fieldId = controls.selectedField();
    const seriesObjects = seriesSettings.seriesObjects();
    // HACK(nina): This is a really bad bandaid fix. Currently there is a bug
    // in AQT where adding indicators, and then removing earlier indicators
    // (NOT the most recent indicator) creates an out of sync issue across
    // visualizations. For the Ranking viz, the page will actually crash
    // when you mouse over the viz. This just prevents that, but will
    // needer a deeper and better fix.
    if (!(fieldId in seriesObjects)) {
      const newFieldId = Object.keys(seriesObjects)[0];
      return this.buildValueFormatter(newFieldId, seriesObjects);
    }
    return this.buildValueFormatter(fieldId, seriesObjects);
  }

  // When a line is clicked, mark the line as selected and set which color index
  // should be shown. As the line is clicked more times, the color index
  // increments. Once there are no more colors left to show, the line is
  // unselected and default behavior takes over (like hovering).
  // TODO(stephen): What happens if the number of available colors changes?
  @autobind
  onLineSelected(key: string) {
    this.setState(({ selectedKeys }) => {
      const nextColorIdx = selectedKeys.get(key, -1) + 1;
      const selectedLineColors = this.getTheme().selectedLineColors();

      const newSelectedKeys =
        nextColorIdx >= selectedLineColors.size()
          ? selectedKeys.delete(key)
          : selectedKeys.set(key, nextColorIdx);

      this.props.onControlsSettingsChange(
        'selectedKeys',
        newSelectedKeys.objectView(),
      );

      // HACK(stephen): Keeping selectedKeys in sync for the controls prop and
      // state while we wait for ZenModel support for visualizationControls on
      // dashboards.
      return {
        selectedKeys: newSelectedKeys,
      };
    });
  }

  @autobind
  maybeRenderBumpChart(height: number, width: number): React.Node {
    const { loading, queryResult } = this.props;
    const dates = queryResult.dates();
    const lines = queryResult.lines();
    if (loading || lines.length === 0) {
      return null;
    }

    // TODO(stephen): There is a type confusion inside flow that is happening
    // that I can't quite figure out. Casting to any for now and need to fix it.
    const theme: any = this.getTheme();
    return (
      <BumpChartCore
        dateFormatter={this.formatDate}
        dates={dates}
        height={height}
        lines={lines}
        onLineSelected={this.onLineSelected}
        selectedKeys={this.state.selectedKeys}
        theme={theme}
        valueFormatter={this.getValueFormatter()}
        width={width}
      />
    );
  }

  render(): React.Node {
    return (
      <Visualization loading={this.props.loading}>
        {this.maybeRenderBumpChart}
      </Visualization>
    );
  }
}
