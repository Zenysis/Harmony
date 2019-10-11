import Promise from 'bluebird';

import ZenClient from 'util/ZenClient';
import { SERIES_COLORS } from 'components/QueryResult/graphUtil';

// Default color of bubble or geo shape color.
export const DEFAULT_BUBBLE_COLOR = SERIES_COLORS[0];

let facilitiesListCache = null;

// eslint-disable-next-line import/prefer-default-export
export function getFacilitiesWithLatlng() {
  return new Promise(resolve => {
    if (facilitiesListCache) {
      // Already loaded.
      resolve(facilitiesListCache);
      return;
    }

    const url = 'facilities';
    ZenClient.request(url).then(facilities => {
      // TODO(ian): Handle error.
      facilitiesListCache = facilities;
      resolve(facilities);
    });
  });
}

export function getColorForValue(filters, val) {
  if (
    !filters ||
    (Object.keys(filters).length === 0 && filters.constructor === Object)
  ) {
    // If no color filters then return the regular ones.
    return DEFAULT_BUBBLE_COLOR;
  }
  if (filters.colorEqual) {
    const { color, value } = filters.colorEqual;
    if (
      value === val ||
      // NOTE(stephen): If the value to color is null, we should also allow
      // an input value of `undefined` to match the color rule as well.
      (value === null && val === undefined)
    ) {
      return color;
    }
  }

  if (filters.colorTop && val >= filters.colorTop.value) {
    return filters.colorTop.color;
  }
  if (filters.colorAbove && val > filters.colorAbove.value) {
    return filters.colorAbove.color;
  }
  if (filters.colorAboveAverage && val > filters.colorAboveAverage.value) {
    return filters.colorAboveAverage.color;
  }
  if (filters.colorBottom && val <= filters.colorBottom.value) {
    return filters.colorBottom.color;
  }
  if (filters.colorBelow && val < filters.colorBelow.value) {
    return filters.colorBelow.color;
  }
  if (filters.colorBelowAverage && val < filters.colorBelowAverage.value) {
    return filters.colorBelowAverage.color;
  }
  if (filters.colorRangeProps) {
    const { colorRangeProps } = filters;
    const { rangeVals } = colorRangeProps;
    for (let idx = 0; idx < rangeVals.length; idx++) {
      if (
        parseFloat(val) >= parseFloat(rangeVals[idx][0]) &&
        parseFloat(val) <= parseFloat(rangeVals[idx][1])
      ) {
        return colorRangeProps.rangeColors[idx];
      }
    }
  }
  return DEFAULT_BUBBLE_COLOR;
}
