// @flow
import type { NumberTrendTheme } from 'components/ui/visualizations/NumberTrend/types';

export const DEFAULT_THEME: NumberTrendTheme = {
  primaryNumber: {
    displayValueAsPill: false,
    labelFontSize: 17,
    valueFontColor: '#000000',
    valueFontSize: 29,
  },
  secondaryNumber: {
    fontSize: 13,
    valueFontColor: '#000000',
  },
  trendHeight: 75,
  trendWidth: 500,
};
