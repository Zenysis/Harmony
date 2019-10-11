import React from 'react';
import ReactDOMServer from 'react-dom/server';

import Tooltip from 'components/visualizations/BarGraph/Tooltip';
import {
  X_AXIS,
  Y1_AXIS,
  Y2_AXIS,
} from 'components/visualizations/common/SettingsModal/AxesSettingsTab/constants';

export const DEFAULT_TIME_FORMAT = 'Default';

export const BAR_GAP = 0.2;

export const MARGIN_SETTINGS_LG = {
  left: 125,
  right: 105,
  top: 25,
  bottom: 165,
};

// NOTE(stephen): The bottom margin here works best when paired with the
// MOBILE_FONT_SIZE on the x-axis.
export const MARGIN_SETTINGS_SM = {
  left: 95,
  right: 95,
  top: 35,
  bottom: 95,
};

export const MOBILE_FONT_SIZE = '12px';

export const EMPTY_BAR_KEY = 'empty_bar';
const STROKE_WIDTH = 3;

// Amount of padding to adjust for when positioning the axis title
// relative to the axis labels.
const AXIS_TITLE_OFFSET = {
  [X_AXIS]: 0,
  [Y1_AXIS]: -10,
  [Y2_AXIS]: -20,
};

export function filterQueryResultData(resultData, filters) {
  const data = resultData.slice();
  if (filters.isEmpty()) {
    return data;
  }

  return filters.reduce(
    (newData, dataFilter) => dataFilter.filterRows(newData),
    data,
  );
}

// NOTE(stephen): This would be a useful derived value of SeriesSettings but
// it's too bar graph specific.
export function buildBarSettings(seriesObject, isDisabled) {
  const y2Axis = seriesObject.yAxis() === Y2_AXIS;
  return {
    color: seriesObject.color(),
    disabled: isDisabled || !seriesObject.isVisible(),
    showValues: seriesObject.showSeriesValue(),
    strokeWidth: y2Axis ? STROKE_WIDTH : undefined,
    valueFontSize: seriesObject.dataLabelFontSize(),
    y2Axis,
  };
}

function getDataFromBarPoint(point) {
  const { cumulativePercent, key, label, x, y } = point.data;
  return { cumulativePercent, key, label, x, y };
}

function getDataFromLinePoint(point) {
  const { cumulativePercent, label, x, y } = point.point;
  return {
    cumulativePercent,
    key: point.series[0].key,
    label,
    x,
    y,
  };
}

// NVD3 does not return a consistent object with the tooltip callback.
// Bar uses point.data, line uses point.point
export function getDataFromPoint(point) {
  return point.data ? getDataFromBarPoint(point) : getDataFromLinePoint(point);
}

// Build the static HTML needed to power tooltips on the bar graph
export function buildBarTooltip(
  dimensionValue,
  fieldDisplayValue,
  fieldLabel,
  index,
  cumulativePercent,
  excludeCumulativeLabel,
) {
  // TODO(stephen): Investigate using a native react component for the tooltip
  // because NVD3 allows you to specify where in the DOM the tooltip lives
  return ReactDOMServer.renderToStaticMarkup(
    <div>
      <Tooltip
        cumulativePercent={cumulativePercent}
        excludeCumulativeLabel={excludeCumulativeLabel}
        dimensionValue={dimensionValue}
        field={fieldLabel}
        fieldValue={fieldDisplayValue}
        index={index}
      />
    </div>,
  );
}

// Calculate the spacing needed to ensure the axis title does not overlap
// the axis labels.
export function getAxisTitleDistance(
  axisName,
  labelFontSizeInPixels,
  additionalDistance = '0px',
) {
  const rawDistance =
    2 * parseInt(labelFontSizeInPixels, 10) + parseInt(additionalDistance, 10);
  return rawDistance + AXIS_TITLE_OFFSET[axisName];
}

export function buildWarningMessageForQueryResult(queryResult, fields) {
  // Check for server side errors
  if (!queryResult) {
    return t('visualizations.common.warnings.server');
  }

  // Find all the fields that returned no data or all zeros
  const totals = queryResult.totals();
  const emptyFields = [];

  fields.forEach(field => {
    const id = field.id();
    if (!totals[id]) {
      emptyFields.push(field.label());
    }
  });

  // Only warn if there are empty fields
  if (!emptyFields.length) {
    return '';
  }

  return `${t('visualizations.common.warnings.emptyFields')} ${emptyFields.join(
    ', ',
  )}`;
}

// HACK(stephen): When placing multiple bars on Y1Axis and Y2Axis, NVD3 will
// draw the bars on top of each other instead of placing them offset. This is a
// limitations in NVD3, since each y-axis series is distinct and has no
// knowledge of the other series being shown. To get the behavior we desire,
// we add empty placeholder bars on each y-axis series so that a spot is
// reserved but not drawn. This prevents the overlap issue and lets the bars
// render in their correct slot. Stacked bars are not supported.
// Ref: T2090
export function addEmptyBars(data) {
  const y1Bars = [];
  const y2Bars = [];

  // Unfortunately, NVD3 won't render the bars with a proper height if the
  // first enabled bar of the series has an empty values array. To workaround
  // this, we copy the x positioning of the first bar and set y to 0 so that the
  // bars have minimal height.
  const emptyValues = data[0].values.map(d => ({
    label: d.label,
    x: d.x,
    y: 0,
  }));

  data.forEach(bar => {
    const y1Axis = bar.bar;
    const emptyBar = {
      key: EMPTY_BAR_KEY,
      bar: !y1Axis,
      disabled: bar.disabled,
      nonStackable: true,
      values: emptyValues,
    };

    y1Bars.push(y1Axis ? bar : emptyBar);
    y2Bars.push(!y1Axis ? bar : emptyBar);
  });
  return y1Bars.concat(y2Bars);
}
