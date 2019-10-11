// @flow
import * as React from 'react';
import moment from 'moment';

import * as Zen from 'lib/Zen';
import Legend from 'components/visualizations/common/Legend';
import NVLinePlusMultiBarChart from 'nvd3/line_plus_multi_bar_chart';
import ResizeService from 'services/ResizeService';
import Visualization from 'components/visualizations/common/Visualization';
import YAxisSettings from 'models/core/QueryResultSpec/VisualizationSettings/YAxisSettings';
import autobind from 'decorators/autobind';
import memoizeOne from 'decorators/memoizeOne';
import withWindowResizeSubscription, {
  dimensionsChanged,
} from 'components/ui/hocs/withWindowResizeSubscription';
import {
  AXIS_TYPES,
  X_AXIS,
  Y1_AXIS,
  Y2_AXIS,
} from 'components/visualizations/common/SettingsModal/AxesSettingsTab/constants';
import {
  BAR_GAP,
  DEFAULT_TIME_FORMAT,
  EMPTY_BAR_KEY,
  MARGIN_SETTINGS_SM,
  MARGIN_SETTINGS_LG,
  MOBILE_FONT_SIZE,
  buildBarTooltip,
  buildWarningMessageForQueryResult,
  getAxisTitleDistance,
  getDataFromPoint,
} from 'components/visualizations/BarGraph/util';
import { TIMESTAMP_GROUPING_ID } from 'models/core/QueryResultSpec/QueryResultGrouping';
import { debounce } from 'util/util';
import { truncate } from 'util/stringUtil';
import { visualizationDefaultProps } from 'components/visualizations/common/commonTypes';
import type BarGraphQueryResultData from 'components/visualizations/BarGraph/models/BarGraphQueryResultData';
import type { Dimensions } from 'types/common';
import type { VisualizationProps } from 'components/visualizations/common/commonTypes';

const MAX_LABELS = 50;
const MAX_LABEL_LENGTH = 20;
const MAX_LABEL_LENGTH_SMALL_MODE = 10;
const MIN_BARS_FOR_FOCUS_ENABLE = 50;

// Standard full-page width of the control.
const STANDARD_WIDTH_PX = 960;
const NO_DATA_TEXT = t('visualizations.common.noData');

function isAxisRangeSet(axisSettings: YAxisSettings): boolean {
  const { rangeFrom, rangeTo } = axisSettings.modelValues();
  return Number.isFinite(rangeFrom) && Number.isFinite(rangeTo);
}

type Props = $Merge<
  VisualizationProps<'CHART'>,
  {
    windowDimensions: Dimensions,
  },
>;

type State = {
  enableFocus: boolean,
};

type NVD3Chart = any;
type NVD3AxisId = 1 | 2;

// TODO(stephen): Lazy Loading
class BarGraph extends React.PureComponent<Props, State> {
  static defaultProps = {
    ...visualizationDefaultProps,
    resizeService: ResizeService,
  };

  state = {
    enableFocus: !this.props.smallMode,
  };

  _chart: NVD3Chart;

  // TODO(pablo): this is not type safe.
  // Flow expects refs to only be applied on HTML DOM nodes, not on SVGs.
  // Eventually once this moves to using VX to render the bar chart, we will
  // probably not need direct access to the SVG anymore, so this can be removed.
  _graphElt: $RefObject<any> = React.createRef();
  _warningMessage: string = '';

  constructor(props: Props) {
    super(props);

    // TODO(pablo): create a debounce decorator
    (this: any).onResize = debounce(this.onResize, 150);
  }

  componentDidMount() {
    this._chart = this.createChart(this.props);
    this.updateChartData();
  }

