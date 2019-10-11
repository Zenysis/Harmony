// @noflow
import React from 'react';

import HeatTilesQueryResultData from 'models/visualizations/HeatTiles/HeatTilesQueryResultData';
import ProgressBar from 'components/ui/ProgressBar';
import PropDefs from 'util/PropDefs';
import QueryResultGrouping, {
  TIMESTAMP_GROUPING_ID,
} from 'models/core/QueryResultSpec/QueryResultGrouping';
import ResizeService from 'services/ResizeService';
import Visualization from 'components/visualizations/common/Visualization';
import ZenPropTypes from 'util/ZenPropTypes';
import d3Util from 'components/QueryResult/d3Util';
import memoizeOne from 'decorators/memoizeOne';
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
  // eslint-disable-next-line max-len
} from 'components/visualizations/common/SettingsModal/AxesSettingsTab/constants';
import { truncate } from 'util/stringUtil';
import { uniqueGeoName } from 'components/QueryResult/resultUtil';
import { visualizationPropDefs } from 'components/visualizations/common/commonPropDefs';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';

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
  id: BACKEND_GRANULARITIES.MONTH,
  type: 'DATE',
  // NOTE(stephen): HeatTiles in SQT defaults to Month.
  displayValueFormat: BACKEND_GRANULARITIES.MONTH,
  label: BACKEND_GRANULARITIES.MONTH,
});

const propDefs = PropDefs.create('heatTiles').addGroup(
  visualizationPropDefs
    .propTypes({
      queryResult: HeatTilesQueryResultData.type(),
      resizeService: ZenPropTypes.singleton(ResizeService),
    })
    .defaultProps({
      queryResult: HeatTilesQueryResultData.create(),
      resizeService: ResizeService,
    }),
);

class HeatTiles extends React.PureComponent {
  constructor(props) {
    super(props);

    this.onResize = this.onResize.bind(this);

    this._resizeSubscription = undefined;
    this._series = [];
  }

  componentDidMount() {
    Plotly.newPlot(
      this._graphElt,
      this.getGraphData(),
      this.getGraphLayout(),
      PLOTLY_CONFIG,
    );
    this._resizeSubscription = this.props.resizeService.subscribe(
      this.onResize,
    );
  }

  componentDidUpdate() {
    Plotly.newPlot(this._graphElt, this.getGraphData(), this.getGraphLayout());
    this.fixYAxisLabels();
  }

  componentWillUnmount() {
    // Cancel any outstanding promises
    if (this._queryPromise && this._queryPromise.isPending()) {
      this._queryPromise.cancel();
    }
    this.props.resizeService.unsubscribe(this._resizeSubscription);
  }

  getGraphLayout() {
    const { axesSettings } = this.props;
    const xAxis = axesSettings[X_AXIS]();
    const yAxis = axesSettings[Y1_AXIS]();

    const layout = {
      autosize: true,
      margin: {
        b: 160,
        l: this.props.controls.showTimeOnYAxis ? 130 : 170,
        r: 110,
        t: 0,
      },
      xaxis: {
        title: xAxis.title(),
        titlefont: {
          size: parseInt(xAxis.titleFontSize(), 10),
        },
        showticklabels: true,
        ticks: '',
        tickfont: {
          size: parseInt(xAxis.labelsFontSize(), 10),
        },
      },
    };

    if (this.props.controls.showTimeOnYAxis) {
      layout.yaxis = {
        title: yAxis.title(),
        titlefont: {
          size: parseInt(yAxis.titleFontSize(), 10),
        },
        showticklabels: true,
        ticks: '',
        tickfont: {
          size: parseInt(yAxis.labelsFontSize(), 10),
        },
      };
    }

    return layout;
  }

  // Plotly doesn't support text wrapping, so we need to use a d3 utility to
  // wrap the text when it is too long.
  fixYAxisLabels() {
    // Only need to do this if we are showing fields on the y-axis
    if (this.props.controls.showTimeOnYAxis) {
      return;
    }

    const yAxis = this.props.axesSettings[Y1_AXIS]();

    const subplot = Plotly.d3
      .select(this._graphElt)
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
      invertColoration,
      logScaling,
      divergentColoration,
    } = this.props.controls;
    const colors = divergentColoration ? DIVERGENT_COLORS : SEQUENTIAL_COLORS;
    const scale = logScaling ? LOG_SCALE : SCALE;
    return invertColoration
      ? scale.map((x, i) => [x, colors[colors.length - i - 1]])
      : scale.map((x, i) => [x, colors[i]]);
  }

  @memoizeOne
  buildDateLabels(
    dates: $ReadOnlyArray<string>,
    useEthiopianDates: boolean,
    groupBySettings: GroupBySettings,
  ): $ReadOnlyArray<string> {
    const groupingObject = groupBySettings
      .groupings()
      .get(TIMESTAMP_GROUPING_ID, DEFAULT_DATE_QUERY_RESULT_GROUPING);

    // NOTE(stephen): Disabling simplification of dates since HeatTiles doesn't
    // look great with that date format. More dates are omitted on HeatTiles
    // because the y-axis is normally smaller than x-axis (compared to
    // LineGraph).
    const labels = groupingObject.formatGroupingValues(
      dates,
      true,
      useEthiopianDates,
      false,
    );

    return buildPlotlyDateLabels(labels, true);
  }

  getDateLabels() {
    const { controls, groupBySettings, queryResult } = this.props;
    return this.buildDateLabels(
      queryResult.dates(),
      controls.useEthiopianDates,
      groupBySettings,
    );
  }

  getGraphData() {
    const data = [
      {
        type: 'heatmap',
        x: [],
        y: [],
        z: [],
        colorscale: this.getColorScale(),
      },
    ];

    const { controls, queryResult } = this.props;
    const {
      fields,
      firstYaxisSelections,
      resultLimit,
      selectedField,
      showTimeOnYAxis,
    } = controls;
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
    const series = queryResult.totals().slice(0, resultLimit);
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
      data[0].y = this.getDateLabels();
      data[0].z = zLabels;
    } else {
      firstYaxisSelections.forEach(fieldId => {
        // TODO(nina): Remove this condition when controls are synced with
        // updating query selections
        if (fields.find(field => field.id() === fieldId) === undefined) {
          return;
        }
        const label = fields.find(field => field.id() === fieldId).label();

        const ys = [];
        totals.forEach(bar => {
          const pushValue = Array.isArray(bar[`yValue_date_${fieldId}`])
            ? bar[`yValue_date_${fieldId}`][0]
            : bar[`yValue_date_${fieldId}`];
          ys.push(pushValue);
          xLabels.push(uniqueGeoName(bar.key, bar));
        });
        data[0].y.push(label);
        data[0].z.push(ys);
      });

      data[0].x = xLabels;
    }

    return data;
  }

  onResize() {
    Plotly.Plots.resize(this._graphElt);
  }

  render() {
    return (
      <Visualization loading={this.props.loading}>
        <div
          className="heattile-visualization"
          ref={ref => {
            this._graphElt = ref;
          }}
        />
      </Visualization>
    );
  }
}

PropDefs.setComponentProps(HeatTiles, propDefs);

export default withScriptLoader(HeatTiles, {
  scripts: [VENDOR_SCRIPTS.plotly],
  loadingNode: <ProgressBar enabled />,
});
