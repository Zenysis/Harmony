// @flow
import * as React from 'react';
import ReactDOMServer from 'react-dom/server';

import LineGraphQueryResultData from 'components/visualizations/LineGraph/models/LineGraphQueryResultData';
import ProgressBar from 'components/ui/ProgressBar';
import QueryResultGrouping, {
  TIMESTAMP_GROUPING_ID,
} from 'models/core/QueryResultSpec/QueryResultGrouping';
import ResizeService from 'services/ResizeService';
import Visualization from 'components/visualizations/common/Visualization';
import withScriptLoader from 'components/common/withScriptLoader';
import {
  BACKEND_GRANULARITIES,
  buildPlotlyDateLabels,
  getForecastFieldId,
} from 'components/QueryResult/timeSeriesUtil';
import { SERIES_COLORS } from 'components/QueryResult/graphUtil';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import {
  Y1_AXIS,
  // eslint-disable-next-line max-len
} from 'components/visualizations/common/SettingsModal/AxesSettingsTab/constants';
import {
  addArrays,
  generateIdToObjectMapping,
  debounce,
  subArrays,
} from 'util/util';
import { autobind, memoizeOne } from 'decorators';
import {
  formatFieldValueForDisplay,
  getFieldSymbol,
  getFieldValueType,
  FIELD_VALUE_TYPES,
} from 'indicator_fields';
import { formatNum } from 'components/QueryResult/resultUtil';
import { truncate } from 'util/stringUtil';
import { visualizationDefaultProps } from 'components/visualizations/common/commonTypes';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import type {
  DataPoint,
  FieldId,
  RawTimestamp,
} from 'components/visualizations/LineGraph/types';
import type { SubscriptionObject } from 'services/ResizeService';
import type { VisualizationProps } from 'components/visualizations/common/commonTypes';

const DEFAULT_LINE_WIDTH = 2;
const DEFAULT_MARKER_SIZE = 4;
const FORECAST_LINE_WIDTH = 3;
const FORECAST_MARKER_SIZE = 5;
const WINDOW_RESIZE_DEBOUNCE_TIMEOUT = 100;

const TIME_TEXT = t('query_result.time');

const PLOTLY_CONFIG = {
  modeBarButtonsToRemove: [
    'zoomIn2d',
    'zoomOut2d',
    'sendDataToCloud',
    'hoverCompareCartesian',
    'hoverClosestCartesian',
  ],
};

// $CycloneIdaiHack
const DEPLOYMENT = window.__JSON_FROM_BACKEND.deploymentName;

type Props = VisualizationProps<'TIME'>;

class LineGraph extends React.PureComponent<Props> {
  _graphElt: $RefObject<'div'> = React.createRef();
  _resizeSubscription: ?SubscriptionObject = undefined;

  static defaultProps = {
    ...visualizationDefaultProps,
    queryResult: LineGraphQueryResultData.create({}),
  };

  componentDidMount() {
    this.createPlot();

    // Watch for resize events so we can adjust the column count.
    this._resizeSubscription = ResizeService.subscribe(
      debounce(this.onResize.bind(this), WINDOW_RESIZE_DEBOUNCE_TIMEOUT),
    );
  }

  componentDidUpdate() {
    this.createPlot();
  }

  componentWillUnmount() {
    if (this._resizeSubscription) {
      ResizeService.unsubscribe(this._resizeSubscription);
    }
  }

  createPlot() {
    const data = this.getPlotlyData();
    if (data.length === 0) {
      return;
    }

    const layout = this.maybeAddAnotations(this.getGraphLayout(), data);
    window.Plotly.newPlot(this._graphElt.current, data, layout, PLOTLY_CONFIG);
  }