  componentDidUpdate(prevProps: Props) {
    // First check if any resize has happened
    const newWindowDimensions = this.props.windowDimensions;
    if (dimensionsChanged(prevProps.windowDimensions, newWindowDimensions)) {
      this.onResize();
    }

    // If the query result changed, then reset the warning message if necessary
    if (this.props.queryResult !== prevProps.queryResult) {
      this._warningMessage = buildWarningMessageForQueryResult(
        this.props.queryResult,
        this.props.fields,
      );
    }

    // Track if the chart settings have changed since the previous render.
    let chartSettingsModified = false;

    // If the chart type changes, we need to recreate it. Same goes for if the
    // fields changed (the tooltips for each bar need to be re-built,
    // because the data might be different)
    if (
      this.props.controls.y2LineGraph !== prevProps.controls.y2LineGraph ||
      this.props.fields !== prevProps.fields ||
      this.props.axesSettings.xAxis().additionalAxisTitleDistance() !==
        prevProps.axesSettings.xAxis().additionalAxisTitleDistance()
    ) {
      this._chart = this.createChart(this.props);
      chartSettingsModified = true;
    }

    // if the user selects to remove bar spacing we need to change that
    // setting on the chart
    if (
      this.props.controls.removeBarSpacing !==
      prevProps.controls.removeBarSpacing
    ) {
      this._chart.removeBarSpacing(this.props.controls.removeBarSpacing);
      chartSettingsModified = true;
    }

    // if the user selects to rotate x axis labels we need to change that
    // setting on the chart
    if (
      this.props.controls.rotateXAxisLabels !==
      prevProps.controls.rotateXAxisLabels
    ) {
      this._chart.rotateXAxisLabels(this.props.controls.rotateXAxisLabels);
      chartSettingsModified = true;
    }

    // if the user selects to hide grid lines we need to change that
    // setting on the chart
    if (
      this.props.controls.hideGridLines !== prevProps.controls.hideGridLines
    ) {
      this._chart.hideGridLines(this.props.controls.hideGridLines);
      chartSettingsModified = true;
    }

    // if the user selects to rotate data value labels we need to change that
    // setting on the chart
    if (
      this.props.controls.rotateDataValueLabels !==
      prevProps.controls.rotateDataValueLabels
    ) {
      this._chart.rotateDataValueLabels(
        this.props.controls.rotateDataValueLabels,
      );
      chartSettingsModified = true;
    }

    if (this.props.controls.noDataToZero !== prevProps.controls.noDataToZero) {
      chartSettingsModified = true;
    }

    // Result limit changes aren't very useful with the interactive
    // focus window, but they might be needed when the chart is displayed
    // statically (like on the dashboard).
    if (this.props.controls.resultLimit !== prevProps.controls.resultLimit) {
      this._chart.brushExtent([0, this.props.controls.resultLimit - 1]);
      chartSettingsModified = true;
    }

    if (this.props.controls.stackBars !== prevProps.controls.stackBars) {
      this._chart.bars.stacked(this.props.controls.stackBars);
      this._chart.bars2.stacked(this.props.controls.stackBars);
      chartSettingsModified = true;

      if (!this.props.controls.y2LineGraph) {
        this._chart.lines.stacked(this.props.controls.stackBars);
        this._chart.lines2.stacked(this.props.controls.stackBars);
      }
    }

    // Disable the focus window if we have a small number of bars.
    const enableFocus = this.shouldEnableFocus();
    if (enableFocus !== this._chart.focusEnable()) {
      this._chart.focusEnable(enableFocus);
      chartSettingsModified = true;
    }

    if (
      this.props.controls.xTickFormat !== prevProps.controls.xTickFormat ||
      this.props.controls.hideDataValueZeros !==
        prevProps.controls.hideDataValueZeros ||
      this.props.seriesSettings !== prevProps.seriesSettings
    ) {
      chartSettingsModified = true;
    }

    // eslint-disable-next-line no-bitwise
    chartSettingsModified =
      chartSettingsModified || this.processAxesChanges(prevProps);

    // If the chart settings have changed or the bar values are different,
    // update the chart.
    if (
      chartSettingsModified ||
      this.props.queryResult.bars() !== prevProps.queryResult.bars()
    ) {
      this.updateChartData();
    }
  }

  componentWillUnmount() {
    if (this._graphElt.current) {
      this._graphElt.current.innerHTML = '';
    }
  }

