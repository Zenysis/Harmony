// @flow
import * as React from 'react';

import ElementResizeService from 'services/ui/ElementResizeService';
import HeatTilesQueryResultData from 'models/visualizations/HeatTiles/HeatTilesQueryResultData';
import PlotlyTooltip from 'components/visualizations/common/PlotlyTooltip';
import ProgressBar from 'components/ui/ProgressBar';
import QueryResultGrouping, {
  TIMESTAMP_GROUPING_ID,
} from 'models/core/QueryResultSpec/QueryResultGrouping';
import Visualization from 'components/visualizations/common/Visualization';
import d3Util from 'components/QueryResult/d3Util';
import withScriptLoader from 'components/common/withScriptLoader';
import {
  BACKEND_GRANULARITIES,
  BUCKET_TYPE,
  buildPlotlyDateLabels,
  getBucketForDate,
} from 'components/QueryResult/timeSeriesUtil';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import {
  X_AXIS,
  Y1_AXIS,
} from 'components/visualizations/common/SettingsModal/AxesSettingsTab/constants';
import { autobind, memoizeOne } from 'decorators';
import { truncate } from 'util/stringUtil';
import { visualizationDefaultProps } from 'components/visualizations/common/commonTypes';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import type { RawTimestamp } from 'models/visualizations/HeatTiles/types';
import type {
  VisualizationDefaultProps,
  VisualizationProps,
} from 'components/visualizations/common/commonTypes';

const DIVERGENT_COLORS = [
  '#1F4B99',
  '#6C9FA1',
  '#FFE39F',
  '#D88742',
  '#9E2B0E',
];

const SEQUENTIAL_COLORS = [
  '#FFE39F',
  '#EEB46C',
  '#D78742',
  '#BC5B22',
  '#9E2B0E',
];

const SCALE = [0, 0.25, 0.5, 0.75, 1];
const LOG_SCALE = [0, 1 / 81, 1 / 9, 1 / 3, 1];

const PLOTLY_CONFIG = {
  modeBarButtonsToRemove: [
    'zoomIn2d',
    'zoomOut2d',
    'sendDataToCloud',
    'hoverCompareCartesian',
    'hoverClosestCartesian',
  ],
};

// In SQT, `this.props.groupBySettings` will not contain a QueryResultGrouping
// for our default date type (Month).
// TODO(stephen): Remove this when SQT querying style is removed.
const DEFAULT_DATE_QUERY_RESULT_GROUPING = QueryResultGrouping.create({
  // NOTE(stephen): HeatTiles in SQT defaults to Month.
  displayValueFormat: BACKEND_GRANULARITIES.MONTH,
  id: BACKEND_GRANULARITIES.MONTH,
  label: BACKEND_GRANULARITIES.MONTH,
  type: 'DATE',
});

type HoverData = {
  fieldId: string,
  title: string,
  value: number,
  x: number,
  y: number,
};

type Props = VisualizationProps<'HEATTILES'>;

type State = {
  hoverData: HoverData | void,
};

class HeatTiles extends React.PureComponent<Props, State> {
  static defaultProps: VisualizationDefaultProps<'HEATTILES'> = {
    ...visualizationDefaultProps,
    queryResult: HeatTilesQueryResultData.create({}),
  };

  state = {
    hoverData: undefined,
  };

  graphElt: ?HTMLDivElement;
  resizeRegistration = ElementResizeService.register<HTMLDivElement>(
    this.onResize,
    (elt: HTMLDivElement | null | void) => {
      this.graphElt = elt;
    },
  );