  getPlotlyAreaObject(
    key: string,
    lineData: $ReadOnlyArray<DataPoint>,
    fieldId: FieldId,
    sigmaFieldId: string,
    dateLabels: $ReadOnlyArray<string>,
    colorIdx: number,
  ): any {
    // TODO(toshi): If the error field is changed to standard deviation, then we
    // need to change sigma so we don't take the square root anymore.
    // Generate shaded area given a set of values and their corresponding
    // uncertainties.
    let legendText = this.getSeriesTextForGeoAndField(key, fieldId);
    // Sigma is the width of the error band.
    const sigmaData = lineData.map(dataObj => dataObj[sigmaFieldId]);

    legendText = `${t('query_result.time.confidence_interval')}: ${legendText}`;

    // Send xs and ys series to plotly.
    const numericValues = lineData.map(dataObj => dataObj[fieldId]);
    // Modify x and y for area plot.
    // Format:
    //   x = [1, 2, 3, 3, 2, 1]
    //   y = (y_upper(1), y_u(2), y_u(3), y_lower(3), y_l(2), y_l(1))
    const areaXs = dateLabels.concat(dateLabels.slice().reverse());
    const upperBound = addArrays(numericValues, sigmaData);
    const lowerBound = subArrays(numericValues, sigmaData);
    const areaYs = upperBound.concat(lowerBound.reverse());
    // Remove the NaNs or else the area plot goes crazy.
    const goodAreaXs = [];
    const goodAreaYs = [];
    for (let i = 0; i < areaYs.length; i++) {
      if (areaYs[i]) {
        goodAreaXs.push(areaXs[i]);
        goodAreaYs.push(areaYs[i]);
      }
    }

    // Add upper and lower bound values to hover text.
    const toolTipArr = goodAreaYs.map((value, i) =>
      this.getErrorBandToolTip(
        key,
        fieldId,
        value,
        goodAreaYs[goodAreaYs.length - i - 1],
      ),
    );
    return {
      name: legendText,
      x: goodAreaXs,
      y: goodAreaYs,
      text: toolTipArr,
      fill: 'toself',
      // 33 is a hex value that scales the alpha parameter for transparency.
      fillcolor: `${SERIES_COLORS[colorIdx % SERIES_COLORS.length]}33`,
      line: {
        color: `${SERIES_COLORS[colorIdx % SERIES_COLORS.length]}33`,
      },
      // TODO(attila): Why did the hoverinfo on the error bands stop working?
      hoverinfo: 'text',
      hoveron: 'points',
      mode: 'lines+markers',
      marker: {
        size: 5.5,
      },
      showlegend: false,
      type: 'scatter',
      connectgaps: true,
    };
  }

  // $CycloneIdaiHack
  buildTwoFieldCorridor(
    lineData: $ReadOnlyArray<DataPoint>,
    lowerBoundFieldId: string,
    upperBoundFieldId: string,
    dateLabels: $ReadOnlyArray<string>,
    colorIdx: number,
  ): any {
    const lowerBound = lineData.map(dataObj => dataObj[lowerBoundFieldId] || 0);
    const upperBound = lineData.map(dataObj => dataObj[upperBoundFieldId] || 0);
    // To create the area object in plotly, we need to flatten these two series
    // into a single series. To do this, we append the upper bound values
    // after the lower bound values.
    // NOTE(stephen): We have to reverse the fields when placing one after
    // another so plotly will draw them in the correct order on the viz.
    const x = dateLabels.concat(dateLabels.slice().reverse());
    const y = lowerBound.concat(upperBound.slice().reverse());

    return {
      x,
      y,
      fill: 'toself',
      // 33 is a hex value that scales the alpha parameter for transparency.
      fillcolor: `${SERIES_COLORS[colorIdx % SERIES_COLORS.length]}33`,
      line: {
        color: `${SERIES_COLORS[colorIdx % SERIES_COLORS.length]}33`,
      },
      hoverinfo: 'none',
      mode: 'lines+markers',
      marker: {
        size: 5.5,
      },
      showlegend: false,
      type: 'scatter',
      connectgaps: true,
    };
  }