  createChart(props: Props): NVD3Chart {
    const {
      isMobile,
      smallMode,
      controls,
      axesSettings,
      seriesSettings,
    } = props;
    const {
      y2LineGraph,
      hideGridLines,
      removeBarSpacing,
      rotateXAxisLabels,
      rotateDataValueLabels,
    } = controls;
    const { y1AxisSeries, y2AxisSeries } = seriesSettings.getSeriesByAxes();

    // Remove any residual chart elements from previous renders.
    if (this._graphElt.current) {
      this._graphElt.current.innerHTML = '';
    }

    const baseMargins =
      isMobile || smallMode ? MARGIN_SETTINGS_SM : MARGIN_SETTINGS_LG;
    const marginSettings = { ...baseMargins };

    // TODO(stephen): Consolidate the axis settings changes into a single place
    // so that they can be initialized and updated without duplicating code.
    const xAxis = axesSettings.xAxis();
    const y1Axis = axesSettings.y1Axis();
    const y2Axis = axesSettings.y2Axis();

    // Lower the left/right margins if there is no axis shown on that side.
    if (y1AxisSeries.length === 0) {
      marginSettings.left -= 40;
    }

    if (y2AxisSeries.length === 0) {
      marginSettings.right -= 40;
    }

    if (xAxis.title()) {
      marginSettings.bottom +=
        getAxisTitleDistance(
          X_AXIS,
          xAxis.labelsFontSize(),
          xAxis.additionalAxisTitleDistance(),
        ) + 10;
    }

    // Setup base chart configuration
    const chart = NVLinePlusMultiBarChart(
      !y2LineGraph /* useBarForSecondAxis */,
    )
      .color(d => this.getFieldColor(d.key))
      .duration(300)
      .focusEnable(this.shouldEnableFocus())
      .focusHeight(50)
      .groupSpacing(BAR_GAP)
      .margin(marginSettings)
      .showLegend(false)
      .rotateXAxisLabels(rotateXAxisLabels)
      .rotateDataValueLabels(rotateDataValueLabels)
      .valueFormatter(this.formatDataForDisplay)
      .removeBarSpacing(removeBarSpacing)
      .hideGridLines(hideGridLines)
      // Set the default number of bars in the main chart
      // TODO(stephen): Need to handle when resultLimit == 1 and we only
      // want to display a single bar. Setting the brushExtent to [0, 0.9]
      // works as a temporary fix.
      .brushExtent([0, controls.resultLimit - 1]);

    if (props.controls.stackBars) {
      const { stackBars } = controls;
      chart.bars.stacked(stackBars);
      chart.bars2.stacked(stackBars);

      if (!y2LineGraph) {
        chart.lines.stacked(stackBars);
        chart.lines2.stacked(stackBars);
      }
    }

    chart.xAxis
      .axisLabel(xAxis.title())
      .axisLabelDistance(
        getAxisTitleDistance(
          X_AXIS,
          xAxis.labelsFontSize(),
          xAxis.additionalAxisTitleDistance(),
        ),
      )
      .fontSize(isMobile ? MOBILE_FONT_SIZE : xAxis.labelsFontSize())
      .labelFontSize(isMobile ? MOBILE_FONT_SIZE : xAxis.titleFontSize())
      .labelFontColor(xAxis.titleFontColor())
      .additionalAxisTitleDistance(xAxis.additionalAxisTitleDistance())
      .tickFontColor(xAxis.labelsFontColor())
      .labelFontFamily(xAxis.titleFontFamily())
      .tickFontFamily(xAxis.labelsFontFamily())
      .rotateLabels(45)
      .showMaxMin(false)
      .tickFormat(this.formatXTick.bind(this));

    chart.y1Axis.tickFormat(this.formatYTick.bind(this, 1));

    chart.y2Axis.tickFormat(this.formatYTick.bind(this, 2));

    if (y1AxisSeries.length > 0) {
      chart.y1Axis
        .axisLabel(y1Axis.title())
        .axisLabelDistance(
          getAxisTitleDistance(Y1_AXIS, y1Axis.labelsFontSize()),
        )
        .fontSize(isMobile ? MOBILE_FONT_SIZE : y1Axis.labelsFontSize())
        .labelFontSize(isMobile ? MOBILE_FONT_SIZE : y1Axis.titleFontSize())
        .labelFontColor(y1Axis.titleFontColor())
        .tickFontColor(y1Axis.labelsFontColor())
        .labelFontFamily(y1Axis.titleFontFamily())
        .tickFontFamily(y1Axis.labelsFontFamily());
      if (isAxisRangeSet(y1Axis)) {
        chart.bars.yDomain([y1Axis.rangeFrom(), y1Axis.rangeTo()]);
      }
      chart.y1Axis
        .goalLineValue(y1Axis.goalLine())
        .goalLineLabel(y1Axis.goalLineLabel())
        .goalLineFontSize(y1Axis.goalLineFontSize())
        .goalLineColor(y1Axis.goalLineColor())
        .goalLineThickness(y1Axis.goalLineThickness())
        .goalLineStyle(y1Axis.goalLineStyle());
    }

    if (y2AxisSeries.length > 0) {
      chart.y2Axis
        .axisLabel(y2Axis.title())
        .axisLabelDistance(
          getAxisTitleDistance(Y2_AXIS, y2Axis.labelsFontSize()),
        )
        .fontSize(isMobile ? MOBILE_FONT_SIZE : y2Axis.labelsFontSize())
        .labelFontSize(isMobile ? MOBILE_FONT_SIZE : y2Axis.titleFontSize())
        .labelFontColor(y2Axis.titleFontColor())
        .tickFontColor(y2Axis.labelsFontColor())
        .labelFontFamily(y2Axis.titleFontFamily())
        .tickFontFamily(y2Axis.labelsFontFamily());
      if (isAxisRangeSet(y2Axis)) {
        chart.lines.yDomain([y2Axis.rangeFrom(), y2Axis.rangeTo()]);
      }
      chart.y2Axis
        .goalLineValue(y2Axis.goalLine())
        .goalLineLabel(y2Axis.goalLineLabel())
        .goalLineFontSize(y2Axis.goalLineFontSize())
        .goalLineColor(y2Axis.goalLineColor())
        .goalLineThickness(y2Axis.goalLineThickness())
        .goalLineStyle(y2Axis.goalLineStyle());
    }

    if (this.props.isMobile) {
      return chart;
    }

    chart.tooltip.contentGenerator(point => {
      const data = getDataFromPoint(point);

      // HACK(stephen): If the bar being drawn is the placeholder empty bar
      // (used when drawing bars on multiple y-axis), then no tooltip should
      // be shown on hover.
      if (data.key === EMPTY_BAR_KEY) {
        return '';
      }

      const seriesObjects = this.props.seriesSettings.seriesObjects();
      const fieldSettings = seriesObjects[data.key];
      const fieldLabel = fieldSettings ? fieldSettings.label() : data.key;
      const fieldDisplayValue = this.formatDataForDisplay(data);
      const groupingDisplayValue = this.formatXTick(data.x);
      // HACK(stephen): GIANT HACK. Prevent the cumulative percentage line from
      // appearing in the tooltip if the value being shown is marked as a
      // percentage or the current bar is the nation-as-region hack.
      const excludeCumulativeLabel =
        fieldDisplayValue.endsWith('%') || groupingDisplayValue === 'Nation';

      return buildBarTooltip(
        groupingDisplayValue,
        fieldDisplayValue,
        fieldLabel,
        data.x,
        data.cumulativePercent,
        excludeCumulativeLabel,
      );
    });

    return chart;
  }

