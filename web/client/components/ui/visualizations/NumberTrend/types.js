// @flow

export type NumberTrendTheme = {
  primaryNumber: {
    displayValueAsPill: boolean,
    labelFontSize: number | string,
    valueFontColor: string,
    valueFontSize: number | string,
  },
  secondaryNumber: {
    fontSize: number | string,
    valueFontColor: string,
  },

  /** Height to render trend line */
  trendHeight: number,

  /** Width to render trend line */
  trendWidth: number,
};

export type NumberProperties = {
  label: string,
  value: string,
};

export type TrendPoint = { date: string, value: number };