  getPlotlyLineObject(
    lineData: $ReadOnlyArray<DataPoint>,
    fieldId: FieldId,
    dates: $ReadOnlyArray<RawTimestamp>,
    isForecast: boolean,
    colorIdx: number,
  ): any {
    const { key } = lineData[0];
    let showLegend = true;
    let dashStyle = 'None';
    let legendText = this.getSeriesTextForGeoAndField(key, fieldId);

    const timestampToDataPoints = generateIdToObjectMapping(
      lineData,
      TIMESTAMP_GROUPING_ID,
    );
    const numericValues = dates.map(timestamp =>
      timestampToDataPoints[timestamp]
        ? timestampToDataPoints[timestamp][fieldId]
        : undefined,
    );
    const textValues = numericValues.map(val =>
      formatFieldValueForDisplay(val, fieldId),
    );

    let percentDiffs = [];
    const { fields } = this.props;
    const fieldIds = fields.map(fieldObj => fieldObj.id());
    const forecastFieldId = getForecastFieldId(fieldId);
    // For fields that have an associated forecast series, get percent diffs
    if (fieldIds.includes(forecastFieldId)) {
      const forecastValues = lineData.map(dataObj => dataObj[forecastFieldId]);

      // If values are forecasted to be a zero, then return null, otherwise
      // (Observed - Expected) / Expected
      percentDiffs = forecastValues.map((val, index) => {
        if (val === 0) {
          return null;
        }
        // prettier-ignore
        if (numericValues[index] !== undefined) {
          return Math.round(((numericValues[index] - val) / val) * 100);
        }
        return undefined;
      });
    }

    const toolTipArr = textValues.map((value, index) =>
      this.getLineGraphToolTip(key, fieldId, value, percentDiffs, index),
    );

    // Modify line style if this is a forecast
    let numericNonZeroValues = numericValues;
    if (isForecast) {
      legendText = `Forecast: ${legendText}`;
      showLegend = false;
      dashStyle = 'dot';
      // TODO(attila) Make druid return NaN if a dateBucket has 0 count.
      // By defualt we set values of empty time buckets to 0, not good...
      numericNonZeroValues = numericValues.map(val => (val === 0 ? null : val));
    }

    return {
      name: legendText,
      x: this.getDateLabels(),
      y: numericNonZeroValues,
      text: toolTipArr,
      xaxis: 'x',
      yaxis: 'y',
      mode: dates.length === 1 ? 'markers' : 'lines+markers',
      hoverinfo: 'text+x',
      type: 'scatter',
      showlegend: showLegend,
      marker: {
        size: isForecast ? FORECAST_MARKER_SIZE : DEFAULT_MARKER_SIZE,
        symbol: 'square',
        color: SERIES_COLORS[colorIdx % SERIES_COLORS.length],
      },
      line: {
        dash: dashStyle,
        width: isForecast ? FORECAST_LINE_WIDTH : DEFAULT_LINE_WIDTH,
      },
      connectgaps: true,
    };
  }

  // Compute the correct d3 value format string for the field type.
  // HACK(stephen): This function shouldn't live here and should be deleted
  // when we move to NVD3. They let you pass a callback for formatting!
  getAxisTickFormat(): ?string {
    const fieldId = this.props.controls.sortOn;

    const valueType = getFieldValueType(fieldId);
    if (valueType === FIELD_VALUE_TYPES.PERCENT) {
      return '.2p';
    }

    if (valueType === FIELD_VALUE_TYPES.CURRENCY) {
      return `${getFieldSymbol(fieldId)} .2f`;
    }

    return null;
  }

  getErrorBandToolTip(
    key: string,
    fieldId: string,
    valUp: number,
    valLow: number,
  ): string {
    return ReactDOMServer.renderToStaticMarkup(
      <span>
        <b>{key}</b>
        <br />
        <b>
          {`${this.props.seriesSettings.seriesObjects()[fieldId].label()}: `}
        </b>
        {formatNum((valLow + valUp) / 2)}
        <br />
        <b>{`${t('query_result.time.lower_bound')}: `}</b>
        {formatNum(parseInt(valLow, 10))}
        <br />
        <b>{`${t('query_result.time.upper_bound')}: `}</b>
        {formatNum(parseInt(valUp, 10))}
      </span>,
    ).replace(/<br\/>/g, '<br />'); // Plotly has a really annoying bug
    // where it doesn't recognized condensed break tags (<br/>).
    // React converts all break tags into the condensed version.
    // Adding a space to the tag allows Plotly's regex to match correctly.
  }

  /**
   * Create a QueryResultGrouping for the currently selected bucket type in
   * settings. This is used when the `groupBySettings` does not contain a
   * setting for the timestamp grouping. This should only happen in SQT where
   * the date granularity is chosen through the settings modal.
   * TODO(stephen, vinh): Remove this method when the timestamp grouping is
   * guaranteed to exist (i.e. when SQT is sunsetted).
   */
  @memoizeOne
  buildDefaultDateQueryResultGrouping(bucketType: string): QueryResultGrouping {
    return QueryResultGrouping.create({
      id: bucketType,
      type: 'DATE',
      displayValueFormat: BACKEND_GRANULARITIES[bucketType],
      label: bucketType,
    });
  }