  // $CycloneIdaiHack
  // HACK(pablo): if a bar graph's values are all bucketed by time then we
  // want to enable data label formatting. Remove this hack once you
  // find a good way to represent label formatting for visualizations.
  @memoizeOne
  isDataBucketedByTime(queryResult: BarGraphQueryResultData): boolean {
    // check if every data object in the query result is a valid time bucket
    return queryResult
      .data()
      .every(dataObj => moment(dataObj.key, 'YYYY-MM-DD', true).isValid());
  }

  updateChartData(): void {
    // NOTE(stephen): Use requestAniationFrame to draw the chart to ensure the
    // DOM is not in a transitioning state when NVD3 runs. NVD3 uses various
    // DOM calculations to determine how to size the chart, so calling it
    // too early will result in a chart being drawn that is too small.
    window.requestAnimationFrame(this.drawChart);
  }

  @autobind
  drawChart(): void {
    // Render the data on the chart
    window.d3
      .select(this._graphElt.current)
      .datum(this.props.queryResult.bars())
      .call(this._chart)
      // Due to quirk in how we use NVD3's linePlusBarChart, we must
      // initialize the x-axis each time the chart is loaded so that
      // the correct values are displayed
      .call(this._chart.updateXAxis);
  }

  // Handle the new axes settings changes before rendering
  processAxesChanges(prevProps: Props): boolean {
    const { axesSettings, smallMode } = this.props;
    if (
      axesSettings === prevProps.axesSettings &&
      smallMode === prevProps.smallMode
    ) {
      return false;
    }

    Object.keys(AXIS_TYPES).forEach(axisType => {
      const axisName = AXIS_TYPES[axisType];
      const newAxisSettings = axesSettings.get(axisName);

      // If newAxisSettings is null (this only happens when there are no fields
      // assigned to an axis), skip this axis (there are no properties to set)
      if (!newAxisSettings) {
        return;
      }

      const {
        titleFontSize,
        titleFontColor,
        title,
        labelsFontSize,
        labelsFontColor,
        goalLine,
        goalLineColor,
        goalLineLabel,
        goalLineFontSize,
        goalLineThickness,
        goalLineStyle,
        titleFontFamily,
        labelsFontFamily,
        additionalAxisTitleDistance,
      } = newAxisSettings.modelValues();

      // Apply y-axis specific settings
      if (newAxisSettings instanceof YAxisSettings) {
        const yAxisSettings = Zen.cast<YAxisSettings>(newAxisSettings);
        const { rangeFrom, rangeTo } = yAxisSettings.modelValues();

        // Set the min and max values for the specified y-axis
        const seriesAxis =
          axisName === Y1_AXIS ? this._chart.bars : this._chart.lines;
        if (isAxisRangeSet(yAxisSettings)) {
          // Need to set the yDomain on the actual chart element that contains
          // the data since setting the axis objects only receive information
          // from those chart elements (which means setting the yDomain on the
          // axis won't do anything because the chart element will override it)
          seriesAxis.yDomain([rangeFrom, rangeTo]);
        } else {
          // If this axis has no range specified, then we reset yDomain to null
          // to have it be automatically managed by nvd3
          seriesAxis.yDomain(null);
        }

        this._chart[axisName]
          .goalLineValue(goalLine)
          .goalLineLabel(goalLineLabel)
          .goalLineFontSize(goalLineFontSize)
          .goalLineColor(goalLineColor)
          .goalLineThickness(goalLineThickness)
          .goalLineStyle(goalLineStyle);
      }

      // NOTE: this is confusing. What we refer to as 'labels', nvd3 actually
      // refers to as 'ticks'. What nvd3 calls 'label', we call 'title'.
      this._chart[axisName]
        .axisLabel(title)
        .axisLabelDistance(getAxisTitleDistance(axisName, labelsFontSize))
        .fontSize(labelsFontSize)
        .labelFontSize(titleFontSize)
        .labelFontColor(titleFontColor)
        .additionalAxisTitleDistance(additionalAxisTitleDistance)
        .tickFontColor(labelsFontColor)
        .labelFontFamily(titleFontFamily)
        .tickFontFamily(labelsFontFamily);
    });
    return true;
  }