  componentDidMount() {
    this.createPlot();
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props !== prevProps) {
      this.createPlot();
    }
  }

  createPlot() {
    if (!this.graphElt) {
      return;
    }

    window.Plotly.newPlot(
      this.graphElt,
      this.getGraphData(),
      this.getGraphLayout(),
      PLOTLY_CONFIG,
    );

    if (this.graphElt) {
      const { graphElt } = this;

      // $FlowExpectedError[prop-missing] - plotly event
      graphElt.on('plotly_hover', this.onHoverStart);

      // $FlowExpectedError[prop-missing] - plotly event
      graphElt.on('plotly_unhover', this.onHoverEnd);
      this.fixYAxisLabels();
    }
  }

  getGraphLayout() {
    const { axesSettings } = this.props;
    const xAxis = axesSettings[X_AXIS]();
    const yAxis = axesSettings[Y1_AXIS]();

    const layout = {
      autosize: true,
      margin: {
        b: 160,
        l: this.props.controls.showTimeOnYAxis() ? 130 : 170,
        r: 110,
        t: 0,
      },
      xaxis: {
        showticklabels: true,
        tickfont: {
          size: parseInt(xAxis.labelsFontSize(), 10),
        },
        ticks: '',
        title: xAxis.title(),
        titlefont: {
          size: parseInt(xAxis.titleFontSize(), 10),
        },
        type: 'category',
      },
    };

    if (this.props.controls.showTimeOnYAxis()) {
      // $FlowExpectedError[prop-missing] - its okay to mutate the object here, we're being safe
      layout.yaxis = {
        showticklabels: true,
        tickfont: {
          size: parseInt(yAxis.labelsFontSize(), 10),
        },
        ticks: '',
        title: yAxis.title(),
        titlefont: {
          size: parseInt(yAxis.titleFontSize(), 10),
        },
        type: 'category',
      };
    }

    return layout;
  }

  // Plotly doesn't support text wrapping, so we need to use a d3 utility to
  // wrap the text when it is too long.
  fixYAxisLabels() {
    // Only need to do this if we are showing fields on the y-axis
    if (this.props.controls.showTimeOnYAxis()) {
      return;
    }

    const yAxis = this.props.axesSettings[Y1_AXIS]();

    const subplot = window.Plotly.d3
      .select(this.graphElt)
      .select('.main-svg .subplot.xy');
    // The width we have available is how offset the main heat tile is along
    // the x axis.
    const width = parseFloat(subplot.select('rect.bg').attr('x'));
    // Wrap text to avoid overflow, include a margin on width.
    subplot
      .selectAll('.yaxislayer text')
      .call(d3Util.wrapText, width - 10, yAxis.labelsFontSize());
  }

  getTruncatedIndicatorName(indicatorId) {
    return truncate(
      this.props.seriesSettings.seriesObjects()[indicatorId].label(),
    );
  }

  getColorScale() {
    const {
      divergentColoration,
      invertColoration,
      logScaling,
    } = this.props.controls.modelValues();
    const colors = divergentColoration ? DIVERGENT_COLORS : SEQUENTIAL_COLORS;
    const scale = logScaling ? LOG_SCALE : SCALE;
    return invertColoration
      ? scale.map((x, i) => [x, colors[colors.length - i - 1]])
      : scale.map((x, i) => [x, colors[i]]);
  }

  @memoizeOne
  buildDateGrouping(groupBySettings: GroupBySettings): QueryResultGrouping {
    return groupBySettings
      .groupings()
      .get(TIMESTAMP_GROUPING_ID, DEFAULT_DATE_QUERY_RESULT_GROUPING);
  }

  getDateGrouping(): QueryResultGrouping {
    return this.buildDateGrouping(this.props.groupBySettings);
  }

  @memoizeOne
  buildDateLabels(
    dates: $ReadOnlyArray<RawTimestamp>,
    useEthiopianDates: boolean,
    grouping: QueryResultGrouping,
  ): $ReadOnlyArray<string> {
    const labels = grouping.formatGroupingValues(
      dates,
      true,
      useEthiopianDates,
      false,
    );

    return buildPlotlyDateLabels(labels);
  }

  getDateLabels() {
    const { controls, queryResult } = this.props;
    return this.buildDateLabels(
      queryResult.dates(),
      controls.useEthiopianDates(),
      this.getDateGrouping(),
    );
  }

  getGraphData() {
    const data = [
      {
        colorscale: this.getColorScale(),
        hoverinfo: 'none',
        type: 'heatmap',
        x: [],
        y: [],
        z: [],
      },
    ];

    const { controls, queryResult, seriesSettings } = this.props;
    const {
      firstYaxisSelections,
      resultLimit,
      selectedField,
      showTimeOnYAxis,
    } = controls.modelValues();
    if (!queryResult.data().length) {
      return data;
    }

    // HACK(nina): $HeatTilesRefactor - This section (including the first if
    // condition) purely translates from using this._series (aggregate endpoint)
    // to the line_graph endpoint. This means many functions are re-implemented
    // here, which will later be factored out into real functions
    const xLabels = [];
    const zLabels = [];
    const dates = queryResult.dates();
    const totals = queryResult.totals();
    const series = resultLimit === -1 ? totals : totals.slice(0, resultLimit);
    if (showTimeOnYAxis) {
      // HACK(stephen): HeatTiles will request data in the exact date
      // granularity that it needs to display data. This means we should not
      // round or modify the dates returned by the backend since it will be in
      // the proper format.
      // TODO(stephen): Remove dependence on timeSeriesUtil or refactor it.
      const dateGranularity = BUCKET_TYPE.NONE;

      series.forEach(obj => {
        if (!xLabels.includes(obj.key)) {
          xLabels.push(obj.key);
        }
      });
      // mimicking functionality of getOrderedDateBuckets
      // TODO(nina): $HeatTilesRefactor - Don't mimic functionality, put this
      // in the right place
      const buckets = {};
      dates.forEach(date => {
        buckets[getBucketForDate(date, dateGranularity)] = true;
      });
      const dateBuckets = Object.keys(buckets);
      const datePrefix = 'yValue_date';

      // mimicking functionality of computeDateTimeSeries
      // TODO(nina): $HeatTilesRefactor - Don't mimic functionality, put this
      // in the right place
      series.forEach(loc => {
        const bucketMean = false;
        const initialValues = loc[`${datePrefix}_${selectedField}`];
        // TODO(nina): I don't like this way of creating bucketedValues, but
        // it may work temporarily until this functionality is moved into
        // a separate function. Pls advise
        let bucketedValues = [];
        if (initialValues) {
          const dateToValue = {};
          const dateToValueCount = {};

          loc.dates.forEach((date, idx) => {
            // Only create date buckets if a value exists
            if (
              initialValues[idx] === null ||
              Number.isNaN(initialValues[idx])
            ) {
              return;
            }
            const dateBucket = getBucketForDate(date, dateGranularity);

            if (!dateToValue[dateBucket]) {
              dateToValue[dateBucket] = 0;
              dateToValueCount[dateBucket] = 0;
            }
            dateToValue[dateBucket] += initialValues[idx];
            dateToValueCount[dateBucket] += 1;
          });

          bucketedValues = dateBuckets.map(dateBucket => {
            if (bucketMean) {
              return dateToValue[dateBucket] / dateToValueCount[dateBucket];
            }
            return dateToValue[dateBucket];
          });
        }
        if (!zLabels.length) {
          bucketedValues.forEach(value => {
            zLabels.push([value]);
          });
        } else {
          bucketedValues.forEach((value, idx) => {
            zLabels[idx].push(value);
          });
        }
      });

      data[0].x = xLabels;

      // $FlowFixMe[incompatible-type]
      data[0].y = this.getDateLabels();
      data[0].z = zLabels;
    } else {
      const seriesObjects = seriesSettings.seriesObjects();
      firstYaxisSelections.forEach(fieldId => {
        // TODO(nina): Remove this condition when controls are synced with
        // updating query selections
        const seriesObject = seriesObjects[fieldId];
        if (seriesObject === undefined) {
          return;
        }

        const ys = [];
        totals.forEach(bar => {
          const pushValue = Array.isArray(bar[`yValue_date_${fieldId}`])
            ? bar[`yValue_date_${fieldId}`][0]
            : bar[`yValue_date_${fieldId}`];
          ys.push(pushValue);
          xLabels.push(bar.key);
        });
        data[0].y.push(seriesObject.label());
        data[0].z.push(ys);
      });

      data[0].x = xLabels;
    }

    return data;
  }

  @autobind
  onHoverStart({
    points,
  }: {
    points: $ReadOnlyArray<{
      curveNumber: number,
      data: { tooltipData: { fieldId: string, key: string } },
      pointNumber: [number, number],
      x: string,
      y: string,
      z: number,
    }>,
  }) {
    if (points.length === 0) {
      return;
    }

    const { controls } = this.props;
    const { pointNumber, x, z } = points[0];
    const showTimeOnYAxis = controls.showTimeOnYAxis();
    this.setState({
      hoverData: {
        fieldId: showTimeOnYAxis
          ? controls.selectedField()
          : controls.firstYaxisSelections()[pointNumber[0]],
        title: x,
        value: z,
        x: pointNumber[1],
        y: pointNumber[0],
      },
    });
  }

  @autobind
  onHoverEnd() {
    this.setState({ hoverData: undefined });
  }

  @autobind
  onResize() {
    if (this.graphElt) {
      window.Plotly.Plots.resize(this.graphElt);
    }
  }

  maybeRenderTooltip() {
    const { hoverData } = this.state;
    if (hoverData === undefined) {
      return null;
    }

    const { controls, queryResult, seriesSettings } = this.props;
    const { fieldId, title, value, x, y } = hoverData;
    const seriesObject = seriesSettings.getSeriesObject(fieldId);
    if (seriesObject === undefined) {
      return null;
    }

    const rows = [];
    if (controls.showTimeOnYAxis()) {
      const dateGrouping = this.getDateGrouping();
      rows.push({
        label: dateGrouping.label() || '',
        value: dateGrouping.formatGroupingValue(
          queryResult.dates()[y],
          true,
          controls.useEthiopianDates(),
        ),
      });
    }
    rows.push({
      label: seriesObject.label(),
      value: seriesObject.formatFieldValue(value),
    });
    return (
      <PlotlyTooltip
        plotContainer={this.graphElt}
        rows={rows}
        title={title}
        x={x}
        y={y}
      />
    );
  }

  render() {
    return (
      <Visualization loading={this.props.loading}>
        <div
          ref={this.resizeRegistration.setRef}
          className="heattile-visualization"
        />
        {this.maybeRenderTooltip()}
      </Visualization>
    );
  }
}

export default (withScriptLoader(HeatTiles, {
  loadingNode: <ProgressBar enabled />,
  scripts: [VENDOR_SCRIPTS.plotly],
}): React.AbstractComponent<
  React.Config<Props, VisualizationDefaultProps<'HEATTILES'>>,
>);