  @memoizeOne
  buildDateLabels(
    dates: $ReadOnlyArray<RawTimestamp>,
    useEthiopianDates: boolean,
    groupBySettings: GroupBySettings,
    // NOTE(stephen): This parameter only matters for SQT. Remove it when SQT
    // querying style is removed.
    bucketType: string,
  ): $ReadOnlyArray<string> {
    const groupingObject = groupBySettings
      .groupings()
      .get(
        TIMESTAMP_GROUPING_ID,
        this.buildDefaultDateQueryResultGrouping(bucketType),
      );

    const labels = groupingObject.formatGroupingValues(
      dates,
      true,
      useEthiopianDates,
      true,
    );

    return buildPlotlyDateLabels(labels);
  }

  getDateLabels() {
    const { controls, groupBySettings, queryResult } = this.props;
    return this.buildDateLabels(
      queryResult.dates(),
      controls.useEthiopianDates,
      groupBySettings,
      controls.bucketType,
    );
  }

  /**
   * Use QueryReusltData to generate Plotly specific data
   */
  getPlotlyData(): any {
    const data = [];
    const { fields } = this.props;
    const { dates, lines } = this.props.queryResult.modelValues();
    if (!lines || lines.length === 0) {
      return data;
    }

    // Remove all fieldIds that have a forecast_ prefix
    const fieldIds = fields.map(field => field.id());
    let filteredFieldIds = fieldIds.filter(e => !e.includes('forecast'));
    if (filteredFieldIds.length < 1) {
      // User is graphing forecasts only, so just show them normally.
      filteredFieldIds = fieldIds;
    }

    const forecastFieldIds = new Set(
      fieldIds.filter(e => e.includes('forecast')),
    );
    const forecastErrorFieldIds = new Set(
      fieldIds.filter(e => e.includes('forecast_error')),
    );

    const {
      seriesObjects,
      seriesOrder,
    } = this.props.seriesSettings.modelValues();
    const y1AxisSeriesIds = new Set();
    const y2AxisSeriesIds = new Set();
    seriesOrder.forEach(seriesId => {
      const seriesObj = seriesObjects[seriesId];

      // add the series to an axis only if it's visible
      if (seriesObj.isVisible()) {
        const setToAdd =
          seriesObj.yAxis() === Y1_AXIS ? y1AxisSeriesIds : y2AxisSeriesIds;
        setToAdd.add(seriesId);
      }
    });

    let colorIdx = -1;

    // $CycloneIdaiHack
    let addedMalariaBounds = false;
    lines.forEach(lineData => {
      const { key } = lineData[0];
      filteredFieldIds.forEach(fieldId => {
        colorIdx++;

        if (y1AxisSeriesIds.has(fieldId) || y2AxisSeriesIds.has(fieldId)) {
          const point = this.getPlotlyLineObject(
            lineData,
            fieldId,
            dates,
            false,
            colorIdx,
          );
          // Add second Y-Axis.
          if (y2AxisSeriesIds.has(fieldId)) {
            point.yaxis = 'y2';
            point.marker.symbol = 'diamond-tall';
          }
          data.push(point);

          // Add giant hack for malaria corridor data to allow it to show up
          // with shading. Use the `addedMalariaBounds` so we don't can avoid
          // drawing the area object twice (once for upper and once for lower).
          // $CycloneIdaiHack
          if (
            DEPLOYMENT === 'mz' &&
            fieldId.endsWith('_bound') &&
            !addedMalariaBounds
          ) {
            let level;
            if (fieldId.startsWith('district_malaria_')) {
              level = 'district';
            } else if (fieldId.startsWith('facility_malaria_')) {
              level = 'facility';
            }

            if (level !== undefined) {
              addedMalariaBounds = true;
              // NOTE(stephen): Adding to front of array so that it is drawn at
              // the bottom and won't block hover events.
              data.unshift(
                this.buildTwoFieldCorridor(
                  lineData,
                  `${level}_malaria_lower_bound`,
                  `${level}_malaria_upper_bound`,
                  dates,
                  colorIdx,
                ),
              );
            }
            return;
          }

          // Get forecast_error and forecast prefix for the indicator being
          // plotted. If forecast then add to axis. If forecast_error then add
          // error band.
          const sigmaFieldId = `forecast_error_${fieldId}`;
          const forecastFieldId = getForecastFieldId(fieldId);

          // Check if forecast_fieldId exists in our list of forecastFeildIds
          if (forecastFieldIds.has(forecastFieldId)) {
            // All forecasts will have errors, check that one exists anyway.
            // Ordering of objects in `data` matters when layering annotations.
            // In this case, forecast data should end up over error bands.
            if (forecastErrorFieldIds.has(sigmaFieldId)) {
              data.push(
                this.getPlotlyAreaObject(
                  key,
                  lineData,
                  forecastFieldId,
                  sigmaFieldId,
                  this.getDateLabels(),
                  colorIdx,
                ),
              );
            }
            data.push(
              this.getPlotlyLineObject(
                lineData,
                forecastFieldId,
                dates,
                true,
                colorIdx,
              ),
            );
          }
        }
      });
    });
    return data;
  }

