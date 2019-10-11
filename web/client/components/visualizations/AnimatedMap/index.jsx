import PropTypes from 'prop-types';
import React from 'react';
import moment from 'moment';

import LegacyMap from 'components/visualizations/AnimatedMap/LegacyMap';
import MapTimeline from 'components/visualizations/AnimatedMap/MapTimeline';
import PropDefs from 'util/PropDefs';
import {
  BACKEND_GRANULARITIES,
  BUCKET_TYPE,
} from 'components/QueryResult/timeSeriesUtil';
import { autobind } from 'decorators';
import { visualizationPropDefs } from 'components/visualizations/common/commonPropDefs';

// The earliest date value is the default value for the timeline view.
const DEFAULT_DATE_INDEX = 0;

// Max bubble radius.
const MAX_BUBBLE_RADIUS = 80;

// Minimum bubble radius.
const MIN_BUBBLE_RADIUS = 7;

// Null bubble radius.
const NULL_BUBBLE_RADIUS = 2;

// NOTE(stephen): Why is this the preferred date format???
const DATE_FORMAT = 'DD-MMMM-YYYY';

const propDefs = PropDefs.create('animatedMap')
  .addGroup(visualizationPropDefs)
  .propTypes({
    // eslint-disable-next-line max-len
    onControlsSettingsChange: PropTypes.func.isRequired, // f(controlType, value)
  });

// Build on ordered list of unique dates for this query result's series.
function getDates(series) {
  if (!series || series.length === 0) {
    return [];
  }

  // HACK(stephen): Assume the dates contained in the first series are the
  // same for all series (this follows the previous behavior).
  // HACK(stephen): Assume that each field has the same dates returned. I
  // don't know WHY the `dates` property is just a list of dates for each
  // field with no metadata. It's essentially a concatenated list of the
  // dates used for each field with no indication of the field ordering or
  // how to slice it.
  const allDates = series[0].dates;
  if (allDates.length === 0) {
    return [];
  }

  const dates = [allDates[0]];
  for (let i = 1; i < allDates.length; i++) {
    const curDate = allDates[i];
    // Find the inflection point of the concatenated date series.
    // allDates is of the form [d0..dn, d0..dn, d0..dn, ...]
    if (curDate < dates[i - 1]) {
      break;
    }
    dates.push(curDate);
  }

  return dates;
}

// Safely access the series object of a possibly undefined queryResult.
function extractSeries(queryResult) {
  return queryResult ? queryResult.series() : undefined;
}

function calculateFieldMinMax(series, selectedField) {
  if (series === undefined) {
    return [undefined, undefined];
  }

  const seriesId = `yValue_date_${selectedField}`;
  return series.reduce(
    ([curMin, curMax], curSeries) => {
      const [seriesMin, seriesMax] = curSeries[seriesId].reduce(
        ([curSeriesMin, curSeriesMax], val) => [
          Math.min(curSeriesMin, val),
          Math.max(curSeriesMax, val),
        ],
        [Infinity, -Infinity],
      );
      return [Math.min(seriesMin, curMin), Math.max(seriesMax, curMax)];
    },
    [Infinity, -Infinity],
  );
}

export default class AnimatedMap extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      dateIndex: DEFAULT_DATE_INDEX,
      fieldMin: undefined,
      fieldMax: undefined,
    };

    this.dates = getDates(extractSeries(this.props.queryResult));
    this.newFormattedDates = this.dates.map(dateStr =>
      moment.utc(dateStr, moment.ISO_8601).format(DATE_FORMAT),
    );
  }

  componentDidUpdate(prevProps) {
    const newState = {};

    // Check if the query result data has changed.
    const nextSeries = extractSeries(this.props.queryResult);
    const series = extractSeries(prevProps.queryResult);
    if (nextSeries !== series) {
      newState.dateIndex = DEFAULT_DATE_INDEX;
      this.dates = getDates(nextSeries);
      this.newFormattedDates = getDates(nextSeries).map(dateStr =>
        moment.utc(dateStr, moment.ISO_8601).format(DATE_FORMAT),
      );
      this.setState(newState);
    }

    // Update the computed min/max values for the selected field.
    if (
      prevProps.controls.selectedField !== this.props.controls.selectedField ||
      nextSeries !== series ||
      this.state.fieldMin === undefined ||
      this.state.fieldMax === undefined
    ) {
      [newState.fieldMin, newState.fieldMax] = calculateFieldMinMax(
        nextSeries,
        this.props.controls.selectedField,
      );
      this.setState(newState);
    }
  }

  @autobind
  getMarkerValue(dimObj, fieldId) {
    // (HACK)nina: We create separate 'dates' and 'formattedDates' fields so
    // that we can use 'dates' to access the correct index to date mapping, and
    // still use 'formattedDates' to pass into the MapTimeline modal. This issue
    // of getting the correct value (to account for missing bucket data) will
    // ideally be addressed in a more efficient way, once the work for
    // combining Map, AnimatedMap, and HeatMap begins
    const fieldValues = dimObj[`yValue_date_${fieldId}`];
    const dimObjDates = dimObj.dates;
    const { dateIndex } = this.state;
    const { dates } = this;

    if (fieldValues) {
      const dateValue = dates[dateIndex];
      if (dimObjDates.indexOf(dateValue) !== -1) {
        const correctIdx = dimObjDates.indexOf(dateValue);
        const valIdx = fieldValues[correctIdx];
        return valIdx;
      }
      return undefined;
    }
    return 0;
  }

  @autobind
  getMarkerSize(dimObj) {
    const fieldId = this.props.controls.selectedField;
    const val = this.getMarkerValue(dimObj, fieldId);
    if (val === 0) {
      // Special treatment for 0'ed values.
      // This could be done below but I want there to be a step between 0
      // vs non-zero values.
      return MIN_BUBBLE_RADIUS;
    }

    // NOTE(stephen): Should this only be looking at min/max of the filtered
    // result or is it ok if the full result is used?
    const { fieldMin, fieldMax } = this.state;

    if (Number.isNaN(val) || fieldMax === fieldMin) {
      return NULL_BUBBLE_RADIUS;
    }

    // prettier-ignore
    const radius = ((val - fieldMin) / (fieldMax - fieldMin)) * 30;
    // Capping radius at 80.
    return Math.min(MAX_BUBBLE_RADIUS, radius);
  }

  @autobind
  onDateChange(dateIndex) {
    // We only care about the date index since that is how we index into the
    // series field data.
    this.setState({
      dateIndex,
    });
  }

  renderAdditionalFooterContent() {
    return (
      <MapTimeline
        dates={this.newFormattedDates}
        onDateChange={this.onDateChange}
      />
    );
  }

  render() {
    return (
      <LegacyMap
        {...this.props}
        dateGranularity={BACKEND_GRANULARITIES[BUCKET_TYPE.MONTH]}
        getMarkerValue={this.getMarkerValue}
        getMarkerSize={this.getMarkerSize}
        additionalFooterContent={this.renderAdditionalFooterContent()}
      />
    );
  }
}

PropDefs.setComponentProps(AnimatedMap, propDefs);