  // Convert an x index into the appropriate x label and
  // ensure there is enough space between x-axis labels.
  formatXTick(x: number): string {
    const { controls, queryResult, smallMode } = this.props;

    // If a bar group spans outside the visible window,
    // an x index of -1 will be returned.
    if (x < 0 || queryResult.isEmpty()) {
      return '';
    }

    // Extract the current number of x values being displayed
    const count = this._chart.xAxis.scale().domain().length;

    // Determine the display frequency
    // NOTE(stephen): Using the SVG animation width values instead of
    // clientWidth to avoid triggering a reflow on each call to formatXTick.
    if (this._graphElt.current) {
      const width = this._graphElt.current.width.baseVal.value;
      const maxLabels = (MAX_LABELS * width) / STANDARD_WIDTH_PX;
      const displayEveryI = Math.ceil(count / maxLabels);

      // NOTE(stephen): This only works with the assumption that the x values
      // are linear.
      if (x % displayEveryI !== 0) {
        return '';
      }
      const barValue = queryResult.bars()[0].values[x] || {};
      let dataLabel = barValue.label || '';

      if (this.isDataBucketedByTime(queryResult)) {
        const timeGroupingObject = this.props.groupBySettings
          .groupings()
          .forceGet(TIMESTAMP_GROUPING_ID);

        dataLabel =
          controls.xTickFormat === DEFAULT_TIME_FORMAT
            ? timeGroupingObject.formatGroupingValue(dataLabel, true)
            : moment(dataLabel, 'YYYY-MM-DD').format(controls.xTickFormat);
      }

      const labelLength = smallMode
        ? MAX_LABEL_LENGTH_SMALL_MODE
        : MAX_LABEL_LENGTH;

      if (dataLabel.length - 3 < labelLength) {
        return dataLabel;
      }

      return truncate(dataLabel, labelLength);
    }
    return '';
  }

  // Use the field of the first bar for the given axis to determine the
  // number format of the y axis
  formatYTick(axisID: NVD3AxisId, y: ?number): string {
    return this.formatFieldValue(y, this.getFieldForYAxis(axisID));
  }

  @autobind
  formatDataForDisplay(data: { key: string, y: ?number }): string {
    if (this.props.isMobile) {
      return '';
    }

    const { key, y } = data;
    return this.formatFieldValue(y, key);
  }