  maybeAddAnotations(layout, data): any {
    if (!this.props.controls.showDataLabels) {
      return layout;
    }
    const textValues = [];
    // Have the annotations hover above the series' by an amount scaled by
    // the maximum value.
    const textPadding =
      0.01 *
      Math.max(
        ...data.map(series =>
          Math.max(...series.y.filter(dataPoint => dataPoint !== undefined)),
        ),
      );
    data.forEach(dataPoint => {
      for (let i = 0; i < dataPoint.y.length; i++) {
        const yValue = dataPoint.y[i];
        const textValue = yValue ? `${yValue}` : ' ';
        const t = {
          x: dataPoint.x[i],
          y: yValue + textPadding,
          text: textValue,
          font: {
            family: 'Arial',
            size: 10,
            color: 'black',
          },
          showarrow: false,
        };

        textValues.push(t);
      }
    });
    const newLayout = Object.assign({}, layout);
    newLayout.annotations = textValues;
    return newLayout;
  }

  getGraphLayout(): any {
    const { axesSettings, seriesSettings, smallMode } = this.props;
    const {
      showLegend,
      legendFontSize,
      legendFontColor,
      legendFontFamily,
    } = this.props.legendSettings.modelValues();

    const xAxis = axesSettings.xAxis();
    const y1Axis = axesSettings.y1Axis();

    const scalingType = this.props.controls.logScaling ? 'log' : 'linear';

    const layout = {
      font: {
        size: smallMode ? 11 : 14,
      },
      margin: {
        l: 75,
        r: 56,
        t: 20,
        b: 115,
      },
      xaxis: {
        title: xAxis.title(),
        titlefont: {
          size: parseInt(xAxis.titleFontSize(), 10),
          color: xAxis.titleFontColor(),
          family: xAxis.titleFontFamily(),
        },
        showgrid: true,
        zeroline: true,
        autotick: true,
        ticks: '',
        showticklabels: true,
        tickfont: {
          size: parseInt(xAxis.labelsFontSize(), 10),
          color: xAxis.labelsFontColor(),
          family: xAxis.labelsFontFamily(),
        },
        tickangle: this.props.controls.rotateLabels ? 45 : 0,
        type: 'category',
        range: undefined,
      },
      legend: {
        orientation: 'v',
        font: {
          size: smallMode ? 12 : parseInt(legendFontSize, 10),
          color: legendFontColor,
          family: legendFontFamily,
        },
      },
      hovermode: 'closest',
      autosize: true,
      showlegend: showLegend,
      yaxis: undefined,
      yaxis2: undefined,
    };

    // TODO(stephen, any): Figure out why this doesn't work when using gregorian
    // dates (Plotly doesn't center the graph correctly because it parses the
    // dates as date types instead of strings).
    const dates = this.props.queryResult.dates();
    const dateCount = dates ? dates.length : 0;
    if (this.props.controls.useEthiopianDates && dateCount > 1) {
      // prettier-ignore
      layout.xaxis.range = [-0.1, (dateCount - 1) + 0.1];
    }

    const { y1AxisSeries, y2AxisSeries } = seriesSettings.getSeriesByAxes();
    if (y1AxisSeries.length > 0) {
      layout.yaxis = {
        range: [y1Axis.rangeFrom(), y1Axis.rangeTo()],
        type: scalingType,
        overlaying: 'y2',
        tickformat: this.getAxisTickFormat(),
        title: y1Axis.title(),
        titlefont: {
          size: parseInt(y1Axis.titleFontSize(), 10),
          color: y1Axis.titleFontColor(),
          family: y1Axis.titleFontFamily(),
        },
        showgrid: true,
        zeroline: true,
        showline: false,
        ticks: '',
        showticklabels: true,
        tickfont: {
          size: parseInt(y1Axis.labelsFontSize(), 10),
          color: y1Axis.labelsFontColor(),
          family: y1Axis.labelsFontFamily(),
        },
      };
    } else {
      // NOTE(pablo): Plotly can't have yaxis be undefined
      delete layout.yaxis;
    }

    if (y2AxisSeries.length > 0) {
      const y2Axis = axesSettings.y2Axis();

      layout.yaxis2 = {
        range: [y2Axis.rangeFrom(), y2Axis.rangeTo()],
        type: scalingType,
        tickformat: this.getAxisTickFormat(),
        title: y2Axis.title(),
        titlefont: {
          size: parseInt(y2Axis.titleFontSize(), 10),
          color: y2Axis.titleFontColor(),
          family: y2Axis.titleFontFamily(),
        },
        showgrid: true,
        zeroline: true,
        showline: false,
        ticks: '',
        side: 'right',
        showticklabels: true,
        tickfont: {
          size: parseInt(y2Axis.labelsFontSize(), 10),
          color: y2Axis.labelsFontColor(),
          family: y2Axis.labelsFontFamily(),
        },
      };
    } else {
      // NOTE(toshi): Plotly can't have yaxis2 be undefined
      delete layout.yaxis2;
    }
    return layout;
  }

