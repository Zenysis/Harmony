// @flow
import type { BarGraphTheme } from 'components/ui/visualizations/BarGraph/types';

export const DEFAULT_THEME: BarGraphTheme = {
  axis: {
    xAxis: {
      maxInnerLayerTextLength: undefined,
      stroke: 'black',
      ticks: {
        color: 'black',
        label: {},
      },
      title: {
        fill: 'black',
        fontSize: 12,
        textAnchor: 'middle',
      },
    },
    y1Axis: {
      stroke: 'black',
      ticks: {
        color: 'black',
        label: {
          fill: '#000000',
          pointerEvents: 'none',
          textAnchor: 'end',
          fontSize: 12,
          dx: '-0.25em',
          dy: '0.25em',
        },
      },
      title: {
        fill: 'black',
        fontSize: 12,
        textAnchor: 'middle',
      },
    },
    y2Axis: {
      stroke: 'black',
      ticks: {
        color: 'black',
        label: {
          fill: '#000000',
          pointerEvents: 'none',
          textAnchor: 'start',
          fontSize: 12,
          dx: '0.25em',
          dy: '0.25em',
        },
      },
      title: {
        fill: 'black',
        fontSize: 12,
        textAnchor: 'middle',
      },
    },
  },
  backgroundColor: 'white',
  focus: {
    activeColor: '#ffffff00',
    height: 30,
    inactiveColor: '#ffffffbb',
  },
  groupPadding: 0.2,
  innerBarPadding: 0,
  minBarHeight: 2,
  minBarWidth: 20,
  stroke: '#ffffff00',
  strokeWidth: 0,
  tickColor: '#000000',
  goalLine: {
    hover: {
      backgroundColor: '#e3e7f1',
      lineColor: 'black',
      textStyle: {
        fill: '#293742',
        fontSize: 12,
        fontWeight: 500,
      },
    },
    placed: {
      backgroundColor: '#c6cbef',
      lineColor: 'black',
      textStyle: {
        fill: '#293742',
        fontSize: 12,
        fontWeight: 700,
      },
    },
  },
};