  // Format a given value for the specified field. If the user has given a
  // specific value format to use, format according to those rules. Otherwise,
  // use the default format we have stored for this field.
  formatFieldValue(value: ?number, fieldId: string): string {
    // TODO(stephen): SeriesObjects will be empty if region code sorting is
    // used. Is that ok?
    const { seriesObjects } = this.props.seriesSettings.modelValues();
    const seriesObj = seriesObjects[fieldId];

    // seriesObj is empty if region code sorting is used
    const formattedValue = seriesObj
      ? seriesObj.formatFieldValue(value)
      : String(value);

    // HACK(pablo): a null value gets formatted as NO_DATA_TEXT, which
    // corresponds to a bar with 0 size. If `hideDataValueZeros` is set,
    // then we hide them. We still need to create a setting for
    // 'treatNoDataAsZeros', that way 'hideDataValueZeros' ONLY looks at 0s.
    if (
      formattedValue === NO_DATA_TEXT ||
      formattedValue === '0' ||
      formattedValue === 'null'
    ) {
      if (this.props.controls.hideDataValueZeros) {
        return '';
      }
    }

    // HACK(catherine, stephen) Checkbox control only for mz to render
    // 'No data' values as 0
    if (formattedValue === 'null' || formattedValue === NO_DATA_TEXT) {
      if (this.props.controls.noDataToZero) {
        return '0';
      }
    }

    return formattedValue;
  }

  // Return the field ID the given y-axis represents data for
  getFieldForYAxis(axisID: NVD3AxisId): string {
    const {
      seriesObjects,
      seriesOrder,
    } = this.props.seriesSettings.modelValues();
    const { sortOn } = this.props.controls;

    const desiredYAxis = axisID === 1 ? Y1_AXIS : Y2_AXIS;
    const axisSeriesObjs = seriesOrder
      .map(id => seriesObjects[id])
      .filter(seriesObj => seriesObj.yAxis() === desiredYAxis);

    // Return this axis's first bar's field, or default to the currently
    // sorted field if there are no bars
    return axisSeriesObjs.length ? axisSeriesObjs[0].id() : sortOn;
  }

  getFieldColor(fieldId: string): string {
    const seriesObj = this.props.seriesSettings.seriesObjects()[fieldId];

    // HACK(stephen): If the bar being drawn is the placeholder empty bar
    // (used when drawing bars on multiple y-axis), then the background color
    // should be transparent.
    if (fieldId === EMPTY_BAR_KEY || seriesObj === undefined) {
      return 'rgba(0, 0, 0, 0)';
    }

    return seriesObj.color();
  }

  shouldEnableFocus(): boolean {
    return (
      this.state.enableFocus &&
      this.props.queryResult.barGroupCount() > MIN_BARS_FOR_FOCUS_ENABLE
    );
  }

  @autobind
  onResize() {
    this.updateChartData();
  }

  @autobind
  onToggleSeries(fieldId: string) {
    const disabledFields = { ...this.props.controls.disabledFields };
    disabledFields[fieldId] = !disabledFields[fieldId];
    this.props.onControlsSettingsChange('disabledFields', disabledFields);
  }

  maybeRenderLegend() {
    const { seriesSettings, legendSettings, isMobile } = this.props;
    const { seriesOrder, seriesObjects } = seriesSettings.modelValues();

    // get the series that are still set as visible in the settings modal
    const visibleSeries = seriesOrder
      .filter(id => seriesObjects[id].isVisible())
      .map(id => seriesObjects[id]);

    if (!this.props.legendSettings.showLegend() || visibleSeries.length < 2) {
      return null;
    }

    const fontSize = isMobile
      ? MOBILE_FONT_SIZE
      : legendSettings.legendFontSize();
    const fontColor = legendSettings.legendFontColor();
    const fontFamily = legendSettings.legendFontFamily();
    return (
      <div className="legend-container">
        <Legend
          disabledSeriesIds={this.props.controls.disabledFields}
          seriesObjects={visibleSeries}
          onToggleSeries={this.onToggleSeries}
          fontSize={fontSize}
          fontColor={fontColor}
          fontFamily={fontFamily}
        />
      </div>
    );
  }

  render() {
    // Don't render the warning message if the query result is in present mode.
    const warningMessage = this.props.isPresentMode ? '' : this._warningMessage;
    return (
      <Visualization
        loading={this.props.loading}
        footer={this.maybeRenderLegend()}
        warning={warningMessage}
      >
        <svg className="bar-graph" ref={this._graphElt} />
      </Visualization>
    );
  }
}

// TODO(pablo): Eventually this components should use the @vx/responsive
// library's <ParentSize> component the same way that BumpChart does
export default withWindowResizeSubscription(BarGraph);