  getLineGraphToolTip(
    key: string,
    fieldId: FieldId,
    val: number,
    percentDiffs: $ReadOnlyArray<?number>,
    index: number,
  ): string {
    let forecastDiffSpan = null;
    const difference = percentDiffs[index];
    if (
      percentDiffs.length > 0 &&
      difference !== null &&
      difference !== undefined
    ) {
      const quantifier =
        difference && difference < 0 ? TIME_TEXT.lower : TIME_TEXT.higher;
      const forecastText = TIME_TEXT.forecast_percent_diff_text;
      forecastDiffSpan = (
        <span>
          <br />
          <b>
            {Math.abs(difference)}%{quantifier}{' '}
          </b>
          {forecastText}
        </span>
      );
    }

    return ReactDOMServer.renderToStaticMarkup(
      <span>
        <b>{key}</b>
        <br />
        <b>
          {`${this.props.seriesSettings.seriesObjects()[fieldId].label()}: `}
        </b>
        {formatFieldValueForDisplay(val, fieldId)}
        {forecastDiffSpan}
      </span>,
    ).replace(/<br\/>/g, '<br />'); // Plotly has a really annoying bug
    // where it doesn't recognize condensed break tags (<br/>).
    // React converts all break tags into the condensed version.
    // Adding a space to the tag allows Plotly's regex to match correctly.
  }

  getSeriesTextForGeoAndField(key: ?string, fieldId: string): string {
    const { queryResult, seriesSettings } = this.props;
    let fullLine = '';
    if (this.props.fields.length === 1) {
      // TODO(stephen, pablo): standardize this. Using a 'null' string is gets
      // the point across analytically, but if the user wants to use this in a
      // report it is really ugly.
      fullLine = key || 'null';
    } else {
      const label = seriesSettings.seriesObjects()[fieldId].label();
      if (queryResult.uniqueDimensionValueCount() < 2 || key === null) {
        fullLine = label;
      } else if (key) {
        fullLine = `${key} - ${label}`;
      }
    }

    return truncate(fullLine, 40);
  }

  @autobind
  onResize() {
    const { current } = this._graphElt;
    if (current) {
      window.Plotly.Plots.resize(current);
    }
  }

  render() {
    return (
      <Visualization loading={this.props.loading}>
        <div ref={this._graphElt} />
      </Visualization>
    );
  }
}

export default withScriptLoader(LineGraph, {
  scripts: [VENDOR_SCRIPTS.plotly],
  loadingNode: <ProgressBar enabled />,
});
